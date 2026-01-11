// frontend/src/pages/games/GamesPage.jsx
import React, { useState, useEffect } from 'react';
import { FaGamepad, FaTrophy, FaPlay } from 'react-icons/fa';
import API from '../../services/api';
import SnakeGame from './SnakeGame'; 
import Game2048 from './Game2048';
import TriviaGame from './TriviaGame';

const GAMES = [
  { id: 'snake', name: 'Neon Snake', color: 'from-green-400 to-cyan-500', icon: '🐍' },
  { id: '2048', name: '2048 Pro', color: 'from-yellow-400 to-orange-500', icon: '🔢' },
  { id: 'quiz', name: 'Trivia Royale', color: 'from-purple-500 to-pink-500', icon: '❓' },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState(null); // Which leaderboard to show
  const [leaderboard, setLeaderboard] = useState([]);
  const [playingGame, setPlayingGame] = useState(null); // 'snake', '2048', 'quiz'

  const loadLeaderboard = async (gameId) => {
    setActiveGame(gameId);
    try {
      const res = await API.get(`/apps/games/${gameId}/leaderboard`);
      setLeaderboard(res.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-black mb-6 bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-3">
        <FaGamepad /> Arcade Zone
      </h1>

      {/* Game Selector */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {GAMES.map(g => (
          <div key={g.id} onClick={() => loadLeaderboard(g.id)} className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transform hover:scale-105 transition-all shadow-xl bg-gradient-to-br ${g.color}`}>
            <div className="text-6xl mb-4">{g.icon}</div>
            <h3 className="text-2xl font-bold text-white">{g.name}</h3>
            <button 
                onClick={(e) => { e.stopPropagation(); setPlayingGame(g.id); }} 
                className="mt-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-white/30 transition"
            >
              <FaPlay /> Play Now
            </button>
          </div>
        ))}
      </div>

      {/* Leaderboard Section */}
      {activeGame && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg animate-fade-in">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> Leaderboard: {GAMES.find(g=>g.id===activeGame)?.name}
          </h3>
          <div className="space-y-3">
            {leaderboard.length === 0 ? <div className="text-gray-500 text-center py-4">Be the first to play!</div> : 
              leaderboard.map((score, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold w-6 text-center ${i<3 ? 'text-yellow-500 text-xl' : 'text-gray-400'}`}>#{i+1}</span>
                    <img src={score.user?.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover" alt="User" />
                    <span className="font-medium">{score.user?.name}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-500">{score.score} pts</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Game Modals */}
      {playingGame === 'snake' && (
          <SnakeGame 
            onClose={() => setPlayingGame(null)} 
            onScoreSaved={() => loadLeaderboard('snake')} 
          />
      )}
      {playingGame === '2048' && (
          <Game2048 
            onClose={() => setPlayingGame(null)} 
            onScoreSaved={() => loadLeaderboard('2048')}
          />
      )}
      {playingGame === 'quiz' && (
          <TriviaGame 
            onClose={() => setPlayingGame(null)} 
            onScoreSaved={() => loadLeaderboard('quiz')}
          />
      )}
    </div>
  );
}