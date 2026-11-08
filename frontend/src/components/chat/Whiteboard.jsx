import React, { useEffect, useRef, useState } from 'react';
import socket from '../../services/socket';
import { FaEraser, FaTimes } from 'react-icons/fa';

export default function Whiteboard({ roomId, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00F2FE');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(window.innerWidth * 0.8);
    canvas.height = Math.floor(window.innerHeight * 0.6);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const onDrawEvent = ({ x, y, color: remoteColor, size, type }) => {
      ctx.lineWidth = size;
      ctx.strokeStyle = remoteColor;
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
    const point = e.touches?.[0] || e;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
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
    e.preventDefault?.();
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#070B14] shadow-[0_25px_80px_rgba(0,0,0,.8)]">
        <div className="absolute left-4 top-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0A111E]/90 p-3 backdrop-blur-xl z-10 shadow-lg">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded bg-transparent border-0" />
          <button onClick={() => setColor('#070B14')} title="Eraser" className="rounded p-2 text-[#CBD5E1] hover:bg-white/10 transition">
            <FaEraser />
          </button>
          <input
            type="range"
            min="2"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="mb-4 mt-8 w-20 -rotate-90 accent-[#00F2FE]"
          />
          <button onClick={onClose} className="rounded bg-[#052E24]/30 p-2 text-[#FF6B8A] hover:bg-[#052E24]/60 transition">
            <FaTimes />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          className="cursor-crosshair touch-none bg-[#04070D]"
        />
      </div>
    </div>
  );
}
