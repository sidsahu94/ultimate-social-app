// backend/controllers/callsController.js
const crypto = require('crypto');
const ActiveCall = require('../models/ActiveCall');
const { getRouter } = require('../services/mediasoup');

const createRoomId = () => {
  if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return (
    (Math.random() * 1e9 | 0).toString(36) +
    Date.now().toString(36)
  );
};

// REST API: Room Management
exports.createRoom = async (req, res) => {
  try {
    const roomId = createRoomId();

    await ActiveCall.create({
      roomId,
      host: req.user._id,
      participants: [req.user._id],
    });

    res.json({ roomId });
  } catch (err) {
    console.error('Create Room Error:', err);
    res.status(500).json({ message: 'Error creating room' });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const call = await ActiveCall.findOne({ roomId });

    if (!call) {
      return res.status(404).json({ message: 'Room not found or expired' });
    }

    const userIdStr = String(req.user._id);
    const participantsStr = (call.participants || []).map((p) => String(p));

    if (!participantsStr.includes(userIdStr)) {
      call.participants.push(req.user._id);
      await call.save();
    }

    res.json({ joined: true, roomId });
  } catch (err) {
    console.error('Join Room Error:', err);
    res.status(500).json({ message: 'Error joining room' });
  }
};

// SOCKET.IO: Mediasoup WebRTC Signaling
exports.handleCallSockets = (io, socket) => {
  const router = getRouter();

  let producerTransport = null;
  let consumerTransport = null;
  let currentRoomId = null;
  const activeProducers = new Map();
  const activeConsumers = new Map();

  socket.on('join-socket-room', ({ roomId }) => {
    if (!roomId) return;
    currentRoomId = roomId;
    socket.join(roomId);
  });

  socket.on('getRouterRtpCapabilities', (callback = () => {}) => {
    try {
      if (!router) return callback({ error: 'WebRTC Router not initialized' });
      callback(router.rtpCapabilities);
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on('createWebRtcTransport', async ({ sender }, callback = () => {}) => {
    try {
      if (!router) return callback({ error: 'WebRTC Router not initialized' });
      const listenIp = process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0';
      const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || (process.env.NODE_ENV === 'production' ? undefined : '127.0.0.1');

      const transport = await router.createWebRtcTransport({
        listenIps: [
          {
            ip: listenIp,
            announcedIp: announcedIp,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      if (sender) producerTransport = transport;
      else consumerTransport = transport;

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (error) {
      console.error('Transport creation error:', error);
      callback({ error: error.message });
    }
  });

  socket.on('transport-connect', async ({ dtlsParameters, sender } = {}) => {
    try {
      if (sender && producerTransport) {
        await producerTransport.connect({ dtlsParameters });
      } else if (!sender && consumerTransport) {
        await consumerTransport.connect({ dtlsParameters });
      } else if (producerTransport) {
        await producerTransport.connect({ dtlsParameters });
      } else if (consumerTransport) {
        await consumerTransport.connect({ dtlsParameters });
      }
    } catch (error) {
      console.error('transport-connect error:', error);
    }
  });

  socket.on('transport-produce', async ({ kind, rtpParameters }, callback = () => {}) => {
    try {
      if (!producerTransport) {
        return callback({ error: 'Producer transport not created' });
      }

      const producer = await producerTransport.produce({
        kind,
        rtpParameters,
      });

      activeProducers.set(producer.id, producer);

      if (currentRoomId) {
        socket.to(currentRoomId).emit('new-producer', {
          producerId: producer.id,
          socketId: socket.id,
        });
      }

      producer.on('transportclose', () => {
        try {
          producer.close();
          activeProducers.delete(producer.id);
        } catch (_) {}
      });

      callback({ id: producer.id });
    } catch (error) {
      console.error('Error producing media:', error);
      callback({ error: error.message });
    }
  });

  socket.on('transport-consume', async ({ rtpCapabilities, producerId }, callback = () => {}) => {
    try {
      if (!router) return callback({ error: 'WebRTC Router not initialized' });
      if (!consumerTransport) return callback({ error: 'Consumer transport not created' });
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        return callback({ error: 'Cannot consume producer' });
      }

      const consumer = await consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: false,
      });

      activeConsumers.set(consumer.id, consumer);

      consumer.on('transportclose', () => {
        try {
          consumer.close();
          activeConsumers.delete(consumer.id);
        } catch (_) {}
      });

      consumer.on('producerclose', () => {
        try {
          socket.emit('producer-closed', { producerId });
          consumer.close();
          activeConsumers.delete(consumer.id);
        } catch (_) {}
      });

      callback({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (error) {
      console.error('Error consuming media:', error);
      callback({ error: error.message });
    }
  });

  socket.on('disconnect', () => {
    for (const consumer of activeConsumers.values()) {
      try { consumer.close(); } catch (_) {}
    }
    activeConsumers.clear();

    for (const producer of activeProducers.values()) {
      try { producer.close(); } catch (_) {}
    }
    activeProducers.clear();

    try {
      if (producerTransport) producerTransport.close();
    } catch (_) {}
    try {
      if (consumerTransport) consumerTransport.close();
    } catch (_) {}
  });
};