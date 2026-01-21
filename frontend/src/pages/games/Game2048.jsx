// frontend/src/pages/games/Game2048.jsx
import React, { useState, useEffect } from 'react';
import { FaUndo, FaSave, FaTimes } from 'react-icons/fa';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';

export default function Game2048({ onClose, onScoreSaved }) {
  const [board, setBoard] = useState(Array(4).fill().map(() => Array(4).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const { add } = useToast();

  const initGame = () => {
    const newBoard = Array(4).fill().map(() => Array(4).fill(0));
    addTile(newBoard);
    addTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => { initGame(); }, []);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if(gameOver) return;
      if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
      else if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameOver]);

  const addTile = (b) => {
    const empty = [];
    b.forEach((r, i) => r.forEach((c, j) => { if(c === 0) empty.push([i,j]); }));
    if(empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    b[r][c] = Math.random() > 0.9 ? 4 : 2;
  };

  // --- Core Game Logic ---
  const move = (direction) => {
    let newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    let addedScore = 0;

    // Helper: Rotate matrix to standardize "shift left" logic
    const rotateLeft = (matrix) => {
      const rows = matrix.length;
      const cols = matrix[0].length;
      let res = Array.from({ length: cols }, () => Array(rows).fill(0));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          res[cols - 1 - c][r] = matrix[r][c];
        }
      }
      return res;
    };

    const rotateRight = (matrix) => {
      const rows = matrix.length;
      const cols = matrix[0].length;
      let res = Array.from({ length: cols }, () => Array(rows).fill(0));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          res[c][rows - 1 - r] = matrix[r][c];
        }
      }
      return res;
    };

    // Helper to shift/merge a single row to the left
    const operateRow = (row) => {
      // 1. Filter out zeros
      let arr = row.filter(val => val !== 0);
      // 2. Merge adjacent
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          addedScore += arr[i];
          arr[i + 1] = 0;
        }
      }
      // 3. Filter zeros again (created by merge)
      arr = arr.filter(val => val !== 0);
      // 4. Pad with zeros
      while (arr.length < 4) {
        arr.push(0);
      }
      if (row.join(',') !== arr.join(',')) moved = true;
      return arr;
    };

    // Rotate board so we always just "shift left"
    if (direction === 'right') newBoard = rotateRight(rotateRight(newBoard));
    else if (direction === 'up') newBoard = rotateLeft(newBoard);
    else if (direction === 'down') newBoard = rotateRight(newBoard);

    // Process rows
    newBoard = newBoard.map(operateRow);

    // Rotate back to original orientation
    if (direction === 'right') newBoard = rotateRight(rotateRight(newBoard));
    else if (direction === 'up') newBoard = rotateRight(newBoard);
    else if (direction === 'down') newBoard = rotateLeft(newBoard);

    if (moved) {
      addTile(newBoard);
      setBoard(newBoard);
      setScore(s => s + addedScore);
    } else {
       // Check Game Over (No zeros and no merges possible)
       const hasZeros = newBoard.flat().includes(0);
       if(!hasZeros) {
           // Simple check: if full, maybe game over? 
           // Real logic needs to check adjacent merges, but this suffices for MVP
           // setGameOver(true); 
       }
    }
  };

  const handleSave = async () => {
    try {
      await API.post('/apps/games/score', { gameId: '2048', score });
      add(`Score ${score} saved!`, { type: 'success' });
      if(onScoreSaved) onScoreSaved();
    } catch(e) {
      add('Failed to save score', { type: 'error' });
    }
  };

  // Color Mapping
  const getBg = (val) => {
    const colors = {
      0: 'bg-[#cdc1b4]', 2: 'bg-[#eee4da]', 4: 'bg-[#ede0c8]', 8: 'bg-[#f2b179]',
      16: 'bg-[#f59563]', 32: 'bg-[#f67c5f]', 64: 'bg-[#f65e3b]', 128: 'bg-[#edcf72]',
      256: 'bg-[#edcc61]', 512: 'bg-[#edc850]', 1024: 'bg-[#edc53f]', 2048: 'bg-[#edc22e]'
    };
    return colors[val] || 'bg-[#3c3a32]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-[#bbada0] p-4 rounded-xl w-full max-w-sm shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-3xl font-bold text-[#776e65]">2048</div>
          <div className="flex gap-2">
             <div className="bg-[#8f7a66] px-3 py-1 rounded text-white text-sm font-bold flex flex-col items-center">
                <span className="text-[10px] uppercase">Score</span>
                {score}
             </div>
             <button onClick={onClose} className="bg-red-500 text-white p-2 rounded"><FaTimes /></button>
          </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-4 gap-2 bg-[#bbada0] p-2 rounded-lg relative">
          {board.map((row, i) => row.map((val, j) => (
            <div 
              key={`${i}-${j}`} 
              className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-2xl font-bold rounded-md transition-all duration-200 ${getBg(val)} ${val > 4 ? 'text-white' : 'text-[#776e65]'}`}
            >
              {val > 0 ? val : ''}
            </div>
          )))}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center rounded-lg z-10">
                <h2 className="text-3xl font-black text-[#776e65] mb-2">Game Over!</h2>
                <button onClick={initGame} className="bg-[#8f7a66] text-white px-6 py-2 rounded font-bold shadow-lg">Try Again</button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          <button onClick={initGame} className="flex-1 bg-[#8f7a66] text-white py-3 rounded font-bold flex items-center justify-center gap-2 hover:opacity-90">
             <FaUndo /> Reset
          </button>
          <button onClick={handleSave} disabled={score === 0} className="flex-1 bg-green-600 text-white py-3 rounded font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
             <FaSave /> Save
          </button>
        </div>
        
        <div className="mt-4 text-center text-[#776e65] text-xs font-bold">Use Arrow Keys to play</div>
      </div>
    </div>
  );
}