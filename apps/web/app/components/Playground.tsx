'use client';

import { useState, useRef, useEffect } from 'react';

const Icons = {
  Send: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Settings: () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>),
  Eye: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>),
  EyeOff: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>),
  X: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>)
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'groq';

export default function Playground() {
  const [showSettings, setShowSettings] = useState(false);
  const [walaweApiKey, setWalaweApiKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pg_walawe_key') || '' : '');
  const [provider, setProvider] = useState<ProviderType>('gemini');
  const [providerKey, setProviderKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pg_provider_key') || '' : '');
  const [model, setModel] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pg_model') || 'gemini-3.5-flash-lite' : 'gemini-3.5-flash-lite');
  const [messages, setMessages] = useState<{ role: string; content: string; isError?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWalaweKey, setShowWalaweKey] = useState(false);
  const [showProviderKey, setShowProviderKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('pg_walawe_key', walaweApiKey); }, [walaweApiKey]);
  useEffect(() => { localStorage.setItem('pg_provider_key', providerKey); }, [providerKey]);
  useEffect(() => { localStorage.setItem('pg_model', model); }, [model]);

  const handleProviderChange = (newProvider: ProviderType) => {
    setProvider(newProvider);
    if (newProvider === 'openai') setModel('gpt-4o-mini');
    if (newProvider === 'anthropic') setModel('claude-3-haiku-20240307');
    if (newProvider === 'gemini') setModel('gemini-3.5-flash-lite');
    if (newProvider === 'groq') setModel('llama3-8b-8192');
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWalaweKey = walaweApiKey.trim();
    const cleanProviderKey = providerKey.trim();

    if (!input.trim() || !cleanProviderKey || !cleanWalaweKey) {
      setError('API Key Walawe dan Provider Key wajib diisi. (Buka menu Settings)');
      setShowSettings(true);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanWalaweKey}`, 'X-Provider-Key': cleanProviderKey, 'X-Provider-Name': provider },
        body: JSON.stringify({ model: model.trim(), messages: [{ role: 'user', content: userMsg }], max_tokens: 100 }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Failed to connect to agent');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      let hasError = false;

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  hasError = true;
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = `Error: ${parsed.error}`;
                    newMsgs[newMsgs.length - 1].isError = true;
                    return newMsgs;
                  });
                }
                if (parsed.text) {
                  assistantMsg += parsed.text;
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = assistantMsg;
                    return newMsgs;
                  });
                }
              } catch (e) {}
            }
          }
        }
      }
      if (assistantMsg === '' && !hasError) {
        setMessages((prev) => prev.slice(0, -1));
        setError("AI tidak mengembalikan jawaban.");
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-black">
      
      {/* Header Settings */}
      <div className="flex justify-between items-center py-4 px-4 md:px-6 border-b border-neutral-900 bg-black/80 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Agent Playground</h1>
          <p className="text-neutral-500 text-[11px] md:text-xs mt-0.5">Test your BYOK agent with live ledger tracking.</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-neutral-800">
          <Icons.Settings /> <span className="hidden md:inline">Settings</span>
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-scale-in">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><Icons.X /></button>
            <h2 className="text-lg font-bold text-white mb-6">Playground Configuration</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Walawe API Key</label>
                <div className="relative">
                  <input type="text" autoComplete="off" value={walaweApiKey} onChange={e => setWalaweApiKey(e.target.value)} placeholder="wlw_..." className={`w-full bg-black border border-neutral-800 rounded-lg pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600 ${!showWalaweKey ? '[-webkit-text-security:disc]' : ''}`} />
                  <button type="button" onClick={() => setShowWalaweKey(!showWalaweKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">{showWalaweKey ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                </div>
              </div>
              <div className="flex gap-2 bg-black p-1 rounded-lg border border-neutral-800">
                {(['gemini', 'groq', 'openai', 'anthropic'] as ProviderType[]).map(p => (
                  <button key={p} onClick={() => handleProviderChange(p)} className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${provider === p ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>{p}</button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{provider} Provider Key (BYOK)</label>
                <div className="relative">
                  <input type="text" autoComplete="off" value={providerKey} onChange={e => setProviderKey(e.target.value)} placeholder="API Key..." className={`w-full bg-black border border-neutral-800 rounded-lg pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600 ${!showProviderKey ? '[-webkit-text-security:disc]' : ''}`} />
                  <button type="button" onClick={() => setShowProviderKey(!showProviderKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">{showProviderKey ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Model Name</label>
                <input type="text" value={model} onChange={e => setModel(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600" />
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-neutral-200 transition-colors mt-2">Save & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area (Only this scrolls) */}
      <div className="flex-grow overflow-y-auto px-4 md:px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-900/50 flex items-center justify-center border border-neutral-800/50"><Icons.Send /></div>
            <p className="text-sm">How can I help you today?</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-white text-black' : msg.isError ? 'bg-red-950/50 text-red-400 border border-red-900/50' : 'bg-neutral-900/80 text-neutral-200 border border-neutral-800/50'}`}>{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-5 py-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/50 flex gap-1.5 items-center h-[46px]">
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse"></span>
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:px-6 bg-black shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg focus-within:border-neutral-600 transition-colors">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Message Agent..." disabled={isLoading} className="w-full bg-transparent px-5 py-4 text-white text-[15px] focus:outline-none placeholder:text-neutral-600" />
          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 p-2 bg-white text-black rounded-xl hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"><Icons.Send /></button>
        </form>
        {error && <p className="text-red-500 text-[11px] text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}
