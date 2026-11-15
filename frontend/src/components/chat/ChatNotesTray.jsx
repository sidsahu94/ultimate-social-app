// frontend/src/components/chat/ChatNotesTray.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../../services/api';
import UserAvatar from '../ui/UserAvatar';
import { FaPlus, FaTimes, FaSmile } from 'react-icons/fa';
import { useToast } from '../ui/ToastProvider';

const QUICK_EMOJIS = ['💭', '☕', '🎧', '🚀', '💻', '✨', '🔥', '🌴'];

export default function ChatNotesTray({ onSelectUser }) {
  const { user } = useSelector((s) => s.auth);
  const { add: addToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💭');
  const [saving, setSaving] = useState(false);

  const myNote = notes.find((n) => String(n._id) === String(user?._id))?.dailyNote || user?.dailyNote;

  const loadNotes = async () => {
    try {
      const res = await API.get('/users/notes');
      const list = res.data?.data || res.data;
      if (Array.isArray(list)) {
        setNotes(list);
      }
    } catch (_) {
      // Quiet fallback
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSaveNote = async () => {
    if (!noteText.trim() && !myNote?.text) return;
    setSaving(true);
    try {
      await API.put('/users/note', { text: noteText, emoji: selectedEmoji });
      addToast(noteText ? '24h Thought shared with friends!' : 'Note removed', { type: 'success' });
      setShowModal(false);
      setNoteText('');
      loadNotes();
    } catch (e) {
      addToast('Failed to save note', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="border-b border-white/5 py-3 px-3 bg-[#04070D]/40">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {/* Current User Note Bubble */}
          <div
            onClick={() => {
              setNoteText(myNote?.text || '');
              setSelectedEmoji(myNote?.emoji || '💭');
              setShowModal(true);
            }}
            className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
          >
            <div className="relative mb-1">
              <div className="w-12 h-12 rounded-full ring-2 ring-transparent group-hover:ring-[#00F2FE]/50 transition-all">
                <UserAvatar src={user?.avatar} name={user?.name} className="w-12 h-12 rounded-full" />
              </div>

              {myNote?.text ? (
                <div className="absolute -top-3 -right-2 max-w-[85px] bg-[#171A26] border border-[#00F2FE]/30 text-[10px] text-white px-2 py-0.5 rounded-full shadow-lg truncate backdrop-blur-md animate-bounce">
                  <span>{myNote.emoji} {myNote.text}</span>
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 bg-[#1D4ED8] text-white p-1 rounded-full shadow text-[10px]">
                  <FaPlus size={8} />
                </div>
              )}
            </div>
            <span className="text-[10px] text-[#CBD5E1]/80 max-w-[56px] truncate">
              {myNote?.text ? 'Your note' : 'Share thought'}
            </span>
          </div>

          {/* Friends Notes */}
          {notes
            .filter((n) => String(n._id) !== String(user?._id))
            .map((friend) => (
              <div
                key={friend._id}
                onClick={() => onSelectUser && onSelectUser(friend._id)}
                className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
              >
                <div className="relative mb-1">
                  <div className="w-12 h-12 rounded-full ring-2 ring-transparent group-hover:ring-[#00F2FE]/50 transition-all">
                    <UserAvatar src={friend.avatar} name={friend.name} className="w-12 h-12 rounded-full" />
                  </div>
                  {friend.dailyNote?.text && (
                    <div className="absolute -top-3 -right-2 max-w-[85px] bg-[#070B14]/95 border border-white/20 text-[10px] text-white px-2 py-0.5 rounded-full shadow-lg truncate backdrop-blur-md">
                      <span>{friend.dailyNote.emoji} {friend.dailyNote.text}</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#CBD5E1]/80 max-w-[56px] truncate">
                  {friend.name?.split(' ')[0]}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Note Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#070B14] border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#CBD5E1]/60 hover:text-white p-1 rounded-full"
            >
              <FaTimes />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="relative mb-3">
                <UserAvatar src={user?.avatar} name={user?.name} className="w-16 h-16 rounded-full border border-white/10" />
                <div className="absolute -top-2 right-0 bg-[#0A111E] border border-white/20 text-xs px-2 py-0.5 rounded-full">
                  {selectedEmoji}
                </div>
              </div>
              <h3 className="font-bold text-base text-[#F7F7FC]">Share a 24-hour Thought</h3>
              <p className="text-xs text-[#CBD5E1]/60 mt-1">Friends who follow you can see this thought at the top of their chat inbox.</p>
            </div>

            {/* Quick Emoji Pick */}
            <div className="flex justify-center gap-2 mb-4">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-base p-1.5 rounded-xl transition ${
                    selectedEmoji === emoji ? 'bg-white/20 scale-110' : 'hover:bg-white/5 opacity-70'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value.slice(0, 60))}
                placeholder="What's on your mind?..."
                className="w-full p-3.5 rounded-2xl bg-[#0A111E] border border-white/10 text-sm text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition"
              />
              <span className="absolute right-3.5 bottom-3.5 text-[10px] text-[#A5A9BB] font-mono">
                {60 - noteText.length}
              </span>
            </div>

            <div className="flex gap-2">
              {myNote?.text && (
                <button
                  type="button"
                  onClick={() => {
                    setNoteText('');
                    handleSaveNote();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveNote}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white text-xs font-bold shadow-lg hover:opacity-95 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Share Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
