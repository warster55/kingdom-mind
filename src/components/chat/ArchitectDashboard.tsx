'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, Users, Compass, Zap, LogOut, Terminal as TerminalIcon, 
  ChevronRight, Clock, Heart, DollarSign, Activity, AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/components/chat/ChatMessage';

interface ArchitectDashboardProps {
  onExit: () => void;
  messages: Message[];
  isStreaming: boolean;
  onSend: (message: string) => void;
}

export function ArchitectDashboard({ onExit, messages, isStreaming, onSend }: ArchitectDashboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [activePane, setActivePane] = useState<'WATCHTOWER' | 'GARDEN' | 'TREASURY'>('WATCHTOWER');

  const { data: health, dataUpdatedAt } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await fetch(`/api/health/db?t=${Date.now()}`);
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: recentInsights } = useQuery({
    queryKey: ['recent-insights'],
    queryFn: async () => {
      const res = await fetch(`/api/user/insights?limit=5`);
      return res.json();
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (dataUpdatedAt) setLastUpdate(new Date(dataUpdatedAt).toLocaleTimeString());
  }, [dataUpdatedAt]);

  const metrics = [
    { label: 'Seekers', value: health?.totalUsers || '0', icon: Users, color: 'text-stone-100' },
    { label: 'Threats', value: '0', icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Est. Cost', value: `$${((health?.activeSessions24h || 0) * 0.02).toFixed(2)}`, icon: DollarSign, color: 'text-stone-100' },
    { label: 'Resonance', value: 'Identity', icon: Compass, color: 'text-amber-500' },
  ];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#080706] flex flex-col font-mono text-stone-300"
    >
      {/* TOP NAV */}
      <div className="flex items-center justify-between p-6 border-b border-stone-900 bg-stone-950/50">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <h2 className="text-white text-xs font-black uppercase tracking-[0.3em]">Command Center</h2>
          </div>
          <div className="flex items-center gap-2 text-[8px] text-stone-600 uppercase tracking-tighter">
            <Clock className="w-2 h-2" />
            <span>Synced: {lastUpdate}</span>
          </div>
        </div>

        <div className="flex bg-stone-900 p-1 rounded-lg gap-1">
          {['WATCHTOWER', 'GARDEN', 'TREASURY'].map((p: any) => (
            <button 
              key={p} 
              onClick={() => setActivePane(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[9px] font-bold transition-all",
                activePane === p ? "bg-stone-800 text-white shadow-xl" : "text-stone-600 hover:text-stone-400"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <button onClick={onExit} className="p-2 hover:bg-stone-900 rounded-lg transition-colors">
          <LogOut className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR METRICS */}
        <div className="w-64 border-r border-stone-900 p-6 space-y-4 hidden md:flex flex-col bg-stone-950/20">
          <h3 className="text-[10px] text-stone-600 font-bold uppercase tracking-widest mb-2">Live Metrics</h3>
          {metrics.map((m, i) => (
            <div key={i} className="bg-stone-900/30 border border-stone-800/50 p-4 rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <m.icon className="w-3 h-3 text-stone-600" />
                <span className="text-[8px] text-stone-600 uppercase font-bold">{m.label}</span>
              </div>
              <span className={cn("text-lg font-black", m.color)}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* MAIN DISPLAY PANE */}
        <div className="flex-1 flex flex-col min-w-0 p-6">
          <div className="flex-1 flex flex-col min-h-0 bg-stone-950/50 border border-stone-900 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* PANE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
              {activePane === 'WATCHTOWER' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-stone-500 border-b border-stone-900 pb-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active Intelligence Log</span>
                  </div>
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div key={msg.id || i} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[8px] font-bold px-1 rounded", msg.role === 'user' ? "bg-stone-800 text-stone-500" : "bg-red-950/30 text-red-500")}>
                            {msg.role === 'user' ? 'INPUT' : 'OUTPUT'}
                          </span>
                          <span className="text-stone-700 text-[8px]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed max-w-2xl", msg.role === 'user' ? "text-stone-400" : "text-stone-100 italic")}>
                          {msg.content}
                        </p>
                      </div>
                    ))}
                    {isStreaming && <span className="text-red-500 animate-pulse">_</span>}
                  </div>
                </div>
              )}

              {activePane === 'GARDEN' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-amber-500 border-b border-stone-900 pb-2">
                    <Heart className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Harvested Insights</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {recentInsights?.length > 0 ? recentInsights.map((insight: any, i: number) => (
                      <div key={i} className="bg-stone-900/50 p-4 rounded-xl border border-stone-800/30">
                        <div className="text-[8px] text-amber-600 uppercase font-black mb-1">{insight.domain}</div>
                        <p className="text-xs text-stone-200 italic">"{insight.content}"</p>
                      </div>
                    )) : (
                      <div className="text-center py-12 text-stone-700 italic text-xs">Waiting for seeds to sprout...</div>
                    )}
                  </div>
                </div>
              )}

              {activePane === 'TREASURY' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-stone-100 border-b border-stone-900 pb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Provision Ledger</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-stone-900/50 rounded-2xl border border-stone-800/30">
                      <div className="text-[8px] text-stone-500 uppercase font-bold mb-2">Token Usage (24h)</div>
                      <div className="text-3xl font-black text-white">{(health?.activeSessions24h || 0) * 150} <span className="text-xs text-stone-600 uppercase tracking-widest">Tokens</span></div>
                    </div>
                    <div className="p-6 bg-amber-950/10 rounded-2xl border border-amber-900/20">
                      <div className="text-[8px] text-amber-600 uppercase font-bold mb-2">Offerings Received</div>
                      <div className="text-3xl font-black text-amber-500">$0.00 <span className="text-xs text-amber-800 uppercase tracking-widest">Total</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COMMAND BAR (Only in Watchtower) */}
            {activePane === 'WATCHTOWER' && (
              <div className="p-4 bg-stone-900/50 border-t border-stone-900">
                <div className="flex items-center gap-3 bg-stone-950 border border-stone-800 p-2.5 rounded-xl">
                  <ChevronRight className="w-4 h-4 text-red-600 shrink-0" />
                  <input 
                    ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown} placeholder="Execute sovereignty command..."
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-stone-700"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 text-center border-t border-stone-900 bg-stone-950/50">
        <p className="text-[7px] text-stone-700 uppercase tracking-[0.5em]">Sovereign Control Interface • v3.0.0-genesis</p>
      </div>
    </motion.div>
  );
}
