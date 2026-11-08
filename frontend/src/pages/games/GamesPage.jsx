// frontend/src/pages/games/GamesPage.jsx
import React, { useState, useEffect } from 'react';
import { FaGamepad, FaTrophy, FaPlay } from 'react-icons/fa';
import API from '../../services/api';
import SnakeGame from './SnakeGame'; 
import Game2048 from './Game2048';
import TriviaGame from './TriviaGame';

const GAMES = [
  { id: 'snake', name: 'Cyber Snake', color: 'from-[#0F766E] to-[#00F2FE]', icon: '🐍' },
  { id: '2048', name: '2048 Elite', color: 'from-[#D4AF37] to-[#F4D49A]', icon: '🔢' },
  { id: 'quiz', name: 'Trivia Royale', color: 'from-[#1D4ED8] to-[#052E24]', icon: '❓' },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState('snake'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [playingGame, setPlayingGame] = useState(null); 

  useEffect(() => {
    loadLeaderboard('snake');
  }, []);

  const loadLeaderboard = async (gameId) => {
    setActiveGame(gameId);
    setLeaderboard([]);
    try {
      const res = await API.get(`/apps/games/${gameId}/leaderboard`);
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setLeaderboard(data);
    } catch (e) { 
        console.error("Leaderboard load failed", e); 
        setLeaderboard([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
          <FaGamepad /> Interactive Hub
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#F7F7FC] tracking-tight font-display">
          Arcade Zone<span className="text-[#00F2FE]">.</span>
        </h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">
          Challenge your peers in competitive minigames and climb the global leaderboards.
        </p>
      </div>

      {/* Game Selector */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {GAMES.map(g => (
          <div 
            key={g.id} 
            onClick={() => loadLeaderboard(g.id)} 
            className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transform hover:scale-[1.02] transition-all shadow-2xl bg-gradient-to-br ${g.color} border transition-all ${
              activeGame === g.id 
                ? 'border-[#00F2FE] ring-2 ring-[#00F2FE]/40 shadow-[0_0_30px_rgba(100,223,223,0.35)]' 
                : 'border-white/20'
            } group`}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{g.icon}</div>
            <h3 className="text-2xl font-bold text-white font-display">{g.name}</h3>
            <button 
                onClick={(e) => { e.stopPropagation(); setPlayingGame(g.id); }} 
                className="mt-5 bg-black/30 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-black/50 transition border border-white/20 shadow-lg"
            >
              <FaPlay size={10} /> Play Now
            </button>
          </div>
        ))}
      </div>

      {/* Leaderboard Section */}
      {activeGame && (
        <div className="bg-[#070B14]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl animate-fade-in">
          <h3 className="text-lg font-bold text-[#F7F7FC] mb-4 flex items-center gap-2">
            <FaTrophy className="text-[#F4D49A]" /> Leaderboard: {GAMES.find(g=>g.id===activeGame)?.name}
          </h3>
          <div className="space-y-2.5">
            {leaderboard.length === 0 ? (
              <div className="text-[#A5A9BB] text-center py-8 text-xs">Be the first to record a score on this board!</div>
            ) : (
              leaderboard.map((score, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-[#04070D] border border-white/5 rounded-2xl hover:border-white/15 transition">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold w-6 text-center ${i < 3 ? 'text-[#F4D49A] text-lg font-black' : 'text-[#A5A9BB] text-sm'}`}>#{i+1}</span>
                    <img src={score.user?.avatar || '/default-avatar.png'} className="w-9 h-9 rounded-full object-cover border border-white/10" alt="User" />
                    <span className="font-semibold text-sm text-[#F7F7FC]">{score.user?.name}</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#00F2FE] bg-[#0F766E]/20 px-3 py-1 rounded-full border border-[#0F766E]/30">{score.score} pts</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Game Modals */}
      {playingGame === 'snake' && <SnakeGame onClose={() => setPlayingGame(null)} onScoreSaved={() => loadLeaderboard('snake')} />}
      {playingGame === '2048' && <Game2048 onClose={() => setPlayingGame(null)} onScoreSaved={() => loadLeaderboard('2048')} />}
      {playingGame === 'quiz' && <TriviaGame onClose={() => setPlayingGame(null)} onScoreSaved={() => loadLeaderboard('quiz')} />}
    </div>
  );
}
