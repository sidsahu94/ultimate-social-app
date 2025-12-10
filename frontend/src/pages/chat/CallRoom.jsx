// frontend/src/pages/chat/CallRoom.jsx
import React, { useRef } from 'react';
import socket from '../../services/socket';
import Peer from 'simple-peer';
import { useParams } from 'react-router-dom';

export default function CallRoom() {
  const { roomId } = useParams();
  const myVideo = useRef();
  const peerVideo = useRef();
  let peer;

  const start = () => {
    navigator.mediaDevices.getUserMedia({ video:true, audio:true }).then(stream => {
      myVideo.current.srcObject = stream;
      socket.emit('joinRoom', { room:roomId });

      socket.on('user-joined', () => {
        peer = new Peer({ initiator: true, trickle:false, stream });
        peer.on('signal', data => socket.emit('signal', { roomId, data }));
        peer.on('stream', remote => peerVideo.current.srcObject = remote);
      });

      socket.on('signal', data => peer && peer.signal(data));
    });
  };

  return (
    <div className="flex h-screen gap-2 p-3">
      <video ref={myVideo} autoPlay muted className="w-1/2"/>
      <video ref={peerVideo} autoPlay className="w-1/2"/>
      <button onClick={start} className="btn-primary absolute bottom-6 right-6">Start</button>
    </div>
  );
}
