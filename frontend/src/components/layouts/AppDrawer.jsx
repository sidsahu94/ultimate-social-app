import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaShoppingBag, FaGamepad, FaChartLine, FaWallet, FaShieldAlt } from 'react-icons/fa';

const APPS = [
  { name: 'Events', icon: <FaCalendarAlt />, to: '/events', color: 'bg-green-500' },
  { name: 'Market', icon: <FaShoppingBag />, to: '/shop', color: 'bg-orange-500' },
  { name: 'Games', icon: <FaGamepad />, to: '/games', color: 'bg-purple-500' },
  { name: 'Analytics', icon: <FaChartLine />, to: '/analytics', color: 'bg-blue-500' },
  { name: 'Wallet', icon: <FaWallet />, to: '/wallet', color: 'bg-yellow-500' },
  { name: 'Safety', icon: <FaShieldAlt />, to: '/report', color: 'bg-red-500' },
];

export default function AppDrawer() {
  return (
    <div className="p-4 border-t dark:border-gray-800">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">More Apps</h4>
      <div className="grid grid-cols-3 gap-2">
        {APPS.map((app) => (
          <Link key={app.name} to={app.to} className="flex flex-col items-center gap-1 group">
            <div className={`w-10 h-10 rounded-xl ${app.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              {app.icon}
            </div>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{app.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}