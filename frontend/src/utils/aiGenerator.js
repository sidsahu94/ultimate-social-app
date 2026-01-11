// frontend/src/utils/aiGenerator.js
// Simulates an OpenAI call. Replace with real fetch to your backend if you have an API Key.
export const generateCaption = async (keywords) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const vibes = [
        "Just living my best life! ✨ #vibes",
        "Caught in 4K 📸 #memories",
        "POV: You're seeing this on your timeline 🌟",
        "Can we skip to the good part? 🎶 #trending",
        "Not me posting this at 2AM 🌚 #insomnia"
      ];
      resolve(vibes[Math.floor(Math.random() * vibes.length)]);
    }, 1500);
  });
};