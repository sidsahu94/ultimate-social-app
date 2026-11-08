// frontend/src/utils/aiGenerator.js
import API from '../services/api';

export const AI_TONES = [
  { id: 'obsidian', label: 'Obsidian Minimal', icon: '🕶️', badge: '#0B0B0F' },
  { id: 'champagne', label: 'Editorial Luxury', icon: '🍸', badge: '#D6B779' },
  { id: 'viral', label: 'Viral Creator', icon: '⚡', badge: '#48D6C0' },
  { id: 'visionary', label: 'Tech Visionary', icon: '🔭', badge: '#D88DA3' },
];

const LOCAL_FALLBACKS = {
  obsidian: [
    "Curating silence in a world full of noise. Details speak for themselves. #Obsidian #Socialo #Minimalism",
    "Shadows reveal what light obscures. Late night creation in progress. #Cinematic #DarkLuxury #Socialo",
    "Every detail intentional. Moments redefined. #ObsidianLife #SocialoMoments #Aesthetic",
  ],
  champagne: [
    "A golden afternoon framed by timeless elegance. Here’s to the moments that elevate us. #ChampagneHours #Socialo #Editorial",
    "Soft sunlight, cream linen, and quiet focus. Life is best savored slowly. #Timeless #SocialoLuxury #ArtOfLiving",
    "The subtleties that turn an ordinary moment into art. #EditorialVibes #Socialo #GoldenHour",
  ],
  viral: [
    "Stop scrolling. We need to talk about this right now! Drop your thoughts below! 🔥🚀 #Viral #Socialo #TrendingNow",
    "POV: You finally unlocked the blueprint and everything clicked. Who else relates? 💯✨ #CreatorLife #Socialo #Explore",
    "Don’t sleep on this. Changing the entire game today. Tag a friend who needs to see this! ⚡ #GameChanger #Socialo",
  ],
  visionary: [
    "Building at the intersection of intuition and intelligence. This is just the beginning. #FutureForward #BuildInPublic #Socialo",
    "The future belongs to creators who craft with intention and courage. #NextGen #TechVision #Socialo",
    "Redefining digital connection through architecture and aesthetics. Let’s build what’s next. #Visionary #SocialoNetwork #Innovation",
  ],
};

/**
 * Generates an elite AI caption using backend AI or high-tech local engine.
 * @param {string} prompt User's topic or partial draft
 * @param {string} tone Chosen style tone
 * @returns {Promise<string>}
 */
export const generateCaption = async (prompt = '', tone = 'obsidian') => {
  try {
    const res = await API.post('/posts/ai/compose', { prompt, tone });
    if (res.data?.caption) {
      return res.data.caption;
    }
  } catch (err) {
    console.warn('[AI Studio] Backend composition returned error, using local engine:', err?.message);
  }

  // Graceful client fallback
  const pool = LOCAL_FALLBACKS[tone] || LOCAL_FALLBACKS.obsidian;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return prompt ? `${picked} (${prompt})` : picked;
};

/**
 * Generates 4 smart hashtags tailored to a topic.
 * @param {string} topic 
 * @returns {string[]}
 */
export const generateSmartTags = (topic = '') => {
  const base = ['Socialo', 'CreatorEconomy', 'LuxuryMoments'];
  if (!topic) return base;
  const words = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const custom = words.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return Array.from(new Set([...custom, ...base]));
};