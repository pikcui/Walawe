'use client';

import { useState, useRef, useEffect } from 'react';

const Icons = {
  Send: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Key: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>),
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export default function Playground() {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'openrouter'>('openai');
  const [providerKey, setProviderKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (provider === 'openai') setModel('gpt-4o-mini');
    if (provider === 'anthropic') setModel('claude-haiku-4-5');
    if (provider === 'openrouter') setModel('meta-llama/llama-3-8b-instruct:free');
  }, [provider]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !providerKey.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('walawe_token');
      const res = await fetch(`${API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Provider-Key': providerKey,
          'X-Provider-Name': provider,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: userMsg }],
          max_tokens: 100,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Failed to connect to agent');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

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
                if (parsed.text) {
                  assistantMsg += parsed.text;
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = assistantMsg;
                    return newMsgs;
                  });
                }
              } catch (e) {
                // Abaikan parsing error pada chunk yang belum lengkap
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-scale-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tighter">Agent Playground</h1>
        <p className="text-neutral-500 text-sm mt-1">Test your AI agent using your Bring Your Own Key (BYOK).</p>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[65vh]">
        
        {/* Header Settings */}
        <div className="p-4 border-b border-neutral-800 bg-black/50 space-y-4">
          <div className="flex gap-2 bg-black p-1 rounded-lg border border-neutral-800 w-full md:w-fit overflow-x-auto">
            <button onClick={() => setProvider('openai')} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${provider === 'openai' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>OpenAI</button>
            <button onClick={() => setProvider('anthropic')} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${provider === 'anthropic' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Anthropic</button>
            <button onClick={() => setProvider('openrouter')} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${provider === 'openrouter' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>OpenRouter</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                <Icons.Key /> {provider} Provider Key (BYOK)
              </label>
              <input 
                type="password" 
                value={providerKey} 
                onChange={e => setProviderKey(e.target.value)} 
                placeholder={provider === 'openai' ? 'sk-proj-...' : provider === 'anthropic' ? 'sk-ant-...' : 'sk-or-v1-...'} 
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-neutral-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Model</label>
              <input 
                type="text" 
                value={model} 
                onChange={e => setModel(e.target.value)} 
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-neutral-500" 
              />
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
                <Icons.Send />
              </div>
              <p className="text-sm">Kirim pesan pertama untuk mulai berinteraksi dengan Agen.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm ${msg.role === 'user' ? 'bg-white text-black font-medium' : 'bg-neutral-900 text-neutral-200 border border-neutral-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-5 py-3 text-sm bg-neutral-900 text-neutral-200 border border-neutral-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 text-xs bg-red-950/50 p-3 rounded-lg border border-red-900">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-neutral-800 bg-black/50 flex gap-3">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Tanya sesuatu ke agenmu..." 
            disabled={isLoading || !providerKey}
            className="flex-grow bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neutral-500 disabled:opacity-50" 
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim() || !providerKey}
            className="bg-white text-black px-6 rounded-xl font-bold hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <Icons.Send />
          </button>
        </form>
      </div>
    </div>
  );
}
