// frontend/src/pages/intro/Onboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRocket, FaShieldAlt, FaGlobeAmericas, FaArrowRight } from 'react-icons/fa';

const SLIDES = [
  {
    id: 1,
    title: "The Ultimate Social",
    desc: "Experience a futuristic, decentralized, and seamless connection with the world.",
    icon: <FaRocket className="text-6xl text-primary-glow drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]" />,
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: 2,
    title: "Privacy First",
    desc: "Your data is yours. Secure, encrypted, and safe from prying eyes.",
    icon: <FaShieldAlt className="text-6xl text-secondary drop-shadow-[0_0_15px_rgba(126,87,194,0.8)]" />,
    color: "from-purple-500 to-indigo-500"
  },
  {
    id: 3,
    title: "Global Community",
    desc: "Join millions of creators, developers, and thinkers in the next-gen network.",
    icon: <FaGlobeAmericas className="text-6xl text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" />,
    color: "from-emerald-400 to-teal-500"
  }
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1);
    } else {
      localStorage.setItem('hasSeenOnboarding', 'true');
      navigate('/login');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#E0E5EC] dark:bg-[#1A1B1E] overflow-hidden relative">
      
      {/* Background Blobs (Glassmorphism Effect) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />

      <div className="z-10 w-full max-w-md px-6 text-center">
        <AnimatePresence mode='wait'>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="neu-card flex flex-col items-center py-12"
          >
            {/* 3D Icon Container */}
            <div className="mb-8 p-6 rounded-full bg-[#E0E5EC] dark:bg-[#1A1B1E] shadow-neu-flat dark:shadow-neu-dark-flat border border-white/20">
                {SLIDES[index].icon}
            </div>

            <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {SLIDES[index].title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
              {SLIDES[index].desc}
            </p>

            {/* Pagination Dots */}
            <div className="flex gap-3 mb-8">
              {SLIDES.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-3 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-primary shadow-neon-blue' : 'w-3 bg-gray-300 dark:bg-gray-700'}`}
                />
              ))}
            </div>

            <button onClick={handleNext} className="btn-neon w-full flex items-center justify-center gap-2 group">
              {index === SLIDES.length - 1 ? "Get Started" : "Next"} 
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}