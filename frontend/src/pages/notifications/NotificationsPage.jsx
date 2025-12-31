import React, { useEffect, useState } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ui/ToastProvider";
import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import { useSelector } from "react-redux";
import { FaBell, FaCircle, FaCheckDouble } from 'react-icons/fa';

// Helper to determine the link based on notification type
const getNotificationLink = (n) => {
    // If backend provides a direct link entity
    if (n.data?.link) return n.data.link;

    switch (n.type) {
        case 'like':
        case 'comment':
        case 'mention':
            // Go to specific post
            return n.data?.postId ? `/post/${n.data.postId}` : null;
        case 'follow':
            // Go to the profile of the person who followed
            return n.actor?._id ? `/profile/${n.actor._id}` : null;
        case 'message':
            // Go to chat (or specific chat if ID available)
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
            setItems(r.data || []);
        } catch (e) { 
            addToast('Unable to load notifications', { type: 'error' }); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!myId) return; 
        load();
        
        // Listen for incoming notifications live
        const onNotif = (payload) => {
            setItems(prev => {
                // Prevent duplicate addition by ID
                if (prev.find(n => n._id === payload._id)) return prev;
                return [payload, ...prev].slice(0, 100);
            });
        };
        
        socket.on('notification', onNotif);
        
        // Re-join personal room to ensure we get messages
        if (socket.connected) {
            socket.emit('joinRoom', { room: myId });
        }
        
        return () => { 
            socket.off('notification', onNotif); 
        };
    }, [myId]);

    // 🔥 Mark single item as read (optimistic update)
    const markSingleRead = async (id) => {
        // Prevent API call if already read
        const target = items.find(i => i._id === id);
        if (target && target.isRead) return;

        // Optimistic UI Update
        setItems(prev => prev.map(i => i._id === id ? { ...i, isRead: true } : i));
        
        // Dispatch event to update Navbar badge
        window.dispatchEvent(new Event('notificationsRead')); 

        try {
            await API.post(`/notifications/${id}/read`);
        } catch (e) { 
            // Silent fail
        }
    };

    // 🔥 Mark All Read Handler
    const handleMarkAllRead = async () => {
        // Optimistic UI Update
        setItems(prev => prev.map(n => ({ ...n, isRead: true })));
        window.dispatchEvent(new Event('notificationsRead')); // Clear navbar badge
        
        try {
            await API.put('/notifications/mark-read');
            addToast("All marked as read", { type: 'success' });
        } catch(e) {
            addToast("Failed to mark all read", { type: 'error' });
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><Spinner /></div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="card p-4 min-h-[80vh] bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-xl rounded-3xl">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b dark:border-gray-800 pb-4 px-2">
                    <h3 className="font-bold text-2xl flex items-center gap-3 text-gray-800 dark:text-white">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                            <FaBell />
                        </div>
                        Activity
                    </h3>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={handleMarkAllRead}
                            className="text-sm flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-2 rounded-xl transition font-medium"
                        >
                            <FaCheckDouble /> Mark all read
                        </button>
                        <button onClick={load} className="text-sm text-gray-500 font-medium hover:text-gray-700 dark:hover:text-gray-300 transition">Refresh</button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <AnimatePresence initial={false}>
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <FaBell className="text-4xl opacity-20" />
                                </div>
                                <p className="font-medium">No notifications yet.</p>
                            </div>
                        ) : (
                            items.map(n => {
                                const link = getNotificationLink(n);
                                
                                const Content = (
                                    <div className={`p-4 rounded-2xl flex items-center gap-4 transition-all relative overflow-hidden group
                                        ${n.isRead 
                                            ? "bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50" 
                                            : "bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30"}`}
                                    >
                                        {/* Actor Avatar */}
                                        <div className="flex-shrink-0 relative">
                                            <img 
                                                src={n.actor?.avatar || '/default-avatar.png'} 
                                                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                                                alt="Actor"
                                            />
                                            {/* Type Icon Badge */}
                                            {!n.isRead && (
                                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                                <span className="font-bold text-gray-900 dark:text-white hover:underline">
                                                    {n.actor?.name || 'Someone'}
                                                </span>{' '}
                                                {n.message?.replace(n.actor?.name, '') || 'interacted with you.'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 font-medium">
                                                {new Date(n.createdAt || n.ts || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                            </div>
                                        </div>

                                        {/* Manual Mark Read Dot (Visible on Hover if Unread) */}
                                        {!n.isRead && (
                                            <div className="flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        markSingleRead(n._id);
                                                    }}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full transition"
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
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        exit={{ opacity: 0, height: 0 }} 
                                        layout
                                        className="mb-2"
                                    >
                                        {/* 🔥 CLICK HANDLER: Mark read AND Navigate */}
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
                                                className="cursor-pointer"
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
        </div>
    );
}