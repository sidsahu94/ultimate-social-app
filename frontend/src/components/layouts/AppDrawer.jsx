// frontend/src/components/layouts/AppDrawer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, FaShoppingBag, FaGamepad, FaChartLine, FaWallet, FaShieldAlt, 
  FaNewspaper, FaChartBar 
} from 'react-icons/fa';

// 🔥 Upgrade: Added Vivid Gradients & Shadow Colors
const APPS = [
  { name: 'Events', icon: <FaCalendarAlt />, to: '/events', gradient: 'from-emerald-400 to-green-600', shadow: 'shadow-green-500/40' },
  { name: 'Market', icon: <FaShoppingBag />, to: '/shop', gradient: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/40' },
  { name: 'Games', icon: <FaGamepad />, to: '/games', gradient: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/40' },
  { name: 'Analytics', icon: <FaChartLine />, to: '/analytics', gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/40' },
  { name: 'Wallet', icon: <FaWallet />, to: '/wallet', gradient: 'from-yellow-400 to-amber-600', shadow: 'shadow-amber-500/40' },
  { name: 'News', icon: <FaNewspaper />, to: '/apps/news', gradient: 'from-rose-400 to-pink-600', shadow: 'shadow-pink-500/40' },
  { name: 'Markets', icon: <FaChartBar />, to: '/apps/markets', gradient: 'from-cyan-400 to-teal-600', shadow: 'shadow-cyan-500/40' },
  { name: 'Safety', icon: <FaShieldAlt />, to: '/report', gradient: 'from-slate-500 to-slate-700', shadow: 'shadow-slate-500/40' },
];

export default function AppDrawer() {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-2">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Apps Ecosystem</h4>
      
      <div className="grid grid-cols-4 gap-4">
        {APPS.map((app) => (
          <Link key={app.name} to={app.to} className="flex flex-col items-center gap-2 group">
            
            {/* The Icon Container */}
            <div className={`
              relative w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg
              bg-gradient-to-br ${app.gradient} ${app.shadow} shadow-lg
              transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1
              border border-white/20
            `}>
              {/* Glass Glare Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />
              
              {/* Icon */}
              <div className="relative z-10 drop-shadow-md">
                {app.icon}
              </div>
            </div>

            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 transition-colors">
              {app.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}