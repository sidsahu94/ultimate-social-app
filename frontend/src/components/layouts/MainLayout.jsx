// frontend/src/components/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import RightSidebar from './RightSidebar';
import AudioSpace from '../chat/AudioSpace';
import HeaderTopBar from '../common/HeaderTopBar';

export default function MainLayout() {
  return (
    <>
      {/* Global audio space overlay */}
      <AudioSpace />

      {/* Main content grid */}
      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-4 md:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Middle content track */}
        <div className="min-w-0 py-3 md:py-5">
          <div className="mx-auto w-full max-w-[780px] min-h-[calc(100vh-140px)]">
            {/* Desktop Top Search Bar & Quick Actions (Matching Images 1 & 2) */}
            <HeaderTopBar />
            
            <Outlet />
          </div>
        </div>

        {/* Right track (Matching Images 1 & 2) */}
        <aside className="hidden xl:block py-3 md:py-5">
          <div className="sticky top-4">
            <RightSidebar />
          </div>
        </aside>
      </div>
    </>
  );
}
