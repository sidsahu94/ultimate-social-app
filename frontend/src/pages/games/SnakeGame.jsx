// frontend/src/pages/games/SnakeGame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaTrophy, FaTimes, FaPlay, FaRedo } from 'react-icons/fa';
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
  const [isPlaying, setIsPlaying] = useState(false); // New state to track start
  const { add } = useToast();
  const gameLoop = useRef();

  // Focus trap for keyboard
  useEffect(() => {
    const handleKey = (e) => {
      // Prevent default scrolling when playing
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      
      switch(e.key) {
        case 'ArrowUp': if(dir[0]!==1) setDir([-1, 0]); break;
        case 'ArrowDown': if(dir[0]!==-1) setDir([1, 0]); break;
        case 'ArrowLeft': if(dir[1]!==1) setDir([0, -1]); break;
        case 'ArrowRight': if(dir[1]!==-1) setDir([0, 1]); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dir]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    gameLoop.current = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameLoop.current);
  });

  const moveSnake = () => {
    const newHead = [snake[0][0] + dir[0], snake[0][1] + dir[1]];

    // Collision Walls
    if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) return endGame();
    // Collision Self
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full relative">
        <div className="flex justify-between items-center mb-4 text-white">
          <div className="flex items-center gap-2 font-bold text-yellow-400"><FaTrophy /> {score}</div>
          <button onClick={onClose}><FaTimes className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden grid border border-gray-700" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const y = Math.floor(i / GRID_SIZE);
            const x = i % GRID_SIZE;
            const isSnake = snake.some(s => s[0] === y && s[1] === x);
            const isFood = food[0] === y && food[1] === x;
            return (
              <div key={i} className={`${isSnake ? 'bg-green-500 rounded-sm shadow-[0_0_5px_rgba(34,197,94,0.8)]' : isFood ? 'bg-red-500 rounded-full animate-pulse' : ''}`} />
            );
          })}
          
          {/* Overlay for Start / Game Over */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white z-10">
              {gameOver && <div className="text-3xl font-black text-red-500 mb-2">GAME OVER</div>}
              <button onClick={startGame} className="btn-primary flex items-center gap-2 px-8 py-3 text-lg rounded-full animate-bounce">
                {gameOver ? <><FaRedo /> Try Again</> : <><FaPlay /> Start Game</>}
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-gray-500 text-xs">Use Arrow Keys (Desktop)</div>
      </div>
    </div>
  );
}