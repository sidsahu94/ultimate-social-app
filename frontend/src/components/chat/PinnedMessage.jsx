// frontend/src/components/chat/PinnedMessage.jsx
import React, { useMemo, useState } from 'react';
import { FaThumbtack, FaChevronDown, FaTimes } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';

export default function PinnedMessage({ messages = [], onUnpin }) {
  const [isOpen, setIsOpen] = useState(false);

  const latest = useMemo(() => {
    if (!messages.length) return null;
    return messages[messages.length - 1];
  }, [messages]);

  if (!latest) return null;

  return (
    <div className="w-full border-b border-[rgba(226,232,240,0.1)] bg-[#070B14]/90 backdrop-blur-md shadow-sm">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left text-xs"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex min-w-fit items-center gap-2 font-bold text-[#D4AF37]">
          <FaThumbtack size={10} />
          <span>Pinned</span>
        </div>

        <div className="min-w-0 flex-1 truncate border-l-2 border-[#D4AF37]/30 pl-2 font-medium text-[#F8FAFC]">
          {latest.content || 'Media attachment'}
        </div>

        <FaChevronDown className={`text-[#CBD5E1]/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[rgba(226,232,240,0.1)] bg-[#04070D]/95"
          >
            <div className="max-h-36 overflow-y-auto">
              {messages.slice().reverse().map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between gap-3 border-b border-[rgba(226,232,240,0.06)] px-3 py-2 transition hover:bg-white/[0.04]"
                >
                  <span className="min-w-0 flex-1 truncate text-xs text-[#F8FAFC]">
                    {m.content || 'Media'}
                  </span>
                  {onUnpin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpin(m._id);
                      }}
                      className="rounded-full p-1.5 text-[#CBD5E1]/50 transition hover:bg-white/[0.08] hover:text-[#10B981]"
                    >
                      <FaTimes size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
