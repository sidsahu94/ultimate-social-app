// frontend/src/pages/notifications/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ui/ToastProvider";
import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import { useSelector } from "react-redux";
import { FaBell, FaCircle, FaCheckDouble } from 'react-icons/fa';
import UserAvatar from "../../components/ui/UserAvatar";

// Helper to determine the link based on notification type
const getNotificationLink = (n) => {
    if (n.data?.link) return n.data.link;

    switch (n.type) {
        case 'like':
            return n.data?.postId ? `/post/${n.data.postId}` : null;
        case 'comment':
        case 'mention':
            return n.data?.postId ? `/post/${n.data.postId}?comments=true` : null;
        case 'follow':
            return n.actor?._id ? `/profile/${n.actor._id}` : null;
        case 'message':
            return n.data?.chatId ? `/chat/${n.data.chatId}` : '/chat';
        case 'wallet':
        case 'system':
            return '/wallet';
        case 'report':
            return '/report';
        default:
            return null;
    }
};

export default function NotificationsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { add: addToast } = useToast();
    const myId = useSelector(s => s.auth?.user?._id);

    const load = async () => {
        setLoading(true);
        try {
            const r = await API.get('/notifications');
            const data = Array.isArray(r.data) ? r.data : (r.data?.data || []);
            setItems(data);
        } catch (e) { 
            console.warn('Notifications load error:', e?.message);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!myId) return; 
        load();
        
        const onNotif = (payload) => {
            setItems(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                if (safePrev.find(n => n._id === payload._id)) return safePrev;
                return [payload, ...safePrev].slice(0, 100);
            });
        };
        
        socket.on('notification', onNotif);
        
        if (socket.connected) {
            socket.emit('joinRoom', { room: myId });
        }
        
        return () => { 
            socket.off('notification', onNotif); 
        };
    }, [myId]);

    const markSingleRead = async (id) => {
        const safeItems = Array.isArray(items) ? items : [];
        const target = safeItems.find(i => i._id === id);
        if (target && target.isRead) return;

        setItems(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(i => i._id === id ? { ...i, isRead: true } : i);
        });
        
        window.dispatchEvent(new Event('notificationsRead')); 

        try {
            await API.post(`/notifications/${id}/read`);
        } catch (e) { 
            // Silent fail
        }
    };

    const handleMarkAllRead = async () => {
        setItems(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(n => ({ ...n, isRead: true }));
        });
        window.dispatchEvent(new Event('notificationsRead'));
        
        try {
            await API.put('/notifications/mark-read');
            addToast("All marked as read", { type: 'success' });
        } catch(e) {
            addToast("Failed to mark all read", { type: 'error' });
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><Spinner /></div>;

    const safeItemsToRender = Array.isArray(items) ? items : [];

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 min-h-screen">
            
            {/* Header with Glass Pill Actions */}
            <div className="flex items-center justify-between mb-8 sticky top-0 z-30 pt-4 pb-4 bg-[#04070D]/85 backdrop-blur-2xl border-b border-white/10">
              <h1 className="text-3xl font-bold tracking-tight text-[#F7F7FC] flex items-center gap-3">
                 <div className="p-2.5 bg-[#0F766E]/20 border border-[#0F766E]/30 rounded-2xl text-[#00F2FE] shadow-[0_0_15px_rgba(100,223,223,0.2)]">
                    <FaBell size={18} />
                 </div>
                 Activity
              </h1>

              <div className="flex items-center gap-3">
                  <button 
                    onClick={load} 
                    className="text-xs font-semibold text-[#A5A9BB] hover:text-[#F7F7FC] transition-colors px-3 py-1.5"
                  >
                    Refresh
                  </button>
                  <button 
                    onClick={handleMarkAllRead}
                    className="px-4 py-2 flex items-center gap-2 text-xs font-bold rounded-full bg-[#070B14] border border-white/15 text-[#CBD5E1] hover:text-[#00F2FE] hover:border-[#00F2FE]/40 transition-all shadow-md active:scale-95"
                  >
                    <FaCheckDouble /> Mark all read
                  </button>
              </div>
            </div>

            {/* Notification Items Wrapper */}
            <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                    {safeItemsToRender.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-[#A5A9BB] bg-[#070B14]/40 border border-white/5 rounded-3xl">
                            <div className="w-20 h-20 bg-[#171A26] rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                                <FaBell className="text-4xl text-[#A5A9BB] opacity-40" />
                            </div>
                            <p className="font-medium tracking-wide text-[#CBD5E1] text-sm">No notifications yet.</p>
                        </div>
                    ) : (
                        safeItemsToRender.map(n => {
                            const link = getNotificationLink(n);
                            
                            const Content = (
                                <div className={`relative group flex items-start gap-4 p-4 md:p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                                  n.isRead 
                                      ? 'bg-[#070B14]/60 border-white/5 opacity-80 hover:opacity-100 hover:border-white/15' 
                                      : 'bg-[#171A26]/90 border-white/15 shadow-[0_8px_25px_rgba(29,78,216,0.15)] transform hover:-translate-y-0.5'
                                  }`}>
                                    
                                    {/* Unread Glow Indicator */}
                                    {!n.isRead && (
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-gradient-to-b from-[#1D4ED8] to-[#052E24] rounded-r-full shadow-[0_0_12px_rgba(29,78,216,0.8)]" />
                                    )}

                                    {/* Avatar */}
                                    <div className="flex-shrink-0 relative">
                                        <UserAvatar 
                                          src={n.actor?.avatar} 
                                          name={n.actor?.name} 
                                          className="w-11 h-11 border border-white/10"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                      <p className="text-sm text-[#F7F7FC] leading-relaxed">
                                        <span className="font-bold cursor-pointer hover:text-[#00F2FE] transition-colors">
                                          {n.actor?.name || 'Someone'}
                                        </span>
                                        {' '}
                                        <span className="text-[#CBD5E1]">
                                          {n.message?.replace(n.actor?.name, '') || 'interacted with you.'}
                                        </span>
                                      </p>
                                      <span className="text-xs text-[#00F2FE] mt-1.5 block font-medium tracking-wide">
                                        {new Date(n.createdAt || n.ts || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                      </span>
                                    </div>

                                    {/* Optional: Related Post Image Thumbnail */}
                                    {n.data?.postImage && (
                                      <img 
                                        src={n.data.postImage} 
                                        alt="Post" 
                                        className="w-12 h-12 rounded-xl object-cover border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      />
                                    )}

                                    {/* Manual Mark Read Button (Visible on Hover if Unread) */}
                                    {!n.isRead && (
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    markSingleRead(n._id);
                                                }}
                                                className="p-1.5 text-[#00F2FE] hover:bg-[#0F766E]/20 rounded-full transition-colors"
                                                title="Mark as read"
                                            >
                                                <FaCircle size={10} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                            
                            return (
                                <motion.div 
                                    key={n._id || n.id} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, scale: 0.95 }} 
                                    layout
                                >
                                    {link ? (
                                        <Link 
                                            to={link} 
                                            onClick={() => markSingleRead(n._id)} 
                                            className="block focus:outline-none"
                                        >
                                            {Content}
                                        </Link>
                                    ) : (
                                        <div 
                                            onClick={() => markSingleRead(n._id)} 
                                            className="focus:outline-none"
                                        >
                                            {Content}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
