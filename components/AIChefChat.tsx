
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MenuItem } from '../types';
import { chatWithChef } from '../lib/gemini';

interface Props {
  isOpen: boolean;
  menu: MenuItem[];
  onClose: () => void;
}

const AIChefChat: React.FC<Props> = ({ isOpen, menu, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Bon appétit! I am The Best Chef. How can I help you navigate our menu or answer any questions about our dishes?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithChef(messages, input, menu);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: response.text || 'I apologize, my creative juices are a bit low right now.',
        sources: response.sources 
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'The kitchen seems busy. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md h-[85vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl flex flex-col animate-slide-up overflow-hidden">
        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-navy relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-navy shadow-xl shadow-primary/20 rotate-3">
              <span className="material-icons-round text-2xl">restaurant</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">The Best Chef</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                  Master Sommelier AI
                  <span className="material-icons-round text-[10px] animate-pulse">psychology</span>
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center">
            <span className="material-icons-round">close</span>
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 no-scrollbar bg-slate-50 dark:bg-slate-950/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-navy text-white font-medium rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
              }`}>
                {m.text}
              </div>
              {/* Grounding Sources for Search */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                  {m.sources.map((source, idx) => (
                    source.web && (
                      <a 
                        key={idx} 
                        href={source.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-primary bg-navy px-2 py-1 rounded-lg border border-primary/20 flex items-center gap-1 hover:bg-navy/80 transition-colors"
                      >
                        <span className="material-icons-round text-[10px]">link</span>
                        {source.web.title || 'Source'}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-primary animate-pulse">Deep Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pb-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-700 focus-within:border-primary transition-all">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me about our recipes or allergens..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 dark:text-white placeholder:text-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-navy text-primary h-12 w-12 rounded-2xl flex items-center justify-center disabled:opacity-30 shadow-lg active:scale-95 transition-all"
            >
              <span className="material-icons-round">send</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};

export default AIChefChat;
