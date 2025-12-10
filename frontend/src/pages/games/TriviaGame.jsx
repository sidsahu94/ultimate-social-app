
import React, { useState } from 'react';
import API from '../../services/api';
import { FaCheck, FaTimes } from 'react-icons/fa';

const QUESTIONS = [
  { q: "What is the capital of France?", a: ["London", "Berlin", "Paris", "Madrid"], c: 2 },
  { q: "Who wrote Harry Potter?", a: ["Tolkien", "JK Rowling", "GRR Martin", "King"], c: 1 },
  { q: "What is 5 + 7?", a: ["10", "11", "12", "13"], c: 2 },
];

export default function TriviaGame({ onClose }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const answer = (i) => {
    if(i === QUESTIONS[idx].c) setScore(s => s + 100);
    
    if(idx + 1 < QUESTIONS.length) {
      setIdx(i => i + 1);
    } else {
      setFinished(true);
      API.post('/apps/games/score', { gameId: 'quiz', score: score + (i === QUESTIONS[idx].c ? 100 : 0) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/90 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
        {!finished ? (
          <>
            <h2 className="text-gray-500 font-bold mb-4 uppercase tracking-widest">Question {idx + 1}</h2>
            <h3 className="text-2xl font-black mb-8 text-gray-800">{QUESTIONS[idx].q}</h3>
            <div className="space-y-3">
              {QUESTIONS[idx].a.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => answer(i)}
                  className="w-full py-4 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 font-bold transition text-lg"
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="py-10">
            <h2 className="text-4xl font-black text-purple-600 mb-4">Quiz Complete!</h2>
            <div className="text-6xl mb-6">🏆</div>
            <p className="text-2xl font-bold text-gray-800 mb-8">Score: {score}</p>
            <button onClick={onClose} className="btn-primary w-full py-3">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}