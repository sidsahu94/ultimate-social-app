// frontend/src/pages/groups/GroupsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoPeople, 
  IoAdd, 
  IoSearch, 
  IoCheckmark, 
  IoShieldCheckmark, 
  IoSparkles, 
  IoLockClosed, 
  IoGlobeOutline,
  IoChatbubblesOutline,
  IoShareSocialOutline
} from 'react-icons/io5';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useTheme } from '../../contexts/ThemeProvider';
import UserAvatar from '../../components/ui/UserAvatar';

const DEFAULT_GROUPS = [
  {
    _id: 'grp_ai_architects',
    name: 'AI Architects & Engineers',
    handle: 'ai-architects',
    description: 'Global community exploring frontier LLMs, neural networks, and agentic workflows.',
    privacy: 'public',
    membersCount: 1420,
    category: 'Tech & AI',
    gradient: 'from-[#00F2FE] via-[#1D4ED8] to-[#10B981]',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    joined: false,
  },
  {
    _id: 'grp_web3_freedom',
    name: 'Web3 & Financial Freedom',
    handle: 'web3-creators',
    description: 'Autonomous finance, tokenomics, DeFi, and digital creator economies.',
    privacy: 'public',
    membersCount: 890,
    category: 'Finance',
    gradient: 'from-[#F59E0B] via-[#EF4444] to-[#D4AF37]',
    banner: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80',
    joined: false,
  },
  {
    _id: 'grp_luxury_design',
    name: 'Luxury Design & Cinematic UI',
    handle: 'luxury-ui',
    description: 'Designers shaping OLED dark aesthetics, motion graphics, and luxury digital products.',
    privacy: 'public',
    membersCount: 1150,
    category: 'Design',
    gradient: 'from-[#FF6B8A] via-[#8B5CF6] to-[#00F2FE]',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    joined: false,
  },
  {
    _id: 'grp_founders_enclave',
    name: 'Founders & Visionaries Matrix',
    handle: 'founders-enclave',
    description: 'Builders, bootstrappers, and visionary entrepreneurs scaling disruptive tech.',
    privacy: 'public',
    membersCount: 2340,
    category: 'Founders',
    gradient: 'from-[#10B981] via-[#052E24] to-[#D4AF37]',
    banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80',
    joined: true,
  },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupHandle, setNewGroupHandle] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { add: addToast } = useToast();
  const { currentTheme } = useTheme();

  const fetchGroups = async () => {
    try {
      const res = await API.get('/groups');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setGroups(data);
      }
    } catch (_) {
      // Use standard default luxury groups if backend is newly initialized
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleToggleJoin = async (group) => {
    const isJoined = group.joined;
    // Optimistic UI toggle
    setGroups((prev) =>
      prev.map((g) =>
        g._id === group._id
          ? {
              ...g,
              joined: !isJoined,
              membersCount: (g.membersCount || g.members?.length || 0) + (isJoined ? -1 : 1),
            }
          : g
      )
    );

    try {
      if (isJoined) {
        await API.post(`/groups/${group._id}/leave`);
        addToast(`Left ${group.name}`, { type: 'info' });
      } else {
        await API.post(`/groups/${group._id}/join`);
        addToast(`Joined ${group.name}! Welcome to the collective.`, { type: 'success' });
      }
    } catch (err) {
      addToast(err?.response?.data?.message || 'Operation failed', { type: 'error' });
      fetchGroups();
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupHandle.trim()) {
      addToast('Please provide a group name and unique handle', { type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await API.post('/groups', {
        name: newGroupName.trim(),
        handle: newGroupHandle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        description: newGroupDesc.trim(),
        privacy: newGroupPrivacy,
      });

      const created = res.data?.data || res.data;
      setGroups((prev) => [created, ...prev]);
      addToast(`Community "${newGroupName}" established!`, { type: 'success' });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupHandle('');
      setNewGroupDesc('');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to create community', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.handle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' ||
      g.category === selectedCategory ||
      (selectedCategory === 'Joined' && g.joined);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#04070D] text-[#F8FAFC] pb-24 pt-4 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#070B14] via-[#091122] to-[#04070D] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] mb-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00F2FE]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#10B981]/15 blur-[120px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#00F2FE] mb-3">
              <IoPeople className="text-sm" />
              <span>COLLECTIVE ENCLAVES &bull; v5.1</span>
            </div>
            <h1 className="font-display text-2xl md:text-4xl font-black tracking-tight text-white">
              Communities &amp; Guilds
            </h1>
            <p className="mt-2 text-sm text-[#CBD5E1]/70 max-w-xl">
              Connect with fellow architects, tech founders, luxury creators, and innovators. Share private insights, build alliances, and co-create.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#00F2FE] px-5 py-3.5 text-xs font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
            style={{ boxShadow: `0 0 25px ${currentTheme.glow}` }}
          >
            <IoAdd size={18} />
            <span>Launch Community</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="relative z-10 mt-8 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <IoSearch className="absolute left-4 top-3.5 text-[#CBD5E1]/50 text-base" />
            <input
              type="text"
              placeholder="Search communities by name, topic, or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-xs font-medium text-white placeholder-[#CBD5E1]/40 focus:border-[#00F2FE] focus:outline-none focus:ring-1 focus:ring-[#00F2FE] transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
            {['All', 'Joined', 'Tech & AI', 'Finance', 'Design', 'Founders'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-white/[0.05] border border-white/10 text-[#CBD5E1]/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Group Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGroups.map((group) => {
          const isJoined = group.joined || group.members?.some((m) => String(m._id || m) === localStorage.getItem('meId'));
          const count = group.membersCount || group.members?.length || 1;

          return (
            <motion.div
              key={group._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#070B14]/80 p-5 shadow-xl backdrop-blur-xl transition hover:border-white/20 group flex flex-col justify-between"
            >
              {/* Top Banner Gradient Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                  group.gradient || 'from-[#00F2FE] via-[#1D4ED8] to-[#10B981]'
                }`}
              />

              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] to-[#00F2FE] p-[1.5px] shadow-md">
                      <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#04070D]">
                        <IoPeople className="text-xl text-[#00F2FE]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display text-base font-bold text-white group-hover:text-[#00F2FE] transition">
                          {group.name}
                        </h3>
                        {group.privacy === 'private' ? (
                          <IoLockClosed size={12} className="text-[#F59E0B]" title="Private Guild" />
                        ) : (
                          <IoGlobeOutline size={12} className="text-[#10B981]" title="Public Collective" />
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[#CBD5E1]/60">@{group.handle}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-[#CBD5E1]/80">
                    {count.toLocaleString()} members
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#CBD5E1]/70 line-clamp-2">
                  {group.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#00F2FE] flex items-center gap-1">
                  <IoSparkles size={11} /> Active Discussion Enclave
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleJoin(group)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shadow-md ${
                    isJoined
                      ? 'bg-white/10 text-[#10B981] border border-[#10B981]/30 hover:bg-[#EF4444]/20 hover:text-[#EF4444] hover:border-[#EF4444]/40'
                      : 'bg-white text-black hover:bg-[#00F2FE] hover:text-black'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <IoCheckmark size={14} /> Joined
                    </>
                  ) : (
                    <>
                      <IoAdd size={14} /> Join Guild
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-16 text-[#CBD5E1]/60">
          <IoPeople className="mx-auto text-4xl mb-3 text-white/20" />
          <p className="text-sm font-semibold">No communities found matching "{searchQuery}"</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-3 text-xs font-bold text-[#00F2FE] hover:underline"
          >
            Create the first one &rarr;
          </button>
        </div>
      )}

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative w-full max-w-lg rounded-[28px] border border-white/15 bg-[#070B14] p-6 text-[#F8FAFC] shadow-2xl"
            >
              <h2 className="font-display text-xl font-bold mb-1">Establish New Collective</h2>
              <p className="text-xs text-[#CBD5E1]/60 mb-5">
                Launch a dedicated enclave for your niche, project, or creators.
              </p>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#CBD5E1]/70 mb-1.5 uppercase tracking-wider">
                    Community Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next-Gen Founders"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#04070D] px-3.5 py-2.5 text-xs text-white placeholder-[#CBD5E1]/40 focus:border-[#00F2FE] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#CBD5E1]/70 mb-1.5 uppercase tracking-wider">
                    Unique Handle
                  </label>
                  <div className="flex items-center rounded-xl border border-white/10 bg-[#04070D] px-3 py-2">
                    <span className="text-xs text-[#CBD5E1]/50 font-mono mr-1">@</span>
                    <input
                      type="text"
                      required
                      placeholder="nextgen-founders"
                      value={newGroupHandle}
                      onChange={(e) => setNewGroupHandle(e.target.value)}
                      className="w-full bg-transparent text-xs text-white font-mono placeholder-[#CBD5E1]/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#CBD5E1]/70 mb-1.5 uppercase tracking-wider">
                    Manifesto / Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the mission, rules, and vibe of this enclave..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#04070D] p-3 text-xs text-white placeholder-[#CBD5E1]/40 focus:border-[#00F2FE] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#CBD5E1]/70 mb-1.5 uppercase tracking-wider">
                    Privacy Tier
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewGroupPrivacy('public')}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border cursor-pointer transition ${
                        newGroupPrivacy === 'public'
                          ? 'bg-[#00F2FE]/15 border-[#00F2FE] text-[#00F2FE]'
                          : 'bg-white/5 border-white/10 text-[#CBD5E1]/60'
                      }`}
                    >
                      <IoGlobeOutline size={14} /> Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGroupPrivacy('private')}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border cursor-pointer transition ${
                        newGroupPrivacy === 'private'
                          ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]'
                          : 'bg-white/5 border-white/10 text-[#CBD5E1]/60'
                      }`}
                    >
                      <IoLockClosed size={14} /> Private Enclave
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-xl bg-white/5 py-2.5 text-xs font-bold text-[#CBD5E1] hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Launching...' : 'Create Community'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
