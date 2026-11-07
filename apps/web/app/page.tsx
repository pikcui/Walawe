import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white selection:text-black">
      
      {/* Navbar */}
      <nav className="border-b border-neutral-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-bold text-sm tracking-tighter">
              W
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Walawe</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/pikcui/Walawe" target="_blank" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              GitHub
            </Link>
            <Link href="/login" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors">
              Access Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          v2.0.0-beta is now live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-tight">
          The wallet for <br className="hidden md:block"/> autonomous AI agents.
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Walawe lets AI agents pay for models and APIs on their own, with hard spending limits set by humans. One API key, many models, and a full audit trail.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login" className="w-full sm:w-auto bg-white text-black font-medium px-8 py-3 rounded-lg hover:bg-neutral-200 transition-colors">
            Go to Dashboard
          </Link>
          <Link href="https://github.com/pikcui/Walawe/blob/main/INSTALL.md" target="_blank" className="w-full sm:w-auto bg-neutral-900 text-white border border-neutral-800 font-medium px-8 py-3 rounded-lg hover:bg-neutral-800 transition-colors">
            Read Installation Guide
          </Link>
        </div>
      </main>

      {/* Features Grid */}
      <section className="border-t border-neutral-800 bg-neutral-950 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Per-Agent Budgets</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Set limits per request, per day, and per month. Model and destination allowlists ensure your agents only spend on what you approve.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Anomaly Detection</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Deterministic rules and Redis-backed sliding windows automatically suspend agents that spam requests or burn through cash too quickly.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Human Approvals</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                High-value transactions are held in a pending state until a human administrator explicitly approves them via the dashboard.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 text-center text-sm text-neutral-500">
        <p>Built with ❤️ for the autonomous future. Apache 2.0 License.</p>
      </footer>
    </div>
  );
}
