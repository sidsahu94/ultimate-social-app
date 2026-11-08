import React, { useEffect, useState } from 'react';
import { FaReply, FaTrash, FaCopy, FaPen, FaShare, FaThumbtack, FaLock, FaHourglassHalf } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import VoiceMessage from './VoiceMessage';
import PollBubble from './PollBubble';
import { decryptMessage } from '../../utils/security';
import { getImageUrl } from '../../utils/imageUtils';

const isVideo = (url) => url && /\.(mp4|webm|ogg|mov)$/i.test(url);

export default function MessageBubble({ message, isMe, onReply, onDelete, onEdit, onForward, onPin, onMediaLoad }) {
  const [showMenu, setShowMenu] = useState(false);
  const [displayContent, setDisplayContent] = useState(message.content || '');
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (!message?.isEphemeral || !message?.expiresAt) return null;
    const diff = Math.floor((new Date(message.expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });
  const { add } = useToast();

  useEffect(() => {
    let active = true;
    if (message.isEncrypted && message.content) {
      decryptMessage(message.content, message.chat?._id || message.chat).then((dec) => {
        if (active) setDisplayContent(dec);
      });
    } else {
      setDisplayContent(message.content || '');
    }
    return () => {
      active = false;
    };
  }, [message.content, message.isEncrypted, message.chat]);

  useEffect(() => {
    if (!message?.isEphemeral || !message?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(message.expiresAt).getTime() - Date.now()) / 1000);
      setSecondsRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [message?.isEphemeral, message?.expiresAt]);

  if (secondsRemaining === 0) {
    return null; // Self-destructed
  }

  if (message?.isSystem) {
    return (
      <div className="my-4 flex w-full justify-center select-none">
        <span className="rounded-full border border-[rgba(226,232,240,0.14)] bg-[#070B14] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#CBD5E1]/70 shadow-sm">
          {displayContent}
        </span>
      </div>
    );
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      add('Copied!', { type: 'success', timeout: 1000 });
    } catch (_) {}
    setShowMenu(false);
  };

  const renderText = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="break-all font-medium underline text-[#00F2FE] hover:text-white transition-colors"
        >
          {part}
        </a>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  const MenuItem = ({ icon, label, onClick, color }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        setShowMenu(false);
      }}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/[0.08] ${color || 'text-[#F8FAFC]'}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {showMenu && <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowMenu(false)} />}

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative mb-1.5 flex w-full ${isMe ? 'justify-end' : 'justify-start'} select-none`}
      >
        <div className="group relative max-w-[85%] md:max-w-[70%]">
          {message.isForwarded && (
            <div className={`mb-1 flex items-center gap-1 text-[10px] italic text-[#CBD5E1]/60 ${isMe ? 'justify-end' : ''}`}>
              <FaShare /> Forwarded
            </div>
          )}

          {message.replyTo && (
            <div className={`mb-1 flex flex-col rounded-xl border-l-4 px-3 py-1.5 text-xs opacity-90 ${isMe ? 'items-end border-white/60 bg-white/10 text-white' : 'items-start border-[#00F2FE] bg-[#070B14] text-[#F8FAFC] border border-[rgba(226,232,240,0.12)]'}`}>
              <span className="text-[10px] font-bold text-[#D4AF37]">{message.replyTo.sender?.name || 'User'}</span>
              <span className="max-w-[220px] truncate text-[#CBD5E1]/80">
                {message.replyTo.isEncrypted ? '🔒 Encrypted Message' : message.replyTo.content || 'Attachment'}
              </span>
            </div>
          )}

          <div
            onClick={() => setShowMenu((v) => !v)}
            className={`relative min-w-[80px] cursor-pointer rounded-2xl shadow-sm transition-transform active:scale-95 ${
              isMe
                ? 'rounded-br-sm bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E3A8A] text-white shadow-sapphireGlow border border-[rgba(226,232,240,0.2)]'
                : 'rounded-bl-sm border border-[rgba(226,232,240,0.14)] bg-[#070B14]/85 backdrop-blur-xl text-[#F8FAFC] shadow-silverGlass'
            } ${showMenu ? 'ring-2 ring-[#00F2FE]/70 ring-offset-2 ring-offset-[#04070D]' : ''}`}
          >
            {message.type === 'poll' ? (
              <div className="p-3">
                <PollBubble message={message} isMe={isMe} />
              </div>
            ) : message.audio ? (
              <VoiceMessage src={message.audio} isMe={isMe} />
            ) : (
              <div className="px-4 py-2 text-sm leading-relaxed">
                {message.media && (
                  isVideo(message.media) ? (
                    <video
                      src={getImageUrl(message.media)}
                      controls
                      onLoadedData={onMediaLoad}
                      className="mb-2 mt-1 max-h-60 w-full rounded-lg object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={getImageUrl(message.media)}
                      alt="attachment"
                      onLoad={onMediaLoad}
                      className="mb-2 mt-1 max-h-60 w-full rounded-lg object-cover bg-black/20"
                    />
                  )
                )}
                <div className="whitespace-pre-wrap">{renderText(displayContent)}</div>
              </div>
            )}

            <div className={`flex items-center justify-end gap-1.5 px-3 pb-2 text-[10px] ${isMe ? 'text-white/80' : 'text-[#CBD5E1]/60'}`}>
              {message.isEncrypted && (
                <FaLock className="text-[#00F2FE] text-[9px]" title="End-to-End Encrypted (AES-GCM-256)" />
              )}
              {secondsRemaining !== null && (
                <span className="flex items-center gap-0.5 text-[#D4AF37] font-semibold bg-[#D4AF37]/20 px-1.5 py-0.5 rounded-full text-[9px] border border-[#D4AF37]/40">
                  <FaHourglassHalf className="text-[8px] animate-pulse" /> {secondsRemaining}s
                </span>
              )}
              {message.editedAt && <span className="italic">(edited)</span>}
              <span className="font-mono">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isMe && (
                <span 
                  className={`text-[11px] font-bold tracking-tighter ${message.isRead || (Array.isArray(message.readBy) && message.readBy.length > 1) ? 'text-[#00F2FE]' : 'text-white/60'}`} 
                  title={message.isRead ? 'Read' : 'Delivered'}
                >
                  {message.isRead || (Array.isArray(message.readBy) && message.readBy.length > 1) ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-[rgba(226,232,240,0.15)] bg-[#070B14]/95 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8)]">
              <MenuItem icon={<FaReply className="text-[#00F2FE]" />} label="Reply" onClick={() => onReply?.(message)} />
              <MenuItem icon={<FaShare className="text-[#D4AF37]" />} label="Forward" onClick={() => onForward?.(message)} />
              <MenuItem icon={<FaThumbtack className="text-[#1D4ED8]" />} label={message.isPinned ? 'Unpin' : 'Pin'} onClick={() => onPin?.(message._id)} />
              {isMe && <MenuItem icon={<FaPen className="text-[#CBD5E1]" />} label="Edit" onClick={() => onEdit?.(message)} />}
              {isMe && <MenuItem icon={<FaTrash className="text-[#10B981]" />} label="Delete" onClick={() => onDelete?.(message._id)} color="text-[#10B981]" />}
              <MenuItem icon={<FaCopy className="text-[#CBD5E1]" />} label="Copy" onClick={copyText} />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
