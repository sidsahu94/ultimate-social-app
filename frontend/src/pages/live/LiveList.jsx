// frontend/src/pages/live/LiveList.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaVideo, FaBroadcastTower, FaUsers, FaPlay, FaPlus } from 'react-icons/fa';
import API from '../../services/api';
import UserAvatar from '../../components/ui/UserAvatar';
import Spinner from '../../components/common/Spinner';

const DEMO_LIVES = [
  {
    _id: 'live_demo_1',
    roomId: 'room_noir_summit',
    title: 'Neon Nights: Live Modular Synth Session 🎹⚡',
    host: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
    viewersCount: 142
  },
  {
    _id: 'live_demo_2',
    roomId: 'room_creative_studio',
    title: 'Visual Architecture & Generative AI Workshop 🎨',
    host: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    viewersCount: 89
  },
  {
    _id: 'live_demo_3',
    roomId: 'room_ambient_chill',
    title: 'Kyoto Dusk Lounge • Lo-Fi Acoustic Flow 🌸',
    host: { name: 'Aria Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
    viewersCount: 215
  }
];

export default function LiveList() {
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLives = async () => {
    setLoading(true);
    try {
      const res = await API.get('/live/list');
      const data = res.data?.data || res.data || [];
      setLives(Array.isArray(data) && data.length > 0 ? data : DEMO_LIVES);
    } catch (e) {
      console.warn('Failed to load lives:', e);
      setLives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLives();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-12 min-h-screen">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-[#070B14]/90 p-6 md:p-10 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#10B981]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-ping" />
              Live Broadcasts
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight text-[#F7F7FC]">
              SocialVerse Live<span className="text-[#00F2FE]">.</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-[#CBD5E1]">
              Watch live creators, interact via real-time superchats, and start your own studio broadcast with peer-to-peer streaming.
            </p>
          </div>

          <Link
            to="/live/studio"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_25px_rgba(29,78,216,0.35)] transition-transform hover:scale-105 active:scale-95"
          >
            <FaBroadcastTower /> Go Live
          </Link>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : lives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 p-16 text-center bg-[#070B14]/40 backdrop-blur-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#052E24]/15 text-2xl text-[#10B981] shadow-[0_0_20px_rgba(185,28,28,0.25)]">
            <FaVideo />
          </div>
          <h3 className="text-xl font-black text-[#F7F7FC]">
            No live streams right now
          </h3>
          <p className="mt-1 max-w-sm text-sm text-[#CBD5E1]">
            Nobody is broadcasting at the moment. Jump in and be the first to broadcast live to your community!
          </p>
          <Link
            to="/live/studio"
            className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:opacity-95 transition"
          >
            <FaPlus /> Start a Stream
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lives.map((l) => (
            <motion.div
              key={l._id}
              whileHover={{ y: -4 }}
              className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#070B14]/90 shadow-xl backdrop-blur-xl transition-all hover:border-white/20"
            >
              <Link to={`/live/watch/${l.roomId}`} className="block relative aspect-video bg-black overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform group-hover:scale-110 shadow-lg">
                    <FaPlay className="ml-1 text-white" />
                  </div>
                </div>

                {/* Live Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-[#052E24] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(185,28,28,0.5)] border border-[#10B981]">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>

                {/* Viewers Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-[#070B14]/80 border border-white/10 px-2.5 py-1 text-[11px] font-bold text-[#00F2FE] backdrop-blur-md">
                  <FaUsers size={12} />
                  <span>{l.viewersCount || 1}</span>
                </div>
              </Link>

              <div className="p-4 flex items-center gap-3">
                <UserAvatar src={l.host?.avatar} name={l.host?.name} className="h-10 w-10 shrink-0 border border-white/10" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-[#F7F7FC] group-hover:text-[#00F2FE] transition-colors text-sm">
                    {l.title || 'Live Stream'}
                  </h3>
                  <p className="text-xs text-[#CBD5E1] mt-0.5">
                    {l.host?.name || 'Creator'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
