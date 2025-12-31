import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import RightSidebar from './RightSidebar';
import AudioSpace from '../chat/AudioSpace';
import CommandPalette from '../common/CommandPalette';
import IncomingCall from '../chat/IncomingCall';
import { motion } from 'framer-motion';

export default function MainLayout() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Global Overlays */}
      <CommandPalette />
      <IncomingCall />
      <AudioSpace />

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-[80px_1fr] xl:grid-cols-[280px_1fr_350px]">
        
        {/* LEFT: Navigation - Sticky Fixed */}
        <div className="hidden md:block sticky top-0 h-screen z-30 overflow-y-auto no-scrollbar">
          <Navbar />
        </div>

        {/* MIDDLE: Feed/Content */}
        {/* 🔥 FIX: Added 'pb-24' for mobile to clear the bottom navbar, 'md:pb-6' for desktop */}
        <main className="min-h-screen w-full max-w-[700px] mx-auto pt-4 md:pt-6 px-0 md:px-4 pb-24 md:pb-6 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* RIGHT: Trends & Suggestions - Sticky Fixed */}
        <div className="hidden xl:block sticky top-0 h-screen pl-6 py-6 overflow-y-auto no-scrollbar z-20">
          <RightSidebar />
        </div>

      </div>

      {/* Mobile Nav (Bottom Dock) - Rendered by Navbar component conditionally */}
      <div className="md:hidden">
        <Navbar />
      </div>
    </div>
  );
}