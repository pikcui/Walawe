'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const Icons = {
  Shield: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>),
  Key: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>),
  Wallet: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>),
  Activity: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>),
  ArrowRight: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>),
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col font-sans selection:bg-white selection:text-black overflow-x-hidden">
      
      {/* VIDEO BACKGROUND (BIRD - MONOCHROME) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover grayscale"
        >
          {/* Video stok burung terbang dari CDN publik (Coverr/Pexels) */}
          <source src="https://cdn.coverr.co/videos/coverr-a-bird-flying-in-the-sky-1572/1080p.mp4" type="video/mp4" />
        </video>
        {/* Overlay gradien agar teks tetap terbaca */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black"></div>
      </div>

      {/* NAVBAR */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2L2 7l7 12 3-6 3 6 7-12-10-5zm0 3.5l5.5 2.5-3.5 6-2-4-2 4-3.5-6 5.5-2.5z"/></svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Walawe</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-neutral-200 active:scale-95 transition-all">
            Start Building
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto mt-20 md:mt-32">
        <div className={`space-y-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-xs font-medium text-neutral-300 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            v4 Alpha is live on Base Sepolia
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400">
            The Financial Layer for Autonomous AI.
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Equip your AI agents with a secure wallet. Set strict spending limits. Let them pay for APIs and models independently using their own keys (BYOK).
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/register" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 active:scale-95 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Create Free Account <Icons.ArrowRight />
            </Link>
            <a href="https://github.com/pikcui/Walawe.git" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-800 active:scale-95 transition-all duration-200">
              View on GitHub
            </a>
          </div>
        </div>

        {/* FEATURES GRID (BENTO STYLE) */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          <div className="bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl text-left hover:border-neutral-600 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800 text-white">
              <Icons.Shield />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Deterministic Policy Engine</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">Set daily limits and allowed models. The engine strictly enforces rules to prevent runaway spending.</p>
          </div>
          
          <div className="bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl text-left hover:border-neutral-600 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800 text-white">
              <Icons.Key />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Bring Your Own Key (BYOK)</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">Agents use your OpenAI, Anthropic, or Gemini API keys. Walawe solely handles the secure payment flow.</p>
          </div>

          <div className="bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl text-left hover:border-neutral-600 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800 text-white">
              <Icons.Wallet />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">On-Chain Deposits</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">Top up your agent's wallet using USDC on Base Sepolia via WalletConnect. Web3 native.</p>
          </div>

          <div className="bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl text-left hover:border-neutral-600 transition-colors md:col-span-2">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800 text-white">
              <Icons.Activity />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Immutable Double-Entry Ledger</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">Every transaction is recorded immutably. Balances are derived, never directly modified, ensuring complete financial auditability and precision.</p>
          </div>

          <div className="bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl text-left hover:border-neutral-600 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800 text-white">
              <Icons.Activity />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Agent Playground</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">Test your agent's live responses directly from the dashboard using your BYOK setup.</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full text-center py-12 mt-20 border-t border-neutral-900/50 backdrop-blur-sm">
        <p className="text-sm text-neutral-500 font-medium">© 2026 Walawe. Built by <strong className="text-white">Galang</strong>.</p>
        <p className="text-xs text-neutral-600 mt-2">Open Source under Apache 2.0 License.</p>
      </footer>
    </div>
  );
}
