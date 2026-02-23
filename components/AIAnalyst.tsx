
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MoreVertical, Terminal } from 'lucide-react';
import { RefineryUnit, ChatMessage } from '../types';
import { chatWithDataStream } from '../services/geminiService';

interface AIAnalystProps {
  units: RefineryUnit[];
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ units }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Refinery Intelligence Core online. Analyzing telemetry streams. Awaiting operator query.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
        const history = messages.concat(userMsg).map(m => ({ role: m.role, text: m.text }));
        const modelMsgId = (Date.now() + 1).toString();
        const modelMsgPlaceholder: ChatMessage = {
            id: modelMsgId,
            role: 'model',
            text: '', 
            timestamp: new Date()
        };
        setMessages(prev => [...prev, modelMsgPlaceholder]);

        const streamResponse = await chatWithDataStream(history, units);

        if (!streamResponse) throw new Error("No response stream returned");

        for await (const chunk of streamResponse) {
            if (!isMounted.current) break;
            try {
                const text = chunk.text;
                if (text) {
                    setMessages(prev => prev.map(msg => 
                        msg.id === modelMsgId ? { ...msg, text: msg.text + text } : msg
                    ));
                }
            } catch (err) {
                console.warn("Skipped blocked/malformed chunk", err);
            }
        }
    } catch (e: any) {
        console.error("Stream Fatal Error", e);
        if (isMounted.current) {
            setMessages(prev => {
                const filtered = prev.filter(msg => msg.text !== '');
                return [...filtered, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: `⚠️ Connection Error: ${e.message || "Lost contact with AI service."}`,
                    timestamp: new Date()
                }];
            });
        }
    } finally {
        if (isMounted.current) setIsLoading(false);
    }
  };

  return (
    <div className={`h-[600px] flex flex-col relative overflow-hidden rounded-2xl border glass-panel ${isDay ? 'bg-white/60 border-slate-200' : 'bg-black/30 border-white/10'}`}>
      
      {/* Header */}
      <div className={`px-6 py-4 flex justify-between items-center z-20 border-b ${isDay ? 'bg-white/80 border-slate-200' : 'bg-black/40 border-white/10'}`}>
          <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-lg ${isDay ? 'bg-white border-slate-200' : 'bg-black/50 border-white/10'}`}>
                  <Bot className={`w-6 h-6 ${isDay ? 'text-brand-sky' : 'text-neon-blue'}`} />
              </div>
              <div className="flex flex-col">
                  <span className={`font-bold text-base ${isDay ? 'text-slate-800' : 'text-white'}`}>Gemini Operational Core</span>
                  <span className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 ${isDay ? 'text-emerald-600' : 'text-neon-green'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span> Online
                  </span>
              </div>
          </div>
          <div className={`${isDay ? 'text-slate-400' : 'text-white/20'}`}>
              <Terminal className="w-6 h-6" />
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
        <div className="flex flex-col gap-6">
            {messages.map((msg) => (
            <div
                key={msg.id}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                {msg.role === 'model' && (
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 mr-3 flex items-center justify-center border ${isDay ? 'bg-white border-slate-200' : 'bg-black/40 border-white/10'}`}>
                         <Sparkles className={`w-4 h-4 ${isDay ? 'text-brand-sky' : 'text-neon-purple'}`} />
                    </div>
                )}
                <div 
                    className={`relative px-5 py-3 max-w-[80%] rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                        ? (isDay ? 'bg-brand-sky text-white rounded-tr-none' : 'bg-neon-blue/20 border border-neon-blue/30 text-white rounded-tr-none') 
                        : (isDay ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none')}`}
                >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className={`text-[9px] mt-2 opacity-50 font-mono text-right`}>
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </div>
                </div>
                {msg.role === 'user' && (
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 ml-3 flex items-center justify-center border ${isDay ? 'bg-slate-200 border-slate-300' : 'bg-white/10 border-white/10'}`}>
                         <User className="w-4 h-4 opacity-50" />
                    </div>
                )}
            </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start items-center gap-3">
                     <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${isDay ? 'bg-white border-slate-200' : 'bg-black/40 border-white/10'}`}>
                         <Sparkles className={`w-4 h-4 ${isDay ? 'text-brand-sky' : 'text-neon-purple'}`} />
                    </div>
                    <div className={`px-4 py-2 rounded-lg text-xs font-mono animate-pulse ${isDay ? 'text-slate-500' : 'text-neon-blue'}`}>
                        Thinking...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-4 z-20 border-t ${isDay ? 'bg-white/80 border-slate-200' : 'bg-black/40 border-white/10'}`}>
        <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${isDay ? 'bg-white border-slate-300 focus-within:border-brand-sky focus-within:ring-2 focus-within:ring-sky-100' : 'bg-black/30 border-white/10 focus-within:border-neon-blue focus-within:ring-1 focus-within:ring-neon-blue/50'}`}>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Gemini about plant status, anomalies, or optimization..."
                className={`flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm ${isDay ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-gray-500'}`}
            />
            <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className={`p-2.5 rounded-lg flex items-center justify-center transition-all
                    ${inputValue.trim() 
                        ? (isDay ? 'bg-brand-sky text-white hover:bg-sky-600 shadow-md' : 'bg-neon-blue text-white hover:bg-blue-600 shadow-neon')
                        : 'bg-transparent opacity-50 cursor-not-allowed'}
                `}
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};
