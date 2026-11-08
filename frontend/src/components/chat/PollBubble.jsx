// frontend/src/components/chat/PollBubble.jsx
import React, { useEffect, useMemo, useState } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { FaChartBar, FaCheckCircle } from 'react-icons/fa';

export default function PollBubble({ message, isMe }) {
  const [options, setOptions] = useState(message.pollOptions || []);
  const [voted, setVoted] = useState(false);
  const { add } = useToast();

  const myId = useMemo(() => localStorage.getItem('meId'), []);

  useEffect(() => {
    setOptions(message.pollOptions || []);
    const hasVoted = (message.pollOptions || []).some((opt) =>
      (opt.votes || []).map(String).includes(String(myId))
    );
    setVoted(hasVoted);
  }, [message, myId]);

  const totalVotes = options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

  const handleVote = async (idx) => {
    if (voted) return;
    setVoted(true);

    try {
      const res = await API.post(`/chat/message/${message._id}/vote`, { optionIndex: idx });
      const next = res.data?.pollOptions || res.data?.data?.pollOptions || [];
      if (next.length) setOptions(next);
      add('Vote recorded!', { type: 'success' });
    } catch (e) {
      setVoted(false);
      add(e.response?.data?.message || 'Failed to vote', { type: 'error' });
    }
  };

  return (
    <div className={`min-w-[240px] rounded-2xl border p-3.5 ${isMe ? 'border-white/20 bg-black/20' : 'border-[rgba(226,232,240,0.14)] bg-[#04070D]/80'}`}>
      <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
        <FaChartBar /> Community Poll
      </div>

      <div className="mb-3.5 text-sm font-bold text-[#F8FAFC]">
        {message.content}
      </div>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const count = opt.votes?.length || 0;
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isSelected = (opt.votes || []).map(String).includes(String(myId));

          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                handleVote(i);
              }}
              disabled={voted}
              className={`relative h-9 w-full overflow-hidden rounded-xl border border-[rgba(226,232,240,0.12)] transition-all ${voted ? 'cursor-default' : 'cursor-pointer hover:border-[#00F2FE]/60'} ${
                isMe ? 'bg-black/30' : 'bg-[#070B14]'
              }`}
            >
              <div
                className={`absolute bottom-0 left-0 top-0 transition-all duration-500 ease-out ${
                  isSelected ? 'bg-gradient-to-r from-[#1D4ED8]/70 to-[#00F2FE]/70' : 'bg-white/10'
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="absolute inset-0 z-10 flex items-center justify-between px-3 text-xs font-bold">
                <span className="flex items-center gap-2 text-[#F8FAFC]">
                  {opt.text}
                  {isSelected && <FaCheckCircle className="text-[#00F2FE]" />}
                </span>
                <span className="text-[#CBD5E1]/70 font-mono">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
