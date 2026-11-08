// frontend/src/components/layouts/RightSidebar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IoFlame, IoCalendarOutline, IoPeopleOutline, IoArrowForward, IoCheckmark } from 'react-icons/io5';
import SocialAiWidget from '../home/SocialAiWidget';
import CreateWithAiCard from '../home/CreateWithAiCard';
import { useTheme } from '../../contexts/ThemeProvider';
import { useToast } from '../ui/ToastProvider';

export default function RightSidebar() {
  const { currentTheme } = useTheme();
  const { add: addToast } = useToast();

  const [joinedEvent, setJoinedEvent] = useState(false);
  const [followingMap, setFollowingMap] = useState({});

  const toggleFollow = (userId) => {
    setFollowingMap((prev) => {
      const next = !prev[userId];
      addToast(next ? 'Followed user' : 'Unfollowed user', { type: 'info' });
      return { ...prev, [userId]: next };
    });
  };

  const trendingTopics = [
    {
      tag: '#IndiaTechSummit',
      count: '142K posts',
      img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80',
    },
    {
      tag: '#MumbaiRains',
      count: '98K posts',
      img: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=300&q=80',
    },
    {
      tag: '#AIRevolution',
      count: '276K posts',
      img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const suggestedUsers = [
    {
      id: 'sugg_aarav',
      name: 'Aarav Deshmukh',
      mutuals: '12 mutual friends',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'sugg_riya_sharma',
      name: 'Riya Sharma',
      mutuals: '8 mutual friends',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
  ];

  return (
    <aside className="flex flex-col gap-5 w-full max-w-[340px] pb-10">
      {/* 1. Integrated Social AI Widget */}
      <SocialAiWidget />

      {/* 2. Trending Now Widget (Matching Image 1 & 2) */}
      <div
        className="rounded-[26px] border border-[rgba(255,255,255,0.14)] bg-[#070B14]/85 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        style={{
          boxShadow: `0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px ${currentTheme.glow}`,
          borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.14)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
            <IoFlame className="text-[#F59E0B] text-base" />
            <span>Trending Now</span>
          </h3>
          <Link
            to="/explore"
            className="text-[11px] font-bold text-[#CBD5E1]/70 hover:text-white transition"
          >
            See All
          </Link>
        </div>

        <div className="space-y-3">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.tag}
              to={`/tags/${encodeURIComponent(topic.tag.replace('#', ''))}`}
              className="flex items-center justify-between gap-3 group/item rounded-xl p-1.5 transition-all hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={topic.img}
                  alt={topic.tag}
                  className="h-10 w-12 rounded-xl object-cover border border-white/10 group-hover/item:border-white/30 transition shrink-0"
                />
                <div className="min-w-0 leading-tight">
                  <span className="font-display font-semibold text-xs text-white group-hover/item:text-[#38BDF8] transition block truncate">
                    {topic.tag}
                  </span>
                  <span className="text-[10px] text-[#CBD5E1]/60 font-mono block mt-0.5">
                    {topic.count}
                  </span>
                </div>
              </div>

              {/* Green Growth Trend Arrow */}
              <span className="text-sm font-bold text-[#10B981] group-hover/item:scale-125 transition-transform shrink-0">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Upcoming Events Widget (Matching Image 1) */}
      <div
        className="rounded-[26px] border border-[rgba(255,255,255,0.14)] bg-[#070B14]/85 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        style={{
          boxShadow: `0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px ${currentTheme.glow}`,
          borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.14)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
            <IoCalendarOutline className="text-[#38BDF8] text-base" />
            <span>Upcoming Events</span>
          </h3>
          <Link
            to="/events"
            className="text-[11px] font-bold text-[#CBD5E1]/70 hover:text-white transition"
          >
            See All
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
          <img
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80"
            alt="Tech & Creator Meetup"
            className="h-24 w-full object-cover"
          />
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white truncate">Tech &amp; Creator Meetup</div>
              <div className="text-[10px] text-[#CBD5E1]/70 mt-0.5">15 Nov, 2026 • Mumbai</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setJoinedEvent(!joinedEvent);
                addToast(joinedEvent ? 'Left event' : 'Joined event RSVP!', { type: 'success' });
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              style={{
                background: joinedEvent
                  ? 'rgba(255, 255, 255, 0.15)'
                  : `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                boxShadow: joinedEvent ? 'none' : `0 0 15px ${currentTheme.glow}`,
              }}
            >
              {joinedEvent ? (
                <span className="flex items-center gap-1 text-[#10B981]">
                  <IoCheckmark /> Joined
                </span>
              ) : (
                'Join'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. People You May Know / Suggested for You (Matching Images 1 & 2) */}
      <div
        className="rounded-[26px] border border-[rgba(255,255,255,0.14)] bg-[#070B14]/85 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        style={{
          boxShadow: `0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px ${currentTheme.glow}`,
          borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.14)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
            <IoPeopleOutline className="text-[#A78BFA] text-base" />
            <span>People You May Know</span>
          </h3>
          <Link
            to="/discovery/follow-suggestions"
            className="text-[11px] font-bold text-[#CBD5E1]/70 hover:text-white transition"
          >
            See All
          </Link>
        </div>

        <div className="space-y-3">
          {suggestedUsers.map((su) => {
            const isFollowed = followingMap[su.id];
            return (
              <div key={su.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={su.avatar}
                    alt={su.name}
                    className="h-10 w-10 rounded-full object-cover border border-white/20 shrink-0"
                  />
                  <div className="min-w-0 leading-tight">
                    <span className="font-display font-semibold text-xs text-white block truncate">
                      {su.name}
                    </span>
                    <span className="text-[10px] text-[#CBD5E1]/60 font-mono block truncate">
                      {su.mutuals}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFollow(su.id)}
                  className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  style={{
                    background: isFollowed
                      ? 'rgba(255, 255, 255, 0.1)'
                      : `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                    boxShadow: isFollowed ? 'none' : `0 0 12px ${currentTheme.glow}`,
                  }}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Create with AI Futuristic 3D Promo Card (Matching Image 2) */}
      <CreateWithAiCard />

      {/* Footer */}
      <div className="text-[11px] text-center text-[#CBD5E1]/60 space-y-1">
        <p className="font-medium tracking-wide">SocialVerse ∞ &bull; Beyond Social &bull; 2026</p>
        <p className="opacity-70">&copy; {new Date().getFullYear()} SocialVerse Inc. All rights reserved.</p>
      </div>
    </aside>
  );
}
