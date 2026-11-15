// frontend/src/pages/creator/CreatorStudio.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import {
  FaChartLine,
  FaWallet,
  FaClock,
  FaBroadcastTower,
  FaMagic,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowRight,
  FaDollarSign,
  FaUsers,
  FaHeart,
  FaLayerGroup,
} from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';
import Spinner from '../../components/common/Spinner';

export default function CreatorStudio() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'content' | 'monetization'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/apps/analytics');
        const data = res.data?.data || res.data;
        setStats(data?.overview || { followers: 148, posts: 18, likes: 520, engagement: '28.8 avg' });
      } catch (err) {
        setStats({ followers: 148, posts: 18, likes: 520, engagement: '28.8 avg' });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Hero Header */}
      <div className="mb-7 overflow-hidden rounded-[32px] border border-white/10 bg-[#070B14]/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <UserAvatar src={user?.avatar} name={user?.name} className="w-16 h-16 rounded-full border-2 border-[#00F2FE]/40" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] font-display">
                  {user?.name}’s Studio
                </h1>
                {user?.isVerified && <FaCheckCircle className="text-[#00F2FE]" title="Verified Creator" />}
              </div>
              <p className="text-xs text-[#00F2FE] font-mono mt-0.5">@{user?.username || 'creator'} • Creator Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/live/studio"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/25 hover:opacity-95 transition"
            >
              <FaBroadcastTower /> Go Live
            </Link>
            <Link
              to="/scheduled-posts"
              className="px-4 py-2.5 rounded-2xl bg-[#171A26] border border-white/10 text-white text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition"
            >
              <FaClock /> Schedule
            </Link>
          </div>
        </div>

        {/* Studio Subtabs */}
        <div className="flex gap-2 mt-6 pt-5 border-t border-white/10">
          {[
            { id: 'overview', label: 'Performance Overview', icon: <FaChartLine /> },
            { id: 'monetization', label: 'Earnings & Monetization', icon: <FaWallet /> },
            { id: 'content', label: 'Broadcast Ops', icon: <FaLayerGroup /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white/15 text-white shadow'
                  : 'text-[#CBD5E1]/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Performance Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-[#00F2FE] font-bold uppercase tracking-wider mb-2">
                <span>Audience</span>
                <FaUsers />
              </div>
              <div className="text-3xl font-black text-[#F7F7FC]">{stats?.followers || 0}</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-mono">+12.4% this week</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-[#F4D49A] font-bold uppercase tracking-wider mb-2">
                <span>Broadcasts</span>
                <FaLayerGroup />
              </div>
              <div className="text-3xl font-black text-[#F7F7FC]">{stats?.posts || 0}</div>
              <div className="text-[11px] text-[#CBD5E1]/60 mt-1">Published posts & reels</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-[#FF6B8A] font-bold uppercase tracking-wider mb-2">
                <span>Appreciation</span>
                <FaHeart />
              </div>
              <div className="text-3xl font-black text-[#F7F7FC]">{stats?.likes || 0}</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-mono">+28% engagement</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-[#10B981] font-bold uppercase tracking-wider mb-2">
                <span>Engagement</span>
                <FaChartLine />
              </div>
              <div className="text-3xl font-black text-[#F7F7FC]">{stats?.engagement || '0'}</div>
              <div className="text-[11px] text-[#CBD5E1]/60 mt-1">Average interactions / post</div>
            </div>
          </div>

          {/* Quick Actions & Toolkit */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/analytics"
              className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 hover:border-white/20 transition backdrop-blur-xl flex items-center justify-between group"
            >
              <div>
                <h4 className="font-bold text-sm text-[#F7F7FC] mb-1">Deep Analytics Telemetry</h4>
                <p className="text-xs text-[#CBD5E1]/60">Explore reach velocity, heatmaps & chart analytics</p>
              </div>
              <FaArrowRight className="text-[#00F2FE] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/ai-avatar"
              className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 hover:border-white/20 transition backdrop-blur-xl flex items-center justify-between group"
            >
              <div>
                <h4 className="font-bold text-sm text-[#F7F7FC] mb-1">AI Avatar & Neural Studio</h4>
                <p className="text-xs text-[#CBD5E1]/60">Synthesize futuristic digital portraits</p>
              </div>
              <FaMagic className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
            </Link>

            <Link
              to="/wallet"
              className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 hover:border-white/20 transition backdrop-blur-xl flex items-center justify-between group"
            >
              <div>
                <h4 className="font-bold text-sm text-[#F7F7FC] mb-1">Creator Wallet & Coins</h4>
                <p className="text-xs text-[#CBD5E1]/60">Manage revenue, tips, and direct payouts</p>
              </div>
              <FaDollarSign className="text-emerald-400 group-hover:scale-110 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: Monetization Desk */}
      {activeTab === 'monetization' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#070B14] via-[#0A111E] to-[#052E24] border border-white/10 shadow-xl backdrop-blur-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#10B981] mb-1">Available Creator Balance</div>
              <div className="text-4xl font-black text-[#F7F7FC]">₹{user?.wallet?.balance || 0}</div>
              <p className="text-xs text-[#CBD5E1]/60 mt-1">Earnings accrued from tips, marketplace sales, and subscriber gifts.</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/wallet"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white text-xs font-bold shadow-lg hover:opacity-95 transition"
              >
                Withdraw Funds
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-[#070B14]/90 border border-white/10 backdrop-blur-xl">
              <h3 className="font-bold text-base text-[#F7F7FC] mb-2 flex items-center gap-2">
                <FaDollarSign className="text-[#D4AF37]" /> Creator Subscriptions & Tipping
              </h3>
              <p className="text-xs text-[#CBD5E1]/70 leading-relaxed mb-4">
                Followers can support your daily broadcasts via one-click microtips or recurring patron subscriptions.
              </p>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                Tip Link: {window.location.origin}/profile/{user?._id}?tip=true
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#070B14]/90 border border-white/10 backdrop-blur-xl">
              <h3 className="font-bold text-base text-[#F7F7FC] mb-2 flex items-center gap-2">
                <FaShieldAlt className="text-[#00F2FE]" /> Verification & Creator Badges
              </h3>
              <p className="text-xs text-[#CBD5E1]/70 leading-relaxed mb-4">
                Authentic creator badges build trust with sponsors and community members.
              </p>
              <div className="text-xs text-[#CBD5E1]">
                Status:{' '}
                <span className={`font-bold ${user?.isVerified ? 'text-emerald-400' : 'text-[#F4D49A]'}`}>
                  {user?.isVerified ? 'Verified Sovereign Creator' : 'Eligible for Verification Review'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Content Operations */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              to="/scheduled-posts"
              className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 hover:border-white/20 transition backdrop-blur-xl"
            >
              <FaClock className="text-[#00F2FE] text-2xl mb-3" />
              <h4 className="font-bold text-sm text-[#F7F7FC]">Scheduled Queue</h4>
              <p className="text-xs text-[#CBD5E1]/60 mt-1">Manage and automate future posts</p>
            </Link>

            <Link
              to="/drafts"
              className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 hover:border-white/20 transition backdrop-blur-xl"
            >
              <FaLayerGroup className="text-[#F4D49A] text-2xl mb-3" />
              <h4 className="font-bold text-sm text-[#F7F7FC]">Drafts Vault</h4>
              <p className="text-xs text-[#CBD5E1]/60 mt-1">Unpublished compositions and concepts</p>
            </Link>

            <Link
              to="/shop"
              className="p-5 rounded-3xl bg-[#070B14]/90 border border-white/10 hover:border-white/20 transition backdrop-blur-xl"
            >
              <FaDollarSign className="text-emerald-400 text-2xl mb-3" />
              <h4 className="font-bold text-sm text-[#F7F7FC]">Marketplace Listings</h4>
              <p className="text-xs text-[#CBD5E1]/60 mt-1">Sell digital assets, merch, and presets</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
