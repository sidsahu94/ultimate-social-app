// frontend/src/components/games/SnakeGame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaTrophy, FaTimes, FaPlay, FaRedo, FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';

const GRID_SIZE = 20;
const SPEED = 150;

export default function SnakeGame({ onClose, onScoreSaved }) {
  const [snake, setSnake] = useState([[5, 5]]);
  const [food, setFood] = useState([10, 10]);
  const [dir, setDir] = useState([0, 1]); // [y, x]
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { add } = useToast();
  const gameLoop = useRef();

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      changeDir(e.key);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dir]);

  const changeDir = (key) => {
      if (key === 'ArrowUp' && dir[0] !== 1) setDir([-1, 0]);
      if (key === 'ArrowDown' && dir[0] !== -1) setDir([1, 0]);
      if (key === 'ArrowLeft' && dir[1] !== 1) setDir([0, -1]);
      if (key === 'ArrowRight' && dir[1] !== -1) setDir([0, 1]);
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    gameLoop.current = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameLoop.current);
  });

  const moveSnake = () => {
    const newHead = [snake[0][0] + dir[0], snake[0][1] + dir[1]];

    if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) return endGame();
    if (snake.some(s => s[0] === newHead[0] && s[1] === newHead[1])) return endGame();

    const newSnake = [newHead, ...snake];
    if (newHead[0] === food[0] && newHead[1] === food[1]) {
      setScore(s => s + 10);
      setFood([Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)]);
    } else {
      newSnake.pop();
    }
    setSnake(newSnake);
  };

  const endGame = async () => {
    setGameOver(true);
    setIsPlaying(false);
    clearInterval(gameLoop.current);
    try {
      await API.post('/apps/games/score', { gameId: 'snake', score });
      add(`Score: ${score} saved!`, { type: 'success' });
      if(onScoreSaved) onScoreSaved();
    } catch(e) {}
  };

  const startGame = () => {
    setSnake([[5, 5]]);
    setFood([10, 10]);
    setDir([0, 1]);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-gray-900 p-4 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-sm relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 text-white">
          <div className="flex items-center gap-2 font-bold text-yellow-400 text-xl"><FaTrophy /> {score}</div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-red-500 transition"><FaTimes /></button>
        </div>

        {/* Game Board */}
        <div className="relative w-full aspect-square bg-gray-800 rounded-lg overflow-hidden grid border border-gray-700" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const y = Math.floor(i / GRID_SIZE);
            const x = i % GRID_SIZE;
            const isSnake = snake.some(s => s[0] === y && s[1] === x);
            const isFood = food[0] === y && food[1] === x;
            return (
              <div key={i} className={`${isSnake ? 'bg-green-500 rounded-sm' : isFood ? 'bg-red-500 rounded-full animate-pulse' : ''}`} />
            );
          })}
          
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-white z-10">
              {gameOver && <div className="text-3xl font-black text-red-500 mb-2">GAME OVER</div>}
              <button onClick={startGame} className="btn-primary flex items-center gap-2 px-8 py-3 text-lg rounded-full animate-bounce">
                {gameOver ? <><FaRedo /> Try Again</> : <><FaPlay /> Start Game</>}
              </button>
            </div>
          )}
        </div>
        
        {/* Mobile Controls */}
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-[200px] mx-auto md:hidden">
            <div />
            <button onPointerDown={() => changeDir('ArrowUp')} className="p-4 bg-gray-700 rounded-lg active:bg-green-500 text-white"><FaArrowUp /></button>
            <div />
            <button onPointerDown={() => changeDir('ArrowLeft')} className="p-4 bg-gray-700 rounded-lg active:bg-green-500 text-white"><FaArrowLeft /></button>
            <div className="flex items-center justify-center text-gray-500 text-xs font-bold">PAD</div>
            <button onPointerDown={() => changeDir('ArrowRight')} className="p-4 bg-gray-700 rounded-lg active:bg-green-500 text-white"><FaArrowRight /></button>
            <div />
            <button onPointerDown={() => changeDir('ArrowDown')} className="p-4 bg-gray-700 rounded-lg active:bg-green-500 text-white"><FaArrowDown /></button>
            <div />
        </div>

        <div className="mt-4 text-center text-gray-500 text-xs hidden md:block">Use Arrow Keys to Play</div>
      </div>
    </div>
  );
}