'use client';

import { useState, useRef, useEffect } from 'react';

const Icons = {
  Send: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

interface PlaygroundProps {
  config: {
    walaweApiKey: string;
    provider: string;
    providerKey: string;
    model: string;
  };
}

export default function Playground({ config }: PlaygroundProps) {
  const [messages, setMessages] = useState<{ role: string; content: string; isError?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWalaweKey = config.walaweApiKey.trim();
    const cleanProviderKey = config.providerKey.trim();

    if (!input.trim() || !cleanProviderKey || !cleanWalaweKey) {
      setError('API Key Walawe dan Provider Key wajib diisi. Buka menu Settings di pojok kanan atas.');
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
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${cleanWalaweKey}`, 
          'X-Provider-Key': cleanProviderKey, 
          'X-Provider-Name': config.provider 
        },
        body: JSON.stringify({ model: config.model.trim(), messages: [{ role: 'user', content: userMsg }], max_tokens: 100 }),
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
    <div className="flex flex-col h-full w-full bg-black">
      {/* Chat Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 scrollbar-thin">
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
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="shrink-0 p-4 md:px-6 bg-black border-t border-neutral-900 z-10">
        <form onSubmit={handleSend} className="relative flex items-center bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg focus-within:border-neutral-600 transition-colors">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Message Agent..." disabled={isLoading} className="w-full bg-transparent px-5 py-4 text-white text-[15px] focus:outline-none placeholder:text-neutral-600" />
          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 p-2 bg-white text-black rounded-xl hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"><Icons.Send /></button>
        </form>
        {error && <p className="text-red-500 text-[11px] text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}
