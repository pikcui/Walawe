'use client';

import Link from 'next/link';
import { useLanguage } from './context/LanguageContext';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { t, lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col font-sans selection:bg-white selection:text-black">
      
      {/* Background Grid Pattern (Bebas AI Slop) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M2 4 L9 18 L12 12 L15 18 L22 4 L18 4 L14 13 L12 9 L10 13 L6 4 Z" /></svg></div>
          <span className="text-xl font-bold tracking-tight">Walawe</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
            className="text-xs font-medium text-neutral-400 hover:text-white transition-colors border border-neutral-800 px-3 py-1.5 rounded-md"
          >
            {lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}
          </button>
          <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors active:scale-95">
            {t.login}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto mt-20 md:mt-32">
        <div className={`space-y-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            v4 Alpha is live on Base Sepolia
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight max-w-3xl">
            {t.heroTitle}
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 active:scale-95 transition-all duration-200"
            >
              {t.getStarted}
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-800 active:scale-95 transition-all duration-200"
            >
              {t.login}
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-24 w-full transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl text-left">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <h3 className="font-semibold text-white mb-2">{t.feature1Title}</h3>
            <p className="text-sm text-neutral-500">{t.feature1Desc}</p>
          </div>
          
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl text-left">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            </div>
            <h3 className="font-semibold text-white mb-2">{t.feature2Title}</h3>
            <p className="text-sm text-neutral-500">{t.feature2Desc}</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl text-left">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            </div>
            <h3 className="font-semibold text-white mb-2">{t.feature3Title}</h3>
            <p className="text-sm text-neutral-500">{t.feature3Desc}</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full text-center py-8 text-xs text-neutral-600">
        © 2026 Walawe. Built for the Autonomous Future.
      </footer>
    </div>
  );
}
