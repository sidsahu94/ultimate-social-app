// frontend/src/pages/misc/FeatureHub.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaCompass,
  FaFeatherAlt,
  FaFire,
  FaVideo,
  FaWallet,
  FaChartLine,
  FaCalendarAlt,
  FaShieldAlt,
  FaBell,
  FaStore,
  FaGamepad,
  FaNewspaper,
  FaGlobeAmericas,
  FaUsers,
  FaCogs,
} from 'react-icons/fa';

const groups = [
  {
    title: 'Discover',
    eyebrow: 'Primary journeys',
    items: [
      {
        title: 'Feed',
        to: '/',
        desc: 'Your personalized home timeline.',
        icon: <FaCompass />,
      },
      {
        title: 'Explore',
        to: '/explore',
        desc: 'Search people, posts, and trends.',
        icon: <FaCompass />,
      },
      {
        title: 'Stories',
        to: '/stories',
        desc: 'Ephemeral, fast-moving content.',
        icon: <FaFire />,
      },
      {
        title: 'Reels',
        to: '/reels',
        desc: 'Short-form cinematic video viewer.',
        icon: <FaVideo />,
      },
    ],
  },
  {
    title: 'Create',
    eyebrow: 'Creator tools',
    items: [
      {
        title: 'Live Studio',
        to: '/live/studio',
        desc: 'Go live with peer-to-peer broadcast.',
        icon: <FaVideo />,
      },
      {
        title: 'Scheduled Posts',
        to: '/scheduled-posts',
        desc: 'Plan and queue content ahead.',
        icon: <FaCalendarAlt />,
      },
      {
        title: 'Composer',
        to: '/',
        desc: 'Open the post creator studio.',
        icon: <FaFeatherAlt />,
        action: true,
      },
      {
        title: 'Analytics',
        to: '/analytics',
        desc: 'Track audience growth and telemetry.',
        icon: <FaChartLine />,
      },
    ],
  },
  {
    title: 'Connect',
    eyebrow: 'Community surfaces',
    items: [
      {
        title: 'Messages',
        to: '/chat',
        desc: 'E2EE private and group conversations.',
        icon: <FaUsers />,
      },
      {
        title: 'Notifications',
        to: '/notifications',
        desc: 'All real-time activity in one stream.',
        icon: <FaBell />,
      },
      {
        title: 'Follow Suggestions',
        to: '/discovery/follow-suggestions',
        desc: 'Creators and peers worth discovering.',
        icon: <FaUsers />,
      },
      {
        title: 'Safety Center',
        to: '/report',
        desc: 'Security, moderation, and reporting.',
        icon: <FaShieldAlt />,
      },
    ],
  },
  {
    title: 'Economy',
    eyebrow: 'Business and utility',
    items: [
      {
        title: 'Wallet',
        to: '/wallet',
        desc: 'Coin ledger, tips, and payouts.',
        icon: <FaWallet />,
      },
      {
        title: 'Marketplace',
        to: '/shop',
        desc: 'Curated products, services, and NFTs.',
        icon: <FaStore />,
      },
      {
        title: 'News',
        to: '/apps/news',
        desc: 'Editorial live news feed.',
        icon: <FaNewspaper />,
      },
      {
        title: 'Markets',
        to: '/apps/markets',
        desc: 'Real-time telemetry and metrics.',
        icon: <FaGlobeAmericas />,
      },
    ],
  },
  {
    title: 'System',
    eyebrow: 'Platform and admin',
    items: [
      {
        title: 'Games',
        to: '/games',
        desc: 'Competitive arcade minigames.',
        icon: <FaGamepad />,
      },
      {
        title: 'Settings',
        to: '/settings',
        desc: 'Cryptographic security & preferences.',
        icon: <FaCogs />,
      },
      {
        title: 'Admin Dashboard',
        to: '/admin/dashboard',
        desc: 'Platform governance center.',
        icon: <FaShieldAlt />,
      },
      {
        title: 'Command Center',
        to: '/command-center',
        desc: 'Unified application architecture.',
        icon: <FaArrowRight />,
      },
    ],
  },
];

export default function FeatureHub() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 pb-24">
      <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-[#070B14]/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-[#171A26]/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] backdrop-blur">
            Socialo Command Center
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#F7F7FC] font-display">
            Every feature, one master surface<span className="text-[#00F2FE]">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#CBD5E1]">
            The complete product matrix: discovery, creation, conversation, economy, and system infrastructure, crafted for immediate access.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {groups.map((group) => (
          <section
            key={group.title}
            className="overflow-hidden rounded-[30px] border border-white/10 bg-[#070B14]/90 p-5 md:p-6 shadow-xl backdrop-blur-xl"
          >
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                  {group.eyebrow}
                </div>
                <h2 className="mt-1 text-2xl font-black text-[#F7F7FC] font-display">
                  {group.title}
                </h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {group.items.map((item) => {
                const card = (
                  <div className="group h-full rounded-[24px] border border-white/10 bg-[#171A26]/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_12px_30px_rgba(29,78,216,0.18)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#070B14] border border-white/10 text-[#00F2FE] group-hover:text-white group-hover:border-[#00F2FE]/40 transition-colors">
                        {item.icon}
                      </div>
                      <FaArrowRight className="text-[#A5A9BB] opacity-0 transition-opacity group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-base font-bold text-[#F7F7FC]">{item.title}</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#CBD5E1]">{item.desc}</p>
                  </div>
                );

                return item.action ? (
                  <button
                    key={item.title}
                    onClick={() => window.dispatchEvent(new CustomEvent('openCreatePost'))}
                    className="text-left w-full"
                  >
                    {card}
                  </button>
                ) : (
                  <Link key={item.title} to={item.to} className="text-left block h-full">
                    {card}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
