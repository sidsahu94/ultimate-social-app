// frontend/src/pages/games/SnakeGame.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTrophy, FaTimes, FaPlay, FaRedo } from 'react-icons/fa';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';

const GRID_SIZE = 20;
const SPEED = 150;

export default function SnakeGame({ onClose, onScoreSaved }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { add } = useToast();

  // Using refs to prevent stale closure mechanics inside the rendering interval loop
  const snakeRef = useRef([[5, 5]]);
  const foodRef = useRef([10, 10]);
  const dirRef = useRef([0, 1]); // Stored as array offsets: [y, x]
  const gameLoopRef = useRef(null);
  
  // React-driven local state updates mirroring refs for UI rendering safely
  const [renderState, setRenderState] = useState({ snake: [[5, 5]], food: [10, 10] });

  const processInputDirection = useCallback((e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    
    const currentDir = dirRef.current;
    switch (e.key) {
      case 'ArrowUp':
        if (currentDir[0] !== 1) dirRef.current = [-1, 0];
        break;
      case 'ArrowDown':
        if (currentDir[0] !== -1) dirRef.current = [1, 0];
        break;
      case 'ArrowLeft':
        if (currentDir[1] !== 1) dirRef.current = [0, -1];
        break;
      case 'ArrowRight':
        if (currentDir[1] !== -1) dirRef.current = [0, 1];
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', processInputDirection);
    return () => window.removeEventListener('keydown', processInputDirection);
  }, [processInputDirection]);

  const endGame = useCallback(async (currentScore) => {
    setGameOver(true);
    setIsPlaying(false);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    try {
      await API.post('/apps/games/score', { gameId: 'snake', score: currentScore });
      add(`Score: ${currentScore} saved!`, { type: 'success' });
      if (onScoreSaved) onScoreSaved();
    } catch (e) {
      console.error('Failed to preserve score runtime metrics:', e);
    }
  }, [add, onScoreSaved]);

  const moveSnake = useCallback(() => {
    const snake = [...snakeRef.current];
    const dir = dirRef.current;
    const newHead = [snake[0][0] + dir[0], snake[0][1] + dir[1]];

    // Wall Intersections
    if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
      endGame(score);
      return;
    }
    
    // Self-Harm Intersections
    if (snake.some(s => s[0] === newHead[0] && s[1] === newHead[1])) {
      endGame(score);
      return;
    }

    const newSnake = [newHead, ...snake];
    const food = foodRef.current;

    // Consumption validation
    if (newHead[0] === food[0] && newHead[1] === food[1]) {
      setScore((s) => {
        const nextScore = s + 10;
        // Keep the payload updated inside nested loops
        return nextScore;
      });
      foodRef.current = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    setRenderState({ snake: newSnake, food: foodRef.current });
  }, [endGame, score]);

  // Track dynamically updating score references safely inside dependencies
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    gameLoopRef.current = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameLoopRef.current);
  }, [isPlaying, gameOver, moveSnake]);

  const startGame = () => {
    snakeRef.current = [[5, 5]];
    foodRef.current = [10, 10];
    dirRef.current = [0, 1];
    setScore(0);
    setGameOver(false);
    setRenderState({ snake: [[5, 5]], food: [10, 10] });
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full relative">
        <div className="flex justify-between items-center mb-4 text-white">
          <div className="flex items-center gap-2 font-bold text-yellow-400">
            <FaTrophy /> {score}
          </div>
          <button onClick={onClose} aria-label="Close game">
            <FaTimes className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <div 
          className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden grid border border-gray-700" 
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const y = Math.floor(i / GRID_SIZE);
            const x = i % GRID_SIZE;
            const isSnake = renderState.snake.some(s => s[0] === y && s[1] === x);
            const isFood = renderState.food[0] === y && renderState.food[1] === x;
            
            return (
              <div 
                key={i} 
                className={`${
                  isSnake 
                    ? 'bg-green-500 rounded-sm shadow-[0_0_5px_rgba(34,197,94,0.8)]' 
                    : isFood 
                    ? 'bg-red-500 rounded-full animate-pulse' 
                    : ''
                }`} 
              />
            );
          })}
          
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white z-10">
              {gameOver && <div className="text-3xl font-black text-red-500 mb-2">GAME OVER</div>}
              <button 
                onClick={startGame} 
                className="btn-primary flex items-center gap-2 px-8 py-3 text-lg rounded-full animate-bounce bg-blue-600 hover:bg-blue-700 font-medium"
              >
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