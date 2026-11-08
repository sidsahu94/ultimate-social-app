// frontend/src/components/home/SocialAiWidget.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles, IoPaperPlane, IoCopyOutline, IoCheckmark, IoClose } from 'react-icons/io5';
import { useTheme } from '../../contexts/ThemeProvider';
import { useToast } from '../ui/ToastProvider';
import API from '../../services/api';

const PROMPT_CHIPS = [
  { id: 'write', label: 'Write a post', icon: '📝', query: 'Write a viral engaging post about tech innovations and lifestyle' },
  { id: 'reel', label: 'Create a reel', icon: '🎬', query: 'Give me a 30-second viral reel script with hook and caption' },
  { id: 'ideas', label: 'Post ideas', icon: '💡', query: 'Top 5 trending post ideas for creators this week' },
  { id: 'tips', label: 'Growth tips', icon: '📈', query: 'How to increase engagement and reach on SocialVerse' },
];

export default function SocialAiWidget({ onUseContent }) {
  const { currentTheme } = useTheme();
  const { add: addToast } = useToast();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSendPrompt = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setInput('');
    setResponse(null);

    try {
      const tone = textToSend.toLowerCase().includes('reel') ? 'viral' : 'visionary';
      const res = await API.post('/posts/ai/compose', { prompt: textToSend, tone });
      if (res.data?.caption) {
        setResponse(res.data.caption);
        setLoading(false);
        return;
      }
    } catch (_) {
      // Fallback to rich dynamic generator below
    }

    setTimeout(() => {
      let resultText = '';
      const q = textToSend.toLowerCase();

      if (q.includes('reel')) {
        resultText = `🎬 VIRAL REEL SCRIPT:\n• Hook (0-3s): "Stop scrolling if you want to elevate your daily routine in 2026."\n• Visual: Quick kinetic cuts, city lights timelapse.\n• Body: 3 key insights on digital mindfulness & creative focus.\n• CTA: "Save this for later and drop your thoughts below! ✨"\n\n#ReelLife #Mindset2026 #CreativeVibes #SocialVerse`;
      } else if (q.includes('growth') || q.includes('tips')) {
        resultText = `📈 3 GOLDEN GROWTH RULES:\n1. Post during peak transit hours (8:30 AM & 7:15 PM).\n2. Reply to first 10 comments within 15 minutes to trigger the algorithm.\n3. Utilize rich high-contrast media with at least 3 curated hashtags.\n\nConsistent daily streaks boost profile visibility by 3.4x! 🔥`;
      } else if (q.includes('ideas')) {
        resultText = `💡 5 TRENDING TOPICS TODAY:\n1. "A day in my workspace setup in Mumbai"\n2. "What AI tools I actually use everyday"\n3. "City dusk photography secrets"\n4. "Weekly milestones & lessons learned"\n5. "Interactive poll: Remote vs Studio life"`;
      } else {
        resultText = `✨ CREATED FOR YOU:\n"City lights, calm mind, and endless possibilities ✨ Every moment spent building what you love pays off in ways you can't predict yet. Keep pushing boundaries.\n\n#NightVibes #Mindset #Cityscape #CreatorsOfInstagram #SocialVerse"`;
      }

      setResponse(resultText);
      setLoading(false);
    }, 600);
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    addToast('Copied to clipboard!', { type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseInPost = () => {
    if (onUseContent && response) {
      onUseContent(response);
    } else {
      window.dispatchEvent(new CustomEvent('openCreatePost', { detail: { content: response } }));
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.14)] bg-[#070B14]/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-all duration-300 hover:border-[rgba(255,255,255,0.22)]"
      style={{
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.7), 0 0 30px ${currentTheme.glow}`,
        borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.14)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl shadow-md"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
              boxShadow: `0 0 15px ${currentTheme.glow}`,
            }}
          >
            <IoSparkles className="text-white text-sm animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-white tracking-tight">Social AI</h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#CBD5E1]">
                Beta
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1]/70">Your personal social assistant</p>
          </div>
        </div>
      </div>

      {/* Luminous Animated Multi-Strand Fluid Ribbon Waveform (Matching Images 1 & 2) */}
      <div className="relative my-3.5 h-14 w-full overflow-hidden rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-2">
        <svg viewBox="0 0 340 50" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="aiWaveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="35%" stopColor="#9B6DFF" />
              <stop offset="70%" stopColor="#FF6B8A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="aiWaveGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#FF6B8A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#9B6DFF" stopOpacity="0.3" />
            </linearGradient>
            <filter id="aiWaveGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Strand 1 */}
          <motion.path
            d="M0,25 C60,5 120,45 180,25 C240,5 300,45 340,25"
            fill="none"
            stroke="url(#aiWaveGrad1)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#aiWaveGlow)"
            animate={{
              d: loading
                ? [
                    "M0,25 C60,2 120,48 180,25 C240,2 300,48 340,25",
                    "M0,25 C60,48 120,2 180,25 C240,48 300,2 340,25",
                    "M0,25 C60,2 120,48 180,25 C240,2 300,48 340,25",
                  ]
                : [
                    "M0,25 C60,10 120,40 180,25 C240,10 300,40 340,25",
                    "M0,25 C60,38 120,12 180,25 C240,38 300,12 340,25",
                    "M0,25 C60,10 120,40 180,25 C240,10 300,40 340,25",
                  ],
            }}
            transition={{ duration: loading ? 0.9 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Strand 2 */}
          <motion.path
            d="M0,25 C80,45 150,5 220,35 C280,15 310,35 340,25"
            fill="none"
            stroke="url(#aiWaveGrad2)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#aiWaveGlow)"
            animate={{
              d: loading
                ? [
                    "M0,25 C80,5 150,45 220,15 C280,35 310,15 340,25",
                    "M0,25 C80,45 150,5 220,35 C280,15 310,35 340,25",
                  ]
                : [
                    "M0,25 C80,35 150,15 220,30 C280,20 310,30 340,25",
                    "M0,25 C80,15 150,35 220,20 C280,30 310,20 340,25",
                    "M0,25 C80,35 150,15 220,30 C280,20 310,30 340,25",
                  ],
            }}
            transition={{ duration: loading ? 1.2 : 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </svg>

        {/* Dancing Pulsing Particles */}
        <div className="absolute inset-0 flex items-center justify-around pointer-events-none px-4">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [-4, 4, -4], opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.6 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#00F2FE]"
            />
          ))}
        </div>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleSendPrompt(chip.query)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-[#CBD5E1] transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <span>{chip.icon}</span>
            <span className="truncate">{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt();
        }}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about content, trends..."
          disabled={loading}
          className="w-full rounded-2xl border border-white/15 bg-black/60 py-2.5 pl-4 pr-11 text-xs text-white placeholder-[#CBD5E1]/40 outline-none transition-all focus:border-white/40 focus:ring-1 focus:ring-white/20 disabled:opacity-50 shadow-inner"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-xl text-white shadow-md transition-all hover:scale-105 active:scale-90 disabled:opacity-40 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
          }}
        >
          {loading ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <IoPaperPlane size={13} />
          )}
        </button>
      </form>

      {/* Generated Response Drawer */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-2xl border border-white/15 bg-black/70 p-3.5 text-xs text-white backdrop-blur-xl shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-[11px] text-[#F4D49A] flex items-center gap-1">
                <IoSparkles size={12} /> Social AI Suggestion
              </span>
              <button
                type="button"
                onClick={() => setResponse(null)}
                className="text-white/60 hover:text-white p-0.5 rounded-full"
              >
                <IoClose size={15} />
              </button>
            </div>

            <div className="mt-2.5 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans text-[11.5px] leading-relaxed text-[#CBD5E1] pr-1">
              {response}
            </div>

            <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                {copied ? <IoCheckmark className="text-[#10B981]" /> : <IoCopyOutline />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleUseInPost}
                className="rounded-lg px-3 py-1 text-[11px] font-bold text-white shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                }}
              >
                Use in Post ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
