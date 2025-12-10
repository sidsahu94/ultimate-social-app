// frontend/src/pages/misc/FeatureHub.jsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Feature Hub — single page that lists ALL features (old + new)
 * Click any card to go directly to that part of the app.
 * This gives you discoverability for 1000+ features later (grouping + quick links).
 */

const groups = [
  {
    title: 'Core feed & posting',
    items: [
      { title: 'Home feed', to: '/' },
      { title: 'Create post (modal)', to: '/', action: 'openCreate' },
      { title: 'Scheduled posts', to: '/scheduled-posts' },
      { title: 'Saved / Bookmarks', to: '/saved' },
    ],
  },
  {
    title: 'Discovery & social',
    items: [
      { title: 'Explore / Search', to: '/explore' },
      { title: 'Follow suggestions', to: '/discovery/follow-suggestions' },
      { title: 'Trending & hashtags', to: '/explore' },
      { title: 'Recommendations engine (demo)', to: '/explore' },
    ],
  },
  {
    title: 'Chat & realtime',
    items: [
      { title: '1:1 chat', to: '/chat' },
      { title: 'Group chats', to: '/chat' },
      { title: 'Typing indicators', to: '/chat' },
      { title: 'Attachments & link preview', to: '/chat' },
    ],
  },
  {
    title: 'Stories, Reels & Live',
    items: [
      { title: 'Create / View Stories', to: '/stories' },
      { title: 'Reels / Shorts feed', to: '/reels' },
      { title: 'Live streams & overlay', to: '/live' },
    ],
  },
  {
    title: 'Commerce & creators',
    items: [
      { title: 'Shop', to: '/shop' },
      { title: 'Creator payouts (admin)', to: '/admin/payouts' },
      { title: 'Coins & tipping', to: '/wallet' },
    ],
  },
  {
    title: 'Moderation & safety',
    items: [
      { title: 'Report content', to: '/report' },
      { title: 'Moderation dashboard', to: '/admin/moderation' },
      { title: 'Banned words filter', to: '/admin/moderation' },
    ],
  },
];

export default function FeatureHub() {
  const doAction = (a) => {
    if (a === 'openCreate') window.dispatchEvent(new CustomEvent('openCreatePost'));
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Feature hub — all features (old + new)</h1>

      <p className="text-sm text-gray-600 mb-6">
        This hub lists every major capability. Click a card to go there. If a feature is not yet wired in your backend you may see a friendly error — I'll help wire endpoints next.
      </p>

      <div className="grid gap-6">
        {groups.map(g => (
          <div key={g.title} className="card p-4">
            <h3 className="font-semibold mb-3">{g.title}</h3>
            <div className="grid md:grid-cols-4 gap-3">
              {g.items.map(i => (
                <div key={i.title} className="p-3 border rounded flex flex-col justify-between">
                  <div>
                    <div className="font-medium">{i.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{i.to}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {i.to ? <Link to={i.to} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Open</Link> : null}
                    {i.action ? <button onClick={()=>doAction(i.action)} className="px-3 py-1 rounded border text-sm">Run</button> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        Tip: Use the "Features" menu in the nav for quick access. Want a printable checklist for QA of every feature? Type: <b>export checklist</b>.
      </div>
    </div>
  );
}
