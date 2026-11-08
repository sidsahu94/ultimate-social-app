// frontend/src/components/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import RightSidebar from './RightSidebar';
import AudioSpace from '../chat/AudioSpace';

export default function MainLayout() {
  return (
    <>
      {/* Global audio space overlay */}
      <AudioSpace />

      {/* Main content grid */}
      <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-8 px-4 md:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Middle content track */}
        <div className="min-w-0 py-6 md:py-8">
          <div className="mx-auto w-full max-w-[760px] min-h-[calc(100vh-140px)]">
            <Outlet />
          </div>
        </div>

        {/* Right track */}
        <aside className="hidden xl:block py-6">
          <div className="sticky top-6">
            <RightSidebar />
          </div>
        </aside>
      </div>
    </>
  );
}
