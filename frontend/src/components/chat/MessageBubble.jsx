// frontend/src/components/chat/MessageBubble.jsx
import React, { useState } from 'react';
import { FaReply, FaTrash, FaCopy, FaPen, FaCheck, FaCheckDouble, FaShare, FaThumbtack } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import LinkPreviewCard from '../ui/LinkPreviewCard';
import VoiceMessage from './VoiceMessage';
import PollBubble from './PollBubble';
// 🔥 FIX: Import Decryption Utility
import { decryptMessage } from '../../utils/security';

const isVideo = (url) => {
    return url && url.match(/\.(mp4|webm|ogg|mov)$/i);
};

export default function MessageBubble({ message, isMe, onReply, onDelete, onEdit, onForward, onPin, onMediaLoad }) {
  const [showMenu, setShowMenu] = useState(false);
  const { add } = useToast();

  if (message.isSystem) {
      return (
          <div className="flex justify-center my-4 w-full select-none">
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border dark:border-gray-700 tracking-wider">
                  {message.content}
              </span>
          </div>
      );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getDisplayContent());
    add("Copied!", { type: 'success', timeout: 1000 });
    setShowMenu(false);
  };

  // 🔥 FIX: Helper to safely get content
  const getDisplayContent = () => {
      // If the flag is set, decrypt it. 
      if (message.isEncrypted) {
          return decryptMessage(message.content);
      }
      return message.content;
  };

  const renderText = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => 
      part.match(urlRegex) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline font-medium break-all ${isMe ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>
          {part}
        </a>
      ) : part
    );
  };

  const MenuItem = ({ icon, label, onClick, color }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); setShowMenu(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition ${color || 'text-gray-700 dark:text-gray-200'}`}
    >
        {icon} <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {showMenu && <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowMenu(false)} />}

      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'} relative select-none`}
      >
        <div className={`relative max-w-[85%] md:max-w-[70%] group`}>
          
          {message.isForwarded && (
              <div className={`text-[10px] text-gray-400 italic mb-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <FaShare /> Forwarded
              </div>
          )}

          {message.replyTo && (
            <div className={`text-xs mb-1 px-3 py-1.5 rounded-xl opacity-80 border-l-4 flex flex-col ${isMe ? 'bg-indigo-900/50 border-indigo-300 text-indigo-100 items-end' : 'bg-gray-200 dark:bg-gray-800 border-gray-400 text-gray-500 items-start'}`}>
              <span className="font-bold text-[10px]">{message.replyTo.sender?.name || 'User'}</span>
              <span className="truncate max-w-[200px]">
                  {/* Handle encrypted reply previews simply */}
                  {message.replyTo.isEncrypted ? "🔒 Encrypted Message" : message.replyTo.content || 'Attachment'}
              </span>
            </div>
          )}

          {/* BUBBLE CONTAINER */}
          <div 
            onClick={() => setShowMenu(!showMenu)}
            className={`rounded-2xl shadow-sm relative min-w-[80px] cursor-pointer transition-transform active:scale-95
              ${isMe 
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-sm' 
                : 'bg-white dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600'
              }
              ${showMenu ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-900' : ''}
            `}
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
                            <div className="mt-1 mb-2 rounded-lg overflow-hidden max-h-60 w-full bg-black relative">
                                <video 
                                    src={message.media} 
                                    controls 
                                    onLoadedData={onMediaLoad} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <img 
                                src={message.media} 
                                onLoad={onMediaLoad}
                                className="mt-1 mb-2 rounded-lg max-h-60 w-full object-cover bg-black/10" 
                                alt="attachment" 
                            />
                        )
                    )}
                    {/* 🔥 FIX: Render Decrypted Content */}
                    <div className="whitespace-pre-wrap">{renderText(getDisplayContent())}</div>
                    
                    {!isMe && message.content && !message.media && !message.isEncrypted && (
                        <div className="mt-2"><LinkPreviewCard text={message.content} /></div>
                    )}
                </div>
            )}
            
            <div className={`text-[10px] pb-2 px-3 flex justify-end items-center gap-1.5 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
              {message.editedAt && <span className="italic opacity-75">(edited)</span>}
              <span>{new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              {isMe && <span>{message.seenBy?.length > 0 ? <FaCheckDouble className="text-blue-300" /> : <FaCheck />}</span>}
            </div>
          </div>

          <AnimatePresence>
            {showMenu && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className={`absolute z-50 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden min-w-[160px] ${isMe ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}
                >
                    <MenuItem icon={<FaReply />} label="Reply" onClick={() => onReply(message)} />
                    <MenuItem icon={<FaCopy />} label="Copy" onClick={handleCopy} />
                    <MenuItem icon={<FaShare />} label="Forward" onClick={() => onForward(message)} />
                    <MenuItem icon={<FaThumbtack />} label="Pin" onClick={() => onPin(message._id)} />
                    {isMe && (
                        <>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                            {!message.audio && <MenuItem icon={<FaPen />} label="Edit" onClick={() => onEdit(message)} />}
                            <MenuItem icon={<FaTrash />} label="Unsend" onClick={() => onDelete(message._id)} color="text-red-500" />
                        </>
                    )}
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}