// frontend/src/pages/notifications/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import { useToast } from "../../components/ui/ToastProvider";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const { add } = useToast();
  const [loadingIds, setLoadingIds] = useState({});

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setItems([]); // show none for anonymous users
        return;
      }
      try {
        const r = await API.get("/notifications");
        setItems(r.data || []);
      } catch (e) {
        try {
          const r2 = await API.get("/notifications/list");
          setItems(r2.data || []);
        } catch (err) {
          console.warn("No notifications endpoint available", err);
          add("Unable to load notifications", { type: "error" });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id) => {
    if (!id) return;
    setLoadingIds(s => ({ ...s, [id]: true }));
    try {
      // backend route exposed a POST /notifications/:id/read in your routes
      await API.post(`/notifications/${id}/read`);
      setItems(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error("mark read failed", err);
      add(err.userMessage || "Failed to mark read", { type: "error" });
    } finally {
      setLoadingIds(s => ({ ...s, [id]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="card p-4">
        <h3 className="font-semibold">Notifications</h3>
        <div className="mt-3 space-y-2">
          {items.length === 0 ? <div className="text-gray-500">No notifications yet.</div> :
            items.map(n => (
              <motion.div key={n._id} whileHover={{ scale: 1.01 }} className={`p-3 rounded flex items-center justify-between ${n.isRead ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"}`}>
                <div>
                  <div className="text-sm">{n.message}</div>
                  <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead && <button disabled={!!loadingIds[n._id]} onClick={() => markRead(n._id)} className="btn-primary">{loadingIds[n._id] ? '...' : 'Mark read'}</button>}
              </motion.div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
