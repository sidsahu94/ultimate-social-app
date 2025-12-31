import React, { useState } from 'react';
import { FaReply, FaTrash, FaCopy, FaSmile } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import LinkPreviewCard from '../ui/LinkPreviewCard'; 

export default function MessageBubble({ message, isMe, onReply, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const { add } = useToast();

  // 🔥 SYSTEM MESSAGE HANDLING
  if (message.isSystem) {
      return (
          <div className="flex justify-center my-4 w-full">
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full italic shadow-sm border border-gray-200 dark:border-gray-700">
                  {message.content}
              </span>
          </div>
      );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    add("Copied!", { type: 'success', timeout: 1000 });
    setShowActions(false);
  };

  // 🔥 HANDLE UNSEND
  const handleUnsend = () => {
    if (window.confirm("Are you sure you want to unsend this message?")) {
        if (onDelete) onDelete(message._id);
    }
  };

  // Helper to render links
  const renderContent = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`underline font-medium hover:opacity-80 break-all ${isMe ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'} relative group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply Context */}
      {message.replyTo && (
        <div className={`text-xs mb-1 px-3 py-1 rounded-lg opacity-70 ${isMe ? 'bg-indigo-700 text-white' : 'bg-gray-200 text-gray-600'}`}>
          Replying to: {message.replyTo.content?.slice(0, 30)}...
        </div>
      )}

      <div className="flex items-center gap-2 max-w-[85%] md:max-w-[70%]">
        {/* Actions Menu (Left side for Me) */}
        {isMe && showActions && (
          <div className="flex gap-2 text-gray-400 text-sm bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm animate-fade-in">
            {/* 🔥 UPDATE: Wired handleUnsend */}
            <button onClick={handleUnsend} className="hover:text-red-500 p-1" title="Unsend Message"><FaTrash /></button>
            <button onClick={handleCopy} className="hover:text-blue-500 p-1"><FaCopy /></button>
            <button onClick={() => onReply(message)} className="hover:text-green-500 p-1"><FaReply /></button>
          </div>
        )}

        {/* The Message Bubble */}
        <div 
          className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words w-full
            ${isMe 
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-sm' 
              : 'bg-white dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600'
            }`}
        >
          {/* Audio Message */}
          {message.audio && (
             <audio controls src={message.audio} className="h-8 w-full min-w-[200px] mb-2 mt-1" />
          )}

          {/* Image Message */}
          {message.media && (
             <img 
               src={message.media} 
               className="mt-1 mb-2 rounded-lg max-h-60 w-full object-cover cursor-zoom-in bg-black/10" 
               alt="attachment" 
             />
          )}

          {/* Text Content */}
          <div className="whitespace-pre-wrap">
            {renderContent(message.content)}
          </div>

          {/* Link Preview */}
          {!isMe && message.content && (
             <div className="mt-2">
               <LinkPreviewCard text={message.content} />
             </div>
          )}
          
          {/* Timestamp & Read Receipts */}
          <div className={`text-[10px] mt-1 text-right flex justify-end items-center gap-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {isMe && <span>{message.seenBy?.length > 0 ? '✓✓' : '✓'}</span>}
          </div>
        </div>

        {/* Actions Menu (Right side for Others) */}
        {!isMe && showActions && (
          <div className="flex gap-2 text-gray-400 text-sm bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm animate-fade-in">
            <button onClick={() => onReply(message)} className="hover:text-green-500 p-1"><FaReply /></button>
            <button onClick={handleCopy} className="hover:text-blue-500 p-1"><FaCopy /></button>
            <button className="hover:text-yellow-500 p-1"><FaSmile /></button>
          </div>
        )}
      </div>
    </motion.div>
  );
}