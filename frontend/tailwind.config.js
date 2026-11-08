/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables class-based dark mode toggling
  theme: {
    extend: {
      colors: {
        // ======================================================================
        // AETHERIA IMPERIAL NOIR MASTERPIECE THEME
        // Tri-Theme Fusion:
        // 1. Quiet Royal Black (Velvet obsidian voids, zero glare)
        // 2. High-Contrast Electric Ocean / Deep Navy & Electric Blue
        // 3. Modern Dark Emerald & Royal Liquid Gold
        // ======================================================================
        aetheria: {
          void: '#04070D',
          abyss: '#070B14',
          surface: '#0A111E',
          elevated: '#0F1A2C',
          border: 'rgba(0, 242, 254, 0.16)',
          borderGold: 'rgba(212, 175, 55, 0.22)',
          
          electricCyan: '#00F2FE',
          electricOcean: '#38BDF8',
          royalCobalt: '#1D4ED8',
          electricBlue: '#2563EB',
          deepNavy: '#070F1E',

          darkEmerald: '#052E24',
          emeraldJade: '#064E3B',
          vividEmerald: '#10B981',
          emeraldGlow: 'rgba(16, 185, 129, 0.45)',

          royalGold: '#D4AF37',
          liquidGold: '#F59E0B',
          champagneGold: '#F4D49A',
          goldGlow: 'rgba(212, 175, 55, 0.45)',

          crispWhite: '#F8FAFC',
          silverMuted: '#CBD5E1',
        },
        // Backward compatibility mappings seamlessly updated to the tri-theme aesthetic
        masterpiece: {
          darkRed: '#064E3B', // Modern dark emerald
          darkRedLight: '#10B981', // Vivid emerald
          darkRedGlow: 'rgba(16, 185, 129, 0.55)',
          
          silverGlass: 'rgba(10, 17, 30, 0.82)',
          silverBorder: 'rgba(0, 242, 254, 0.18)',
          silverHighlight: 'rgba(255, 255, 255, 0.28)',

          roseGold: '#D4AF37', // Royal Gold
          roseGoldLight: '#F4D49A', // Champagne Gold
          roseGoldDark: '#B8860B',
          roseGoldGlow: 'rgba(212, 175, 55, 0.4)',

          sandBeige: '#F4D49A',
          sandBeigeLight: '#FEF3C7',
          sandBeigeMuted: '#CBD5E1',

          sapphireElite: '#1D4ED8',
          sapphireLight: '#38BDF8',
          sapphireDark: '#070F1E',
          sapphireGlow: 'rgba(0, 242, 254, 0.45)',

          deepTeal: '#052E24', // Imperial Dark Emerald
          deepTealLight: '#10B981',
          deepTealDark: '#031F18',
          deepTealGlow: 'rgba(16, 185, 129, 0.4)',

          cherryNoir: '#04070D', // Quiet Royal Black void
          cherryNoirSurface: '#0A111E', // Oceanic obsidian surface
          cherryNoirElevated: '#0F1A2C', // Elevated deep navy
          cherryNoirBorder: 'rgba(0, 242, 254, 0.16)',

          oceanMist: '#00F2FE', // Electric Ocean Cyan
          oceanMistLight: '#38BDF8',
          oceanMistSoft: 'rgba(0, 242, 254, 0.2)',
          oceanMistGlow: 'rgba(0, 242, 254, 0.5)',

          softWhite: '#F8FAFC',
        },
        aurora: {
          obsidian: '#04070D',
          midnight: '#070B14',
          graphite: '#0A111E',
          indigo: '#1D4ED8',
          violet: '#064E3B',
          cyan: '#00F2FE',
          coral: '#D4AF37',
          gold: '#F4D49A',
          softWhite: '#F8FAFC',
          mistGrey: '#CBD5E1',
          border: 'rgba(0, 242, 254, 0.18)',
        },
        obsidian: {
          DEFAULT: '#04070D',
          surface: '#0A111E',
          elevated: '#0F1A2C',
          glass: 'rgba(10, 17, 30, 0.85)',
        },
        luxury: {
          gold: '#D4AF37',
          champagne: '#F4D49A',
          rose: '#052E24',
          teal: '#10B981',
          indigo: '#1D4ED8',
          violet: '#00F2FE',
          charcoal: '#0A111E',
          cream: '#FEF3C7',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        editorial: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        card: '24px',
        button: '14px',
        input: '14px',
        premium: '24px',
      },
      boxShadow: {
        card: '0 16px 48px rgba(0, 0, 0, 0.65)',
        silverGlass: '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
        electricCyanGlow: '0 0 30px rgba(0, 242, 254, 0.5)',
        sapphireGlow: '0 0 30px rgba(29, 78, 216, 0.45)',
        oceanMistGlow: '0 0 30px rgba(0, 242, 254, 0.45)',
        emeraldGlow: '0 0 30px rgba(16, 185, 129, 0.45)',
        royalGoldGlow: '0 0 30px rgba(212, 175, 55, 0.45)',
        aetheriaGlow: '0 0 35px rgba(0, 242, 254, 0.35), 0 0 50px rgba(212, 175, 55, 0.25)',
      },
      backgroundImage: {
        'aetheria-signature': 'linear-gradient(135deg, #00F2FE 0%, #1D4ED8 30%, #052E24 65%, #D4AF37 100%)',
        'electric-ocean': 'linear-gradient(135deg, #00F2FE 0%, #1D4ED8 60%, #070F1E 100%)',
        'emerald-gold': 'linear-gradient(135deg, #052E24 0%, #10B981 50%, #D4AF37 100%)',
        'royal-obsidian': 'linear-gradient(135deg, #04070D 0%, #0A111E 50%, #0F1A2C 100%)',
        'masterpiece-signature': 'linear-gradient(135deg, #00F2FE 0%, #1D4ED8 30%, #10B981 65%, #D4AF37 100%)',
        'sapphire-mist': 'linear-gradient(135deg, #00F2FE 0%, #1D4ED8 50%, #38BDF8 100%)',
        'cherry-rose': 'linear-gradient(135deg, #052E24 0%, #10B981 50%, #D4AF37 100%)',
        'silver-sheen': 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(0, 242, 254, 0.08) 50%, rgba(212, 175, 55, 0.15) 100%)',
        'aurora-signature': 'linear-gradient(135deg, #00F2FE 0%, #1D4ED8 30%, #10B981 65%, #D4AF37 100%)',
        'aurora-brand': 'linear-gradient(135deg, #00F2FE 0%, #1D4ED8 100%)',
        'socialo-gradient': 'linear-gradient(135deg, #00F2FE 0%, #1D4ED8 30%, #10B981 65%, #D4AF37 100%)',
      },
      transitionTimingFunction: {
        socialo: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
      },
      transitionDuration: {
        socialo: '240ms',
      }
    },
  },
  plugins: [],
}
