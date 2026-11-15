// frontend/src/components/profile/MyQR.jsx
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSelector } from 'react-redux';
import { FaTimes, FaCopy, FaShareAlt, FaCheck, FaQrcode } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../ui/ToastProvider';

export default function MyQR({ user: propUser, onClose }) {
  const authUser = useSelector((s) => s.auth.user);
  const user = propUser || authUser;
  const { add: addToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const profileUrl = `${window.location.origin}/profile/${user._id || user.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    addToast('Profile link copied to clipboard!', { type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} on SocialVerse`,
          text: `Connect with @${user.username || user.name} on SocialVerse ∞`,
          url: profileUrl,
        });
      } catch (_) {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#070B14]/95 p-6 shadow-2xl backdrop-blur-2xl text-center animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#CBD5E1]/60 hover:text-white hover:bg-white/10 transition"
          title="Close QR"
        >
          <FaTimes size={16} />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/20 text-[#00F2FE] text-[10px] font-bold uppercase tracking-widest mb-4">
          <FaQrcode size={12} /> SocialVerse Nametag
        </div>

        {/* User Info */}
        <div className="flex flex-col items-center mb-5">
          <UserAvatar
            src={user.avatar}
            name={user.name}
            className="w-16 h-16 rounded-full border-2 border-[#00F2FE]/40 shadow-lg shadow-[#00F2FE]/20 mb-2"
          />
          <h3 className="font-bold text-base text-[#F7F7FC]">{user.name}</h3>
          <p className="text-xs text-[#00F2FE] font-mono">@{user.username || 'user'}</p>
        </div>

        {/* QR Code Container with Specular Glow */}
        <div className="relative inline-block p-4 rounded-3xl bg-white shadow-[0_0_40px_rgba(0,242,254,0.15)] border-4 border-white/20 mb-5">
          <QRCodeSVG
            value={profileUrl}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-xs text-[#CBD5E1]/60 mb-5 max-w-xs mx-auto">
          Scan this nametag to instantly view and follow this profile on SocialVerse.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition flex items-center justify-center gap-2"
          >
            {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-[#1D4ED8]/30 hover:opacity-95"
          >
            <FaShareAlt />
            <span>Share Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
