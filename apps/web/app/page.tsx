'use client';

import Link from 'next/link';
import { useLanguage } from './context/LanguageContext';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { t, lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col justify-center items-center px-6">
      
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-teal-500 blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Top Navigation */}
      <nav className="absolute top-0 w-full flex justify-between items-center px-6 py-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold text-lg">W</div>
          <span className="text-xl font-bold tracking-tight">Walawe</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
            className="text-xs font-medium text-neutral-400 hover:text-white transition-colors border border-neutral-800 px-3 py-1.5 rounded-full backdrop-blur-md"
          >
            {lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}
          </button>
          <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
            {t.login}
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className={`relative z-10 max-w-4xl text-center space-y-8 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
          {t.heroTitle.split(' ').map((word, i) => (
            <span key={i} className={word === 'AI' || word === 'Agent.' || word === 'Agents.' ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300' : ''}>
              {word}{' '}
            </span>
          ))}
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
          {t.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link 
            href="/register" 
            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            {t.getStarted}
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-4 bg-transparent border border-neutral-700 text-white font-bold rounded-full hover:bg-neutral-900 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {t.login}
          </Link>
        </div>
      </div>

      {/* Footer note */}
      <div className="absolute bottom-6 text-xs text-neutral-600 z-10">
        Built for the Autonomous Future.
      </div>
    </div>
  );
}
