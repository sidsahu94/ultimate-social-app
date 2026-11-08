// frontend/src/components/layouts/AppDrawer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, FaShoppingBag, FaGamepad, FaChartLine, FaWallet, FaShieldAlt, 
  FaNewspaper, FaChartBar 
} from 'react-icons/fa';

const APPS = [
  { name: 'Events', icon: <FaCalendarAlt />, to: '/events', gradient: 'from-[#052E24] to-[#10B981]', shadow: 'shadow-[0_4px_15px_rgba(16,185,129,0.35)]' },
  { name: 'Market', icon: <FaShoppingBag />, to: '/shop', gradient: 'from-[#D4AF37] via-[#F59E0B] to-[#FEF3C7]', shadow: 'shadow-[0_4px_15px_rgba(212,175,55,0.4)]' },
  { name: 'Games', icon: <FaGamepad />, to: '/games', gradient: 'from-[#00F2FE] via-[#1D4ED8] to-[#070F1E]', shadow: 'shadow-[0_4px_15px_rgba(0,242,254,0.35)]' },
  { name: 'Analytics', icon: <FaChartLine />, to: '/analytics', gradient: 'from-[#00F2FE] to-[#10B981]', shadow: 'shadow-[0_4px_15px_rgba(0,242,254,0.35)]' },
  { name: 'Wallet', icon: <FaWallet />, to: '/wallet', gradient: 'from-[#D4AF37] to-[#F4D49A]', shadow: 'shadow-[0_4px_15px_rgba(212,175,55,0.4)]' },
  { name: 'News', icon: <FaNewspaper />, to: '/apps/news', gradient: 'from-[#052E24] to-[#D4AF37]', shadow: 'shadow-[0_4px_15px_rgba(16,185,129,0.3)]' },
  { name: 'Markets', icon: <FaChartBar />, to: '/apps/markets', gradient: 'from-[#1D4ED8] to-[#00F2FE]', shadow: 'shadow-[0_4px_15px_rgba(0,242,254,0.35)]' },
  { name: 'Safety', icon: <FaShieldAlt />, to: '/report', gradient: 'from-[#070F1E] to-[#10B981]', shadow: 'shadow-[0_4px_15px_rgba(16,185,129,0.35)]' },
];

export default function AppDrawer({ onItemClick }) {
  return (
    <div className="p-4 border-t border-[rgba(0,242,254,0.14)] mt-2">
      <h4 className="text-[10px] font-bold text-[#CBD5E1]/80 uppercase tracking-widest mb-4">Aetheria Ecosystem</h4>
      
      <div className="grid grid-cols-4 gap-4">
        {APPS.map((app) => (
          <Link 
            key={app.name} 
            to={app.to} 
            onClick={onItemClick}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`
              relative w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg
              bg-gradient-to-br ${app.gradient} ${app.shadow} shadow-lg
              transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1
              border border-[rgba(0,242,254,0.22)]
            `}>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent opacity-60 pointer-events-none" />
              <div className="relative z-10 drop-shadow-md">
                {app.icon}
              </div>
            </div>

            <span className="text-[10px] font-semibold text-[#CBD5E1]/70 group-hover:text-[#00F2FE] transition-colors">
              {app.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
