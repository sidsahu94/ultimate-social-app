// frontend/src/pages/safety/SafetyPage.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaShieldAlt, FaBan, FaCheckCircle, FaUserShield, FaClock } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';
import Spinner from '../../components/common/Spinner';
import UserAvatar from '../../components/ui/UserAvatar';

export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState('reports');
  const [blockedList, setBlockedList] = useState([]);
  const [myReports, setMyReports] = useState([]); 
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  useEffect(() => {
    if (activeTab === 'blocked') loadBlocked();
    if (activeTab === 'reports') loadReports(); 
  }, [activeTab]);

  const loadBlocked = async () => {
    setLoading(true);
    try {
        const res = await API.get('/users/blocked');
        setBlockedList(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
        const res = await API.get('/report/mine');
        const data = res.data?.data || res.data;
        setMyReports(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUnblock = async (userId) => {
      try {
          await API.post(`/users/${userId}/block`);
          setBlockedList(prev => prev.filter(u => u._id !== userId));
          add("User unblocked", { type: 'success' });
      } catch (e) {
          add("Failed to unblock", { type: 'error' });
      }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      {/* Banner */}
      <div className="bg-[#070B14]/90 border border-white/10 rounded-3xl p-6 md:p-8 text-[#F7F7FC] mb-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <FaShieldAlt className="absolute right-[-20px] bottom-[-20px] text-9xl text-[#10B981] opacity-15" />
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
          <FaUserShield /> Platform Integrity
        </div>
        <h1 className="text-3xl font-black relative z-10 font-display">Safety & Trust Center<span className="text-[#00F2FE]">.</span></h1>
        <p className="text-xs text-[#CBD5E1] mt-1 relative z-10">Monitor moderation tickets, content reports, and manage access blacklists.</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-6 pb-1">
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`pb-2 px-4 font-bold text-xs uppercase tracking-wider transition ${
            activeTab==='reports' ? 'border-b-2 border-[#00F2FE] text-[#00F2FE]' : 'text-[#A5A9BB] hover:text-[#F7F7FC]'
          }`}
        >
          My Reports
        </button>
        <button 
          onClick={() => setActiveTab('blocked')} 
          className={`pb-2 px-4 font-bold text-xs uppercase tracking-wider transition ${
            activeTab==='blocked' ? 'border-b-2 border-[#00F2FE] text-[#00F2FE]' : 'text-[#A5A9BB] hover:text-[#F7F7FC]'
          }`}
        >
          Blocked Users
        </button>
      </div>

      {loading ? <div className="text-center py-12"><Spinner /></div> : (
        <>
        {/* --- REPORTS TAB --- */}
        {activeTab === 'reports' && (
            <div className="space-y-4">
                {myReports.length === 0 ? (
                    <div className="text-center py-16 text-[#CBD5E1] bg-[#070B14]/40 rounded-3xl border border-white/10 backdrop-blur-xl">
                        <FaUserShield className="text-4xl mb-3 mx-auto text-[#A5A9BB] opacity-30"/>
                        <p className="font-semibold text-sm">No active tickets found.</p>
                        <p className="text-xs text-[#A5A9BB] mt-1">When you report objectionable content or actors, track resolutions here.</p>
                    </div>
                ) : (
                    myReports.map(rep => (
                        <div key={rep._id} className="p-5 flex justify-between items-start bg-[#070B14]/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl border-l-4 border-l-[#052E24]">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-bold text-[#F7F7FC] text-sm capitalize">{rep.reason}</span>
                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                      rep.status === 'open' 
                                        ? 'bg-[#D4AF37]/20 text-[#F4D49A] border border-[#D4AF37]/30' 
                                        : 'bg-[#0F766E]/20 text-[#00F2FE] border border-[#0F766E]/30'
                                    }`}>
                                        {rep.status}
                                    </span>
                                </div>
                                <p className="text-xs text-[#CBD5E1] mb-2">
                                    Target: {rep.targetUser?.name || 'Content Artifact'}
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-[#A5A9BB]">
                                    <FaClock size={10} /> {new Date(rep.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                            {rep.action && rep.action !== 'none' && (
                                <div className="bg-[#171A26] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium text-[#F7F7FC]">
                                    Action: <span className="font-bold text-[#00F2FE]">{rep.action}</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- BLOCKED TAB --- */}
        {activeTab === 'blocked' && (
            <div className="space-y-3">
              {blockedList.length === 0 ? (
                  <div className="text-center py-16 text-[#CBD5E1] bg-[#070B14]/40 rounded-3xl border border-white/10 backdrop-blur-xl text-xs">
                    Your blacklist is empty. You haven't blocked any accounts.
                  </div>
              ) : (
                blockedList.map(u => (
                    <div key={u._id} className="p-4 flex items-center justify-between bg-[#070B14]/90 border border-white/10 rounded-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10 border border-white/10" />
                        <div className="font-bold text-sm text-[#F7F7FC]">{u.name}</div>
                    </div>
                    <button 
                        onClick={() => handleUnblock(u._id)}
                        className="text-xs text-[#F87171] font-bold border border-[#052E24]/30 bg-[#052E24]/15 px-4 py-2 rounded-xl hover:bg-[#052E24]/30 transition"
                    >
                        Unblock
                    </button>
                    </div>
                ))
              )}
            </div>
        )}
        </>
      )}
    </div>
  );
}
