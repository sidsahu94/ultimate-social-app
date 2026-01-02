import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaMapMarkerAlt, FaLink, FaCheckCircle } from 'react-icons/fa';

export default function ProfileCompletion({ user }) {
  // Memoize calculation to avoid re-renders
  const { score, missing } = useMemo(() => {
    if (!user) return { score: 0, missing: [] };

    let s = 20; // Base score for account creation
    const m = [];

    if (user.avatar) s += 20; 
    else m.push({ label: 'Add Avatar', icon: <FaUserPlus />, link: '/settings' });

    if (user.bio) s += 20; 
    else m.push({ label: 'Add Bio', icon: <FaUserPlus />, link: '/settings' });

    if (user.coverPhoto) s += 20;
    // Cover photo is optional for "missing" list visually, but counts for score

    if (user.location) s += 10;
    else m.push({ label: 'Add Location', icon: <FaMapMarkerAlt />, link: '/settings' });

    if (user.socialLinks?.twitter || user.socialLinks?.instagram || user.website) s += 10;
    else m.push({ label: 'Add Socials', icon: <FaLink />, link: '/settings' });

    return { score: Math.min(s, 100), missing: m };
  }, [user]);

  // Hide if complete
  if (!user || score >= 100) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-2xl mb-6 border border-indigo-100 dark:border-indigo-800/50 shadow-sm animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
          <FaCheckCircle className="text-indigo-500" /> Complete your profile
        </h4>
        <span className="font-black text-lg text-indigo-600 dark:text-indigo-400">{score}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-3 w-full bg-white dark:bg-gray-700 rounded-full overflow-hidden mb-4 shadow-inner">
        <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out rounded-full" 
            style={{ width: `${score}%` }} 
        />
      </div>

      {/* Action Chips */}
      <div className="flex flex-wrap gap-2">
        {missing.map((item, i) => (
          <Link 
            key={i} 
            to={item.link} 
            className="flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition hover:text-indigo-500 dark:hover:text-indigo-400"
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}