'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, AlertTriangle, LogOut, ChevronRight, Activity, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/components/chat/ChatMessage';

interface ArchitectDashboardProps {
  onExit: () => void;
  messages: Message[];
  isStreaming: boolean;
  onSend: (message: string) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  'Identity': '#fbbf24', // Amber
  'Purpose': '#3b82f6',  // Blue
  'Mindset': '#10b981',  // Emerald
  'Relationships': '#f43f5e', // Rose
  'Vision': '#8b5cf6',   // Violet
  'Action': '#f97316',   // Orange
  'Legacy': '#d946ef'    // Fuchsia
};

export function ArchitectDashboard({ onExit, messages, isStreaming, onSend }: ArchitectDashboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [activePane, setActivePane] = useState<'GALAXY' | 'PULSE' | 'ARCHIVES'>('GALAXY');
  const [hoveredUser, setHoveredUser] = useState<any | null>(null);

  // 1. Fetch Galaxy Data
  const { data: galaxyData } = useQuery({
    queryKey: ['architect-galaxy'],
    queryFn: async () => {
      const res = await fetch('/api/architect/galaxy');
      return res.json();
    },
    refetchInterval: 10000,
  });

  // 2. Render Galaxy Logic
  useEffect(() => {
    if (activePane !== 'GALAXY' || !galaxyData?.galaxy || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const stars = galaxyData.galaxy.map((user: any, i: number) => ({
      ...user,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.max(2, Math.min(8, (user.brightness || 0) * 0.5 + 2)), // Size based on breakthrough count
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.05 + 0.02
    }));

    const render = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
      for (let y = 0; y < canvas.height; y += 100) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
      ctx.stroke();

      // Draw Stars
      stars.forEach((star: any) => {
        // Drift
        star.y -= star.speed;
        if (star.y < 0) star.y = canvas.height;

        // Pulse
        const pulse = Math.sin(Date.now() * 0.002 + star.phase) * 0.2 + 0.8;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = DOMAIN_COLORS[star.domain] || '#a8a29e';
        ctx.shadowBlur = 10 * pulse;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Hover Effect Logic (Simplified proximity check could go here)
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [activePane, galaxyData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col font-mono text-stone-300"
    >
      {/* HUD HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-stone-900 bg-stone-950/80 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-red-500 animate-pulse" />
              <h2 className="text-white text-sm font-black uppercase tracking-[0.2em]">Sovereign View</h2>
            </div>
            <span className="text-xs text-stone-400">
              Seekers: {galaxyData?.stats?.totalSeekers || 0} | Active: {galaxyData?.stats?.active24h || 0}
            </span>
          </div>
        </div>

        <div className="flex bg-stone-900/50 p-1 rounded-lg gap-1 border border-stone-800">
          {['GALAXY', 'PULSE', 'ARCHIVES'].map((p: any) => (
            <button 
              key={p} 
              onClick={() => setActivePane(p)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                activePane === p ? "bg-stone-800 text-white shadow-lg" : "text-stone-500 hover:text-stone-300"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <button onClick={onExit} className="p-2 hover:bg-red-900/20 text-stone-500 hover:text-red-500 rounded-lg transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: VISUALIZATION */}
        <div className="flex-1 relative bg-black/50 overflow-hidden">
          {activePane === 'GALAXY' && (
            <div className="absolute inset-0">
              <canvas ref={canvasRef} className="w-full h-full block" />
              <div className="absolute bottom-6 left-6 p-5 bg-stone-900/90 border border-stone-800 rounded-xl backdrop-blur-md shadow-2xl">
                <h3 className="text-xs font-black text-stone-300 uppercase mb-3 tracking-widest">Domain Resonance</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
                    <div key={d} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: c, color: c }} />
                      <span className="text-xs text-stone-300 font-medium">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePane === 'PULSE' && (
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-stone-900/40 border border-stone-800 p-8 rounded-3xl backdrop-blur-sm">
                 <div className="text-stone-400 text-sm font-bold uppercase mb-3 flex items-center gap-2 tracking-wider">
                   <DollarSign className="w-5 h-5 text-green-500" /> Total Provision Cost
                 </div>
                 <div className="text-5xl font-black text-white">${galaxyData?.stats?.totalAiCost || '0.00'}</div>
               </div>
               <div className="bg-stone-900/40 border border-stone-800 p-8 rounded-3xl backdrop-blur-sm">
                 <div className="text-stone-400 text-sm font-bold uppercase mb-3 flex items-center gap-2 tracking-wider">
                   <Users className="w-5 h-5 text-amber-500" /> Waiting at Gates
                 </div>
                 <div className="text-5xl font-black text-amber-500">{galaxyData?.stats?.waitingAtGates || 0}</div>
               </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE: ARCHITECT CHAT */}
        <div className="w-96 border-l border-stone-900 bg-stone-950 flex flex-col shadow-2xl">
          <div className="p-4 border-b border-stone-900 bg-stone-900/40">
            <div className="flex items-center gap-2 text-stone-300 font-bold uppercase tracking-widest text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span>Architect Interface</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
            {messages.map((msg, i) => (
              <div key={i} className={cn("text-sm p-4 rounded-2xl border leading-relaxed", msg.role === 'user' ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-blue-950/10 border-blue-900/20 text-blue-100 italic shadow-inner")}>
                <div className="font-black text-[10px] uppercase mb-2 tracking-tighter opacity-40">{msg.role}</div>
                {msg.content}
              </div>
            ))}
            {isStreaming && <div className="text-blue-400 text-sm animate-pulse font-bold tracking-widest">THINKING...</div>}
          </div>

          <div className="p-6 border-t border-stone-900 bg-stone-900/40">
            <div className="flex items-center gap-3 bg-stone-950 border border-stone-800 p-3 rounded-2xl focus-within:border-blue-500/50 transition-all shadow-inner">
              <ChevronRight className="w-5 h-5 text-blue-500" />
              <input 
                ref={inputRef} 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown} 
                placeholder="Query system..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-stone-700"
              />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
