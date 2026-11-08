// frontend/src/components/profile/ProfileCompletion.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaMapMarkerAlt, FaLink, FaCheckCircle } from 'react-icons/fa';

export default function ProfileCompletion({ user }) {
  const { score, missing } = useMemo(() => {
    if (!user) return { score: 0, missing: [] };

    let s = 20; // Base score for account creation
    const m = [];

    if (user.avatar) s += 20; 
    else m.push({ label: 'Add Avatar', icon: <FaUserPlus />, link: '/settings' });

    if (user.bio) s += 20; 
    else m.push({ label: 'Add Bio', icon: <FaUserPlus />, link: '/settings' });

    if (user.coverPhoto) s += 20;

    if (user.location) s += 10;
    else m.push({ label: 'Add Location', icon: <FaMapMarkerAlt />, link: '/settings' });

    if (user.socialLinks?.twitter || user.socialLinks?.instagram || user.website) s += 10;
    else m.push({ label: 'Add Socials', icon: <FaLink />, link: '/settings' });

    return { score: Math.min(s, 100), missing: m };
  }, [user]);

  if (!user || score >= 100) return null;

  return (
    <div className="bg-[#070B14] p-5 rounded-2xl mb-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] animate-fade-in backdrop-blur-xl">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-sm text-[#F7F7FC] flex items-center gap-2 font-serif">
          <FaCheckCircle className="text-[#00F2FE]" /> Complete your profile
        </h4>
        <span className="font-black text-lg text-[#F4D49A]">{score}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2.5 w-full bg-[#0A111E] rounded-full overflow-hidden mb-4 border border-white/5 shadow-inner">
        <div 
            className="h-full bg-gradient-to-r from-[#1D4ED8] via-[#0F766E] to-[#00F2FE] transition-all duration-1000 ease-out rounded-full" 
            style={{ width: `${score}%` }} 
        />
      </div>

      {/* Action Chips */}
      <div className="flex flex-wrap gap-2">
        {missing.map((item, i) => (
          <Link 
            key={i} 
            to={item.link} 
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#0A111E] px-3 py-1.5 rounded-full shadow-sm hover:shadow-md text-[#CBD5E1] border border-white/10 transition hover:border-[#00F2FE]/40 hover:text-white"
          >
            <span className="text-[#D4AF37]">{item.icon}</span> {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
