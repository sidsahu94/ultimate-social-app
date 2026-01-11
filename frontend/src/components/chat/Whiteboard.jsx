// frontend/src/components/chat/Whiteboard.jsx
import React, { useRef, useEffect, useState } from 'react';
import socket from '../../services/socket';
import { FaEraser, FaPen, FaSave, FaTimes } from 'react-icons/fa';

export default function Whiteboard({ roomId, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;
    ctx.lineCap = 'round';

    const onDrawEvent = ({ x, y, color, size, type }) => {
      ctx.lineWidth = size;
      ctx.strokeStyle = color;
      if (type === 'start') {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else if (type === 'move') {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };

    socket.on('wb:draw', onDrawEvent);
    return () => socket.off('wb:draw', onDrawEvent);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX || e.touches[0].clientX) - rect.left,
      y: (e.clientY || e.touches[0].clientY) - rect.top
    };
  };

  const startDraw = (e) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    socket.emit('wb:draw', { roomId, x, y, color, size: brushSize, type: 'start' });
  };

  const moveDraw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    socket.emit('wb:draw', { roomId, x, y, color, size: brushSize, type: 'move' });
  };

  const endDraw = () => setIsDrawing(false);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl overflow-hidden shadow-2xl relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 flex flex-col gap-3 bg-white shadow-lg p-2 rounded-lg border">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
          <button onClick={() => setColor('#ffffff')} className="p-2 hover:bg-gray-100 rounded"><FaEraser /></button>
          <input type="range" min="2" max="20" value={brushSize} onChange={e => setBrushSize(e.target.value)} className="w-20 -rotate-90 mt-8 mb-4" />
          <button onClick={onClose} className="p-2 bg-red-100 text-red-500 rounded"><FaTimes /></button>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          className="bg-white cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}