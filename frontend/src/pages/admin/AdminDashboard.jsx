// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaUsers, FaFlag, FaChartBar, FaBan, FaTrash, FaCheck, FaSearch, FaShieldAlt, FaBroadcastTower, FaMicrochip, FaServer, FaPaperPlane } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';
import Spinner from '../../components/common/Spinner';
import UserAvatar from '../../components/ui/UserAvatar';
import { playCyberClick, playSuccessChord } from '../../utils/soundEffects';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('open');
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [coinModalUser, setCoinModalUser] = useState(null);
  const [coinAmount, setCoinAmount] = useState('100');
  const [minting, setMinting] = useState(false);
  const { add } = useToast();

  useEffect(() => {
    loadStats();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'reports') loadReports();
  }, [activeTab, reportFilter]);

  const loadStats = () => API.get('/admin/stats').then(r => setStats(r.data?.data || r.data)).catch(() => {});
  
  const loadUsers = async () => {
    setLoading(true);
    try { 
        const r = await API.get('/admin/users'); 
        const data = r.data?.data || r.data;
        setUsers(Array.isArray(data) ? data : []); 
    } catch(e) {
        add('Failed to load users', { type: 'error' });
    } finally { 
        setLoading(false); 
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try { 
        const r = await API.get(`/admin/reports?status=${reportFilter}`); 
        const data = r.data?.data || r.data;
        setReports(Array.isArray(data) ? data : []); 
    } catch(e) {
        add('Failed to load reports', { type: 'error' });
    } finally { 
        setLoading(false); 
    }
  };

  const handleToggleVerify = async (userId) => {
    try {
      playCyberClick();
      const res = await API.put(`/admin/users/${userId}/verify`);
      const isVerified = res.data?.isVerified;
      add(`Verification status updated: ${isVerified ? 'Verified' : 'Unverified'}`, { type: 'success' });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isVerified } : u));
    } catch (e) {
      add('Failed to update verification', { type: 'error' });
    }
  };

  const handleMintCoins = async (e) => {
    e.preventDefault();
    if (!coinModalUser || !coinAmount) return;
    setMinting(true);
    playCyberClick();
    try {
      const res = await API.post(`/admin/users/${coinModalUser._id}/coins`, { amount: parseInt(coinAmount, 10) });
      playSuccessChord();
      add(res.data?.message || 'Coins minted successfully!', { type: 'success' });
      setCoinModalUser(null);
    } catch (e) {
      add('Failed to mint coins', { type: 'error' });
    } finally {
      setMinting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Permanently delete this user account and all associated data?')) return;
    try {
      playCyberClick();
      await API.delete(`/admin/users/${userId}`);
      add('User permanently removed', { type: 'success' });
      setUsers(prev => prev.filter(u => u._id !== userId));
      loadStats();
    } catch (e) {
      add('Failed to delete user', { type: 'error' });
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      playCyberClick();
      const res = await API.post('/admin/maintenance');
      setMaintenance(res.data?.maintenance);
      add(res.data?.message || 'System state toggled', { type: 'info' });
    } catch (e) {
      add('Failed to toggle system freeze', { type: 'error' });
    }
  };

  const handleBan = async (userId) => {
    if(!confirm("Toggle ban status for this user?")) return;
    try {
        await API.put(`/admin/users/${userId}/ban`);
        add("User status updated", { type: 'success' });
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: u.role === 'banned' ? 'user' : 'banned' } : u));
    } catch(e) { 
        add("Action failed", { type: 'error' }); 
    }
  };

  const resolveReport = async (reportId, action) => {
    try {
        await API.put(`/admin/reports/${reportId}`, { action });
        add(`Report processed: ${action}`, { type: 'success' });
        
        if (reportFilter === 'open') {
            setReports(prev => prev.filter(r => r._id !== reportId));
        }
        loadStats();
    } catch(e) { 
        add("Failed to resolve", { type: 'error' }); 
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    playCyberClick();
    try {
      await API.post('/admin/broadcast', { message: broadcastMsg.trim() });
      playSuccessChord();
      add('Broadcast dispatched to all active cluster nodes', { type: 'success' });
      setBroadcastMsg('');
    } catch (err) {
      add('Broadcast dispatch failed', { type: 'error' });
    } finally {
      setBroadcasting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-screen pb-24">
      <div className="mb-8 pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
            <FaShieldAlt className="animate-pulse" /> Founder & System Governance Enclave &bull; Sidhanta Sahu
          </div>
          <h1 className="text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
            Founder & Admin Command Matrix<span className="text-[#00F2FE]">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMaintenance}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-lg ${
              maintenance
                ? 'bg-[#F87171] text-white animate-pulse'
                : 'bg-white/10 hover:bg-white/15 text-[#CBD5E1] border border-white/10'
            }`}
          >
            <FaShieldAlt /> {maintenance ? 'Freeze ACTIVE' : 'System Freeze (Emergency)'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 mb-8 border-b border-white/10 pb-1 overflow-x-auto">
        {[
            { id: 'overview', icon: <FaChartBar />, label: 'Overview' },
            { id: 'users', icon: <FaUsers />, label: 'Users' },
            { id: 'reports', icon: <FaFlag />, label: 'Reports' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === tab.id ? 'text-[#00F2FE] border-b-2 border-[#00F2FE]' : 'text-[#A5A9BB] hover:text-[#F7F7FC]'
                }`}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-white/10 border-l-4 border-l-[#1D4ED8] bg-[#070B14]/90 shadow-xl rounded-3xl backdrop-blur-xl">
              <h3 className="text-[#A5A9BB] font-bold uppercase text-[11px] tracking-wider">Registered Creators</h3>
              <p className="text-4xl font-black text-[#F7F7FC] mt-2 font-mono">{stats.userCount || 0}</p>
            </div>
            <div className="p-6 border border-white/10 border-l-4 border-l-[#0F766E] bg-[#070B14]/90 shadow-xl rounded-3xl backdrop-blur-xl">
              <h3 className="text-[#A5A9BB] font-bold uppercase text-[11px] tracking-wider">Active Moments &amp; Posts</h3>
              <p className="text-4xl font-black text-[#F7F7FC] mt-2 font-mono">{stats.postCount || 0}</p>
            </div>
            <div className="p-6 border border-white/10 border-l-4 border-l-[#052E24] bg-[#070B14]/90 shadow-xl rounded-3xl backdrop-blur-xl">
              <h3 className="text-[#A5A9BB] font-bold uppercase text-[11px] tracking-wider">Open Moderation Flags</h3>
              <p className="text-4xl font-black text-[#F7F7FC] mt-2 font-mono">{stats.reportCount || 0}</p>
            </div>
          </div>

          {/* High-Tech System Cluster Telemetry Matrix */}
          <div className="rounded-[28px] border border-white/10 bg-[#070B14]/90 p-6 md:p-7 shadow-silverGlass backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#04070D] border border-white/15 text-[#00F2FE] shadow-[0_0_15px_rgba(100,223,223,0.3)]">
                  <FaServer />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#F7F7FC]">
                    Atlas Cluster Diagnostics &amp; Telemetry
                  </h3>
                  <span className="text-[10px] font-mono text-[#00F2FE] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-ping" />
                    PERSISTENCE LAYER ONLINE
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-[10px] text-[#CBD5E1]/70">
                AWS ap-south-1 (Mumbai)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="rounded-2xl border border-white/5 bg-[#04070D] p-4">
                <span className="text-[10px] text-[#CBD5E1]/50 block uppercase">Cluster Host</span>
                <span className="font-bold text-[#00F2FE] truncate block mt-1 text-[11px]">
                  {stats.telemetry?.clusterHost || 'ac-rp5wdv0-shard-00-01.8fcmyqk.mongodb.net'}
                </span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#04070D] p-4">
                <span className="text-[10px] text-[#CBD5E1]/50 block uppercase">WebRTC Mediasoup</span>
                <span className="font-bold text-[#14B8A6] block mt-1">
                  Active (RTP Loopback)
                </span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#04070D] p-4">
                <span className="text-[10px] text-[#CBD5E1]/50 block uppercase">Server RSS Memory</span>
                <span className="font-bold text-[#F4D49A] block mt-1">
                  {stats.telemetry?.rssMb || 142} MB
                </span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#04070D] p-4">
                <span className="text-[10px] text-[#CBD5E1]/50 block uppercase">Node Process Uptime</span>
                <span className="font-bold text-[#F8FAFC] block mt-1">
                  {Math.floor((stats.telemetry?.uptimeSeconds || 3600) / 60)} mins
                </span>
              </div>
            </div>
          </div>

          {/* System Global Broadcast Console */}
          <div className="rounded-[28px] border border-white/10 bg-[#070B14]/90 p-6 md:p-7 shadow-silverGlass backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#052E24]/30 border border-[#052E24]/50 text-[#F87171]">
                <FaBroadcastTower />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#F7F7FC]">
                  Global System Broadcast Dispatcher
                </h3>
                <p className="text-[11px] text-[#CBD5E1]/60">
                  Transmit live WebSocket announcements to all active clients and creators across the cluster.
                </p>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Enter system announcement (e.g. Scheduled maintenance in 15 mins)..."
                className="flex-1 rounded-xl bg-[#04070D] border border-white/15 px-4 py-3 text-xs text-[#F8FAFC] placeholder-[#CBD5E1]/40 focus:border-[#00F2FE] focus:outline-none focus:ring-1 focus:ring-[#00F2FE] transition"
              />
              <button
                type="submit"
                disabled={broadcasting || !broadcastMsg.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#1D4ED8]/30 transition hover:opacity-95 active:scale-98 disabled:opacity-50 whitespace-nowrap"
              >
                <FaPaperPlane size={11} /> {broadcasting ? 'Transmitting...' : 'Transmit Broadcast'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-[#070B14]/90 border border-white/10 rounded-3xl shadow-xl overflow-hidden backdrop-blur-xl animate-fade-in">
            <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-[#171A26]/50">
                <FaSearch className="text-[#A5A9BB]" size={14} />
                <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="bg-transparent outline-none w-full text-xs text-[#F7F7FC] placeholder-[#A5A9BB]"
                />
            </div>
            {loading ? <div className="p-12 flex justify-center"><Spinner /></div> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#171A26]/80 text-[#A5A9BB] font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(u => (
                                <tr key={u._id} className="hover:bg-white/5 transition">
                                    <td className="p-4 flex items-center gap-3">
                                        <UserAvatar src={u.avatar} name={u.name} className="w-9 h-9 border border-white/10" />
                                        <div>
                                            <div className="font-bold text-[#F7F7FC]">{u.name}</div>
                                            <div className="text-[11px] text-[#A5A9BB]">{u.email}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 uppercase text-[#D4AF37] font-semibold">{u.role}</td>
                                    <td className="p-4">
                                        {u.role === 'banned' 
                                            ? <span className="text-[#F87171] font-bold flex items-center gap-1.5"><FaBan size={10} /> Banned</span> 
                                            : <span className="text-[#00F2FE] font-bold flex items-center gap-1.5"><FaCheck size={10} /> Active</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {/* Toggle Verified Badge */}
                                          <button
                                            type="button"
                                            onClick={() => handleToggleVerify(u._id)}
                                            className="p-2 bg-[#0A111E] border border-white/10 rounded-xl hover:bg-white/15 transition text-xs"
                                            title={u.isVerified ? 'Revoke Verification' : 'Grant Verified Badge'}
                                          >
                                            <span className={u.isVerified ? 'text-[#00F2FE] font-black' : 'text-white/20'}>✓</span>
                                          </button>

                                          {/* Mint Coins */}
                                          <button
                                            type="button"
                                            onClick={() => setCoinModalUser(u)}
                                            className="px-2.5 py-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-xl hover:bg-[#D4AF37]/25 transition text-[11px] font-bold text-[#D4AF37] flex items-center gap-1"
                                            title="Grant Creator Coins"
                                          >
                                            <span>🪙 Mint</span>
                                          </button>

                                          {/* Ban / Delete Controls (Protected from self-action) */}
                                          {u.role !== 'admin' && u.email !== 'sidhantas786@gmail.com' && u.username !== 'sidsahu' && (
                                            <>
                                              <button 
                                                type="button"
                                                onClick={() => handleBan(u._id)} 
                                                className="p-2 bg-[#0A111E] border border-white/10 rounded-xl hover:bg-white/10 transition text-xs text-[#CBD5E1]"
                                                title="Toggle Ban Status"
                                              >
                                                {u.role === 'banned' ? <FaCheck className="text-[#00F2FE]" /> : <FaBan className="text-[#F87171]" />}
                                              </button>
                                              <button 
                                                type="button"
                                                onClick={() => handleDeleteUser(u._id)} 
                                                className="p-2 bg-[#F87171]/10 border border-[#F87171]/25 rounded-xl hover:bg-[#F87171]/20 transition text-xs text-[#F87171]"
                                                title="Permanently Delete User"
                                              >
                                                <FaTrash size={11} />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setReportFilter('open')} 
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                      reportFilter === 'open' ? 'bg-[#052E24] text-white shadow-md' : 'bg-[#070B14] border border-white/10 text-[#A5A9BB]'
                    }`}
                >
                    Open Inquiries
                </button>
                <button 
                    onClick={() => setReportFilter('resolved')} 
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                      reportFilter === 'resolved' ? 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white shadow-md' : 'bg-[#070B14] border border-white/10 text-[#A5A9BB]'
                    }`}
                >
                    Resolved Archives
                </button>
            </div>

            {loading && <div className="p-12 flex justify-center"><Spinner /></div>}
            
            {!loading && reports.length === 0 && (
                <div className="p-16 text-center flex flex-col items-center justify-center text-[#CBD5E1] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
                    <FaCheck className="text-4xl text-[#00F2FE] mb-3 opacity-80" />
                    <p className="text-sm font-semibold">No reports found in this category.</p>
                </div>
            )}

            {reports.map(r => (
                <div key={r._id} className={`p-5 bg-[#070B14]/90 border border-white/10 border-l-4 shadow-xl rounded-3xl backdrop-blur-xl flex flex-col md:flex-row justify-between gap-6 ${
                  r.status === 'open' ? 'border-l-[#052E24]' : 'border-l-[#0F766E] opacity-80'
                }`}>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              r.status === 'open' ? 'bg-[#052E24]/20 border border-[#052E24]/30 text-[#F87171]' : 'bg-[#0F766E]/20 border border-[#0F766E]/30 text-[#00F2FE]'
                            }`}>{r.reason}</span>
                            <span className="text-[#A5A9BB] text-[11px]">• {new Date(r.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                        </div>
                        
                        <p className="text-xs font-medium mb-3 text-[#CBD5E1]">
                            Flagged by <span className="font-bold text-[#F7F7FC]">{r.reporter?.name || 'Anonymous'}</span>
                        </p>
                        
                        {r.status !== 'open' && r.handledBy && (
                             <p className="text-xs text-[#00F2FE] mb-2 font-bold">Resolved by: {r.handledBy.name}</p>
                        )}

                        <div className="bg-[#0A111E] p-4 rounded-2xl text-xs text-[#CBD5E1] border border-white/5 leading-relaxed">
                            {r.targetPost ? (
                                <div><div className="text-[10px] text-[#A5A9BB] mb-1 uppercase font-bold tracking-wider">Post Payload:</div> "{r.targetPost.content || 'Media Artifact'}"</div>
                            ) : (
                                <div><div className="text-[10px] text-[#A5A9BB] mb-1 uppercase font-bold tracking-wider">Target User:</div> {r.targetUser?.name} ({r.targetUser?.email})</div>
                            )}
                        </div>
                    </div>

                    {r.status === 'open' && (
                        <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
                            <button onClick={() => resolveReport(r._id, 'dismiss')} className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/10 text-xs font-bold text-[#CBD5E1] transition">
                              Dismiss
                            </button>
                            
                            {r.targetPost && (
                                <button onClick={() => resolveReport(r._id, 'delete_post')} className="px-4 py-2 bg-[#052E24]/20 border border-[#052E24]/30 text-[#F87171] hover:bg-[#052E24]/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                                    <FaTrash size={10} /> Delete Post
                                </button>
                            )}
                            
                            {r.targetUser && (
                                <button onClick={() => resolveReport(r._id, 'ban_user')} className="px-4 py-2 bg-[#052E24] text-white hover:bg-[#10B981] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md">
                                    <FaBan size={10} /> Ban User
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}
      {/* Coin Minting Modal */}
      {coinModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-white/20 bg-[#070B14] p-6 shadow-2xl text-white">
            <h3 className="text-lg font-black text-[#D4AF37] mb-1 flex items-center gap-2">
              <span>🪙 Founder Coin Minting</span>
            </h3>
            <p className="text-xs text-[#CBD5E1]/70 mb-4">
              Grant digital currency directly to <span className="font-bold text-white">{coinModalUser.name}</span>'s wallet.
            </p>
            <form onSubmit={handleMintCoins} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#CBD5E1]/60 block mb-1.5">Coin Amount</label>
                <div className="flex gap-2 mb-2">
                  {['50', '100', '500', '1000'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCoinAmount(amt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                        coinAmount === amt
                          ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                          : 'border-white/10 bg-white/5 text-[#CBD5E1]'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-mono text-white outline-none focus:border-[#D4AF37]"
                  min="1"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCoinModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={minting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-black text-xs shadow-lg transition hover:opacity-90"
                >
                  {minting ? 'Minting...' : 'Confirm Mint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}