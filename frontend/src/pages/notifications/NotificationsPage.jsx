// frontend/src/pages/notifications/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ui/ToastProvider";
import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import { useSelector } from "react-redux";

// Helper to determine the link based on notification type
const getNotificationLink = (n) => {
	switch (n.type) {
		case 'like':
		case 'comment':
		case 'mention':
			return n.data?.postId ? `/post/${n.data.postId}` : null;
		case 'follow':
			return n.actor?._id ? `/profile/${n.actor._id}` : null;
		case 'message':
			return '/chat'; // Or specific chat if chatId is available in n.data
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
		if (!myId) return; // Only load if logged in
		load();
		
		const onNotif = (payload) => {
			// This is for live updates via socket
			setItems(prev => {
				// Only add if not already present (based on _id or temp id)
				if (!prev.find(n => n._id === payload._id)) {
					return [payload, ...prev].slice(0, 200);
				}
				return prev;
			});
		};
		
		socket.on('notification', onNotif);
		// Assuming the client needs to re-connect to the room to get messages/notifications
		if (socket.connected) {
			socket.emit('joinRoom', { room: myId }); // Join my own notification room
		}
		
		return () => { 
			socket.off('notification', onNotif); 
		};
	}, [myId]);

	const markRead = async (id) => {
		try {
			await API.post(`/notifications/${id}/read`);
			setItems(prev => prev.map(i => i._id === id ? { ...i, isRead: true } : i));
		} catch (e) { 
			addToast('Failed to mark read', { type: 'error' }); 
		}
	};

	if (loading) return <div className="max-w-4xl mx-auto p-4 text-center"><Spinner /></div>;

	return (
		<div className="max-w-4xl mx-auto p-4">
			<div className="card p-4">
				<h3 className="font-semibold text-2xl mb-4 border-b pb-2">Activity</h3>
				
				<div className="mt-3 space-y-3">
					<AnimatePresence>
						{items.length === 0 ? (
							<div className="text-gray-500 p-4 text-center">No notifications yet.</div>
						) : (
							items.map(n => {
								const link = getNotificationLink(n);
								const Content = (
									<div className={`p-3 rounded-xl flex items-center justify-between transition border ${n.isRead ? "bg-gray-100 dark:bg-gray-800 border-transparent" : "bg-white dark:bg-gray-700/50 border-indigo-200 dark:border-indigo-600/50 hover:shadow-lg"}`}>
										<div className="flex-1 min-w-0 pr-4">
											<div className="text-sm font-medium">{n.message || 'New Activity'}</div>
											<div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt || n.ts || Date.now()).toLocaleString()}</div>
										</div>
										{!n.isRead && (
											<button onClick={() => markRead(n._id)} className="px-3 py-1 rounded bg-indigo-600 text-white text-xs flex-shrink-0 hover:bg-indigo-700 transition">
												Mark read
											</button>
										)}
									</div>
								);
								
								return (
									<motion.div key={n._id || n.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} layout>
										{link ? <Link to={link}>{Content}</Link> : Content}
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