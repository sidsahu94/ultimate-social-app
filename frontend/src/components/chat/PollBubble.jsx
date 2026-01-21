// frontend/src/components/chat/PollBubble.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { FaChartBar, FaCheckCircle } from 'react-icons/fa';

export default function PollBubble({ message, isMe }) {
  // Sync local state with message prop to handle real-time updates via socket
  const [options, setOptions] = useState(message.pollOptions || []);
  const [voted, setVoted] = useState(false);
  const { add } = useToast();

  // Check if current user has voted in any option whenever options update
  useEffect(() => {
    setOptions(message.pollOptions || []);
    // Simple check: In a real app, you might want to check against your specific user ID 
    // if 'votes' contains IDs. Assuming 'votes' array contains user IDs.
    const myId = localStorage.getItem('meId');
    if (message.pollOptions) {
        const hasVoted = message.pollOptions.some(opt => opt.votes.includes(myId));
        setVoted(hasVoted);
    }
  }, [message]);

  const totalVotes = options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

  const handleVote = async (idx) => {
    if (voted) return; // Prevent multiple votes per user per poll locally

    // Optimistic UI update (optional, but makes it feel snappier)
    // We wait for the real update via socket or API response to be sure
    setVoted(true);

    try {
        // 🔥 FIX: Call actual backend endpoint
        const res = await API.post(`/chat/message/${message._id}/vote`, { optionIndex: idx });
        
        // Update local state immediately with fresh data from backend response
        if (res.data && res.data.pollOptions) {
            setOptions(res.data.pollOptions);
            add("Vote recorded!", { type: 'success' });
        }
    } catch (e) {
        setVoted(false); // Revert if failed
        add("Failed to vote", { type: 'error' });
        console.error(e);
    }
  };

  return (
    <div className={`p-3 rounded-lg min-w-[240px] border ${isMe ? 'border-white/20 bg-white/10' : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'}`}>
        <div className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isMe ? 'text-indigo-200' : 'text-indigo-500'}`}>
            <FaChartBar /> Poll
        </div>
        
        <div className={`font-bold text-sm mb-4 ${isMe ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {message.content}
        </div>

        <div className="space-y-2">
            {options.map((opt, i) => {
                const count = opt.votes?.length || 0;
                const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                const myId = localStorage.getItem('meId');
                const isSelected = opt.votes?.includes(myId);
                
                return (
                    <button 
                        key={i}
                        onClick={(e) => { e.stopPropagation(); handleVote(i); }}
                        disabled={voted}
                        className={`w-full relative h-9 rounded-lg overflow-hidden transition-all group ${
                            voted ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'
                        } ${isMe ? 'bg-black/20' : 'bg-white dark:bg-gray-700 shadow-sm'}`}
                    >
                        {/* Progress Bar Background */}
                        <div 
                            className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ease-out ${
                                isSelected 
                                    ? 'bg-green-500/80' 
                                    : isMe ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/50'
                            }`} 
                            style={{ width: `${pct}%` }} 
                        />
                        
                        {/* Content Layer */}
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold z-10">
                            <span className={`flex items-center gap-2 ${isMe ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                {opt.text}
                                {isSelected && <FaCheckCircle className={isMe ? "text-white" : "text-green-600"} />}
                            </span>
                            <span className={isMe ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}>
                                {pct}%
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
        
        <div className={`text-[10px] mt-3 text-right font-medium ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </div>
    </div>
  );
}