import React, { useState } from 'react';
import { FaReply, FaTrash, FaCopy, FaSmile } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';

export default function MessageBubble({ message, isMe, onReply, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const { add } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    add("Copied!", { type: 'success', timeout: 1000 });
    setShowActions(false);
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

      <div className="flex items-center gap-2 max-w-[80%]">
        {/* Actions Menu (Left side for Me, Right side for Others) */}
        {isMe && showActions && (
          <div className="flex gap-2 text-gray-400 text-sm bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm">
            <button onClick={() => onDelete(message._id)} className="hover:text-red-500"><FaTrash /></button>
            <button onClick={handleCopy} className="hover:text-blue-500"><FaCopy /></button>
            <button onClick={() => onReply(message)} className="hover:text-green-500"><FaReply /></button>
          </div>
        )}

        {/* The Message Bubble */}
        <div 
          className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words
            ${isMe 
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-sm' 
              : 'bg-white dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600'
            }`}
        >
          {message.content}
          
          {/* Timestamp */}
          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {isMe && <span className="ml-1">{message.seenBy?.length > 0 ? '✓✓' : '✓'}</span>}
          </div>
        </div>

        {/* Actions Menu (Right side for Others) */}
        {!isMe && showActions && (
          <div className="flex gap-2 text-gray-400 text-sm bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm">
            <button onClick={() => onReply(message)} className="hover:text-green-500"><FaReply /></button>
            <button onClick={handleCopy} className="hover:text-blue-500"><FaCopy /></button>
            <button className="hover:text-yellow-500"><FaSmile /></button>
          </div>
        )}
      </div>
    </motion.div>
  );
}