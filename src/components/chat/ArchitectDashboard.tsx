'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users, LogOut, ChevronRight, Activity, DollarSign, Send, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/components/chat/ChatMessage';
import { MobileTabBar, MobileTab } from '@/components/chat/MobileTabBar';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

interface PlanProposal {
  title: string;
  summary: string;
  steps: string[];
  filesAffected: string[];
}

interface ArchitectDashboardProps {
  onExit: () => void;
  messages: Message[];
  isStreaming: boolean;
  onSend: (message: string) => void;
}

// Parse message content to check for plan proposals
function parsePlanProposal(content: string): PlanProposal | null {
  try {
    // Method 1: Check for PLAN_PROPOSAL type marker
    if (content.includes('PLAN_PROPOSAL') || content.includes('needsApproval')) {
      // Try to find the full plan object (using [\s\S] for cross-line matching instead of 's' flag)
      const planMatch = content.match(/"plan"\s*:\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/);
      if (planMatch) {
        const planJson = `{${planMatch[1]}}`;
        const plan = JSON.parse(planJson);
        if (plan.title && plan.summary) {
          return {
            title: plan.title,
            summary: plan.summary,
            steps: plan.steps || [],
            filesAffected: plan.filesAffected || []
          };
        }
      }
    }

    // Method 2: Look for structured plan markers in natural language
    // The Architect might present plans in a more readable format
    const titleMatch = content.match(/(?:Plan|Proposal):\s*["']?([^"'\n]+)["']?/i);
    const stepsMatch = content.match(/Steps?:?\s*\n((?:\s*[-*\d]+\.?\s+[^\n]+\n?)+)/i);
    const filesMatch = content.match(/Files?\s*(?:Affected|to\s+modify)?:?\s*\n?((?:\s*[-*]\s*[^\n]+\n?)+)/i);

    if (titleMatch && content.includes('approval')) {
      return {
        title: titleMatch[1].trim(),
        summary: content.slice(0, 200).replace(/\n/g, ' ').trim() + '...',
        steps: stepsMatch
          ? stepsMatch[1].split('\n').map(s => s.replace(/^[\s\-*\d.]+/, '').trim()).filter(Boolean)
          : [],
        filesAffected: filesMatch
          ? filesMatch[1].split('\n').map(s => s.replace(/^[\s\-*]+/, '').trim()).filter(Boolean)
          : []
      };
    }
  } catch (e) {
    // Not a plan proposal or parsing failed
    console.log('[PlanParser] Parse failed:', e);
  }
  return null;
}

// Plan Approval Card Component
function PlanApprovalCard({
  plan,
  onApprove,
  onDeny,
  disabled
}: {
  plan: PlanProposal;
  onApprove: () => void;
  onDeny: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-amber-950/30 border-2 border-amber-500/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-400">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-bold uppercase text-xs tracking-wider">Plan Requires Approval</span>
      </div>

      <h3 className="text-white font-bold text-lg">{plan.title}</h3>
      <p className="text-stone-300 text-sm">{plan.summary}</p>

      {plan.steps && plan.steps.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-stone-500 uppercase">Steps:</span>
          <ul className="list-disc list-inside text-sm text-stone-400 space-y-1">
            {plan.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.filesAffected && plan.filesAffected.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-stone-500 uppercase">Files Affected:</span>
          <div className="flex flex-wrap gap-1">
            {plan.filesAffected.map((file, i) => (
              <span key={i} className="text-xs bg-stone-800 px-2 py-1 rounded text-stone-300 font-mono">
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          Approve
        </button>
        <button
          onClick={onDeny}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          <XCircle className="w-5 h-5" />
          Deny
        </button>
      </div>
    </div>
  );
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [activePane, setActivePane] = useState<'GALAXY' | 'PULSE' | 'ARCHIVES'>('GALAXY');
  const [mobileTab, setMobileTab] = useState<MobileTab>('GALAXY');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [pendingPlan, setPendingPlan] = useState<PlanProposal | null>(null);
  const [planApproved, setPlanApproved] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Detect plan proposals in latest assistant message
  useEffect(() => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      const plan = parsePlanProposal(lastAssistantMsg.content);
      if (plan && !planApproved.has(plan.title)) {
        setPendingPlan(plan);
      } else {
        setPendingPlan(null);
      }
    }
  }, [messages, planApproved]);

  // Handle plan approval
  const handleApprovePlan = useCallback(() => {
    if (pendingPlan) {
      setPlanApproved(prev => new Set(prev).add(pendingPlan.title));
      setPendingPlan(null);
      onSend(`APPROVED: Proceed with "${pendingPlan.title}"`);
    }
  }, [pendingPlan, onSend]);

  // Handle plan denial
  const handleDenyPlan = useCallback(() => {
    if (pendingPlan) {
      setPendingPlan(null);
      onSend(`DENIED: Do not proceed with "${pendingPlan.title}". Please suggest an alternative approach.`);
    }
  }, [pendingPlan, onSend]);

  // Track visual viewport for keyboard handling
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport!;
      const windowHeight = window.innerHeight;
      const viewportH = vv.height;

      // Calculate keyboard height
      const kbHeight = Math.max(0, windowHeight - viewportH);
      setKeyboardHeight(kbHeight);
      setViewportHeight(`${viewportH}px`);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Auto-focus input when switching to chat tab on mobile
  useEffect(() => {
    if (isMobile && mobileTab === 'CHAT' && inputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [mobileTab, isMobile]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 1. Fetch Galaxy Data
  const { data: galaxyData } = useQuery({
    queryKey: ['architect-galaxy'],
    queryFn: async () => {
      const res = await fetch('/api/architect/galaxy');
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Sync mobile tab with desktop pane for non-chat tabs
  useEffect(() => {
    if (!isMobile && mobileTab !== 'CHAT') {
      setActivePane(mobileTab as 'GALAXY' | 'PULSE' | 'ARCHIVES');
    }
  }, [mobileTab, isMobile]);

  // 2. Render Galaxy Logic
  useEffect(() => {
    const shouldRenderGalaxy = isMobile ? mobileTab === 'GALAXY' : activePane === 'GALAXY';
    if (!shouldRenderGalaxy || !galaxyData?.galaxy || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    interface GalaxyUser {
      domain: string;
      brightness?: number;
    }
    const stars = galaxyData.galaxy.map((user: GalaxyUser, _i: number) => ({
      ...user,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.max(2, Math.min(8, (user.brightness || 0) * 0.5 + 2)),
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
      interface Star extends GalaxyUser {
        x: number;
        y: number;
        size: number;
        phase: number;
        speed: number;
      }
      stars.forEach((star: Star) => {
        star.y -= star.speed;
        if (star.y < 0) star.y = canvas.height;

        const pulse = Math.sin(Date.now() * 0.002 + star.phase) * 0.2 + 0.8;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = DOMAIN_COLORS[star.domain] || '#a8a29e';
        ctx.shadowBlur = 10 * pulse;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [activePane, mobileTab, galaxyData, isMobile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  // Galaxy View Component
  const GalaxyView = ({ fullScreen = false }: { fullScreen?: boolean }) => (
    <div className={cn("relative bg-black/50 overflow-hidden", fullScreen ? "flex-1" : "absolute inset-0")}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className={cn(
        "absolute p-4 bg-stone-900/90 border border-stone-800 rounded-xl backdrop-blur-md shadow-2xl",
        isMobile
          ? "bottom-16 left-4 right-4"
          : "bottom-6 left-6"
      )}>
        <h3 className="text-xs font-black text-stone-300 uppercase mb-3 tracking-widest">Domain Resonance</h3>
        <div className={cn(
          "grid gap-x-4 gap-y-2",
          isMobile ? "grid-cols-4" : "grid-cols-2 gap-x-6"
        )}>
          {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
            <div key={d} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] shrink-0" style={{ background: c, color: c }} />
              <span className={cn("text-stone-300 font-medium truncate", isMobile ? "text-[10px]" : "text-xs")}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Pulse View Component
  const PulseView = ({ fullScreen = false }: { fullScreen?: boolean }) => (
    <div className={cn(
      "grid gap-4",
      fullScreen ? "p-4 pb-20" : "p-12",
      isMobile ? "grid-cols-1" : "grid-cols-2 gap-8"
    )}>
      <div className="bg-stone-900/40 border border-stone-800 p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-sm">
        <div className="text-stone-400 text-xs md:text-sm font-bold uppercase mb-2 md:mb-3 flex items-center gap-2 tracking-wider">
          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-500" /> Total Provision Cost
        </div>
        <div className="text-3xl md:text-5xl font-black text-white">${galaxyData?.stats?.totalAiCost || '0.00'}</div>
      </div>
      <div className="bg-stone-900/40 border border-stone-800 p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-sm">
        <div className="text-stone-400 text-xs md:text-sm font-bold uppercase mb-2 md:mb-3 flex items-center gap-2 tracking-wider">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> Waiting at Gates
        </div>
        <div className="text-3xl md:text-5xl font-black text-amber-500">{galaxyData?.stats?.waitingAtGates || 0}</div>
      </div>
    </div>
  );

  // Handle send
  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, onSend]);

  // Chat View Component
  const ChatView = ({ fullScreen = false }: { fullScreen?: boolean }) => {
    const isKeyboardOpen = keyboardHeight > 0;

    return (
      <div className={cn(
        "flex flex-col bg-stone-950",
        fullScreen ? "flex-1" : "w-96 border-l border-stone-900 shadow-2xl"
      )}>
        <div className="p-4 border-b border-stone-900 bg-stone-900/40 shrink-0">
          <div className="flex items-center gap-2 text-stone-300 font-bold uppercase tracking-widest text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span>Architect Interface</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 font-sans">
          {messages.map((msg, i) => {
            // Check if this message contains a plan proposal
            const planInMessage = msg.role === 'assistant' ? parsePlanProposal(msg.content) : null;
            const showPlanCard = planInMessage && pendingPlan && planInMessage.title === pendingPlan.title;

            return (
              <div key={i}>
                <div className={cn(
                  "text-sm p-3 md:p-4 rounded-xl md:rounded-2xl border leading-relaxed",
                  msg.role === 'user'
                    ? "bg-stone-900 border-stone-800 text-stone-200"
                    : "bg-blue-950/10 border-blue-900/20 text-blue-100 italic shadow-inner"
                )}>
                  <div className="font-black text-[10px] uppercase mb-2 tracking-tighter opacity-40">{msg.role}</div>
                  {msg.content}
                </div>

                {/* Show Plan Approval Card if this message has a pending plan */}
                {showPlanCard && (
                  <div className="mt-4">
                    <PlanApprovalCard
                      plan={pendingPlan}
                      onApprove={handleApprovePlan}
                      onDeny={handleDenyPlan}
                      disabled={isStreaming}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {isStreaming && <div className="text-blue-400 text-sm animate-pulse font-bold tracking-widest">THINKING...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className={cn(
          "p-3 md:p-4 border-t border-stone-900 bg-stone-900/40 shrink-0",
          fullScreen && !isKeyboardOpen && "pb-16"
        )}>
          <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 p-2 md:p-3 rounded-xl md:rounded-2xl focus-within:border-blue-500/50 transition-all shadow-inner">
            <ChevronRight className="w-5 h-5 text-blue-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query system..."
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-stone-700 min-w-0"
            />
            {isMobile && inputValue.trim() && (
              <button
                onClick={handleSend}
                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // MOBILE LAYOUT
  if (isMobile) {
    const isKeyboardOpen = keyboardHeight > 0;

    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-x-0 top-0 z-[1000] bg-[#050505] flex flex-col font-mono text-stone-300"
        style={{ height: viewportHeight }}
      >
        {/* MOBILE HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-900 bg-stone-950/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <Activity className="w-3 h-3 text-red-500 animate-pulse" />
            <h2 className="text-white text-xs font-black uppercase tracking-[0.15em]">Sovereign</h2>
            <span className="text-[10px] text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full">
              {galaxyData?.stats?.totalSeekers || 0} seekers
            </span>
          </div>
          <button
            onClick={onExit}
            className="p-2 -mr-2 hover:bg-red-900/20 text-stone-500 hover:text-red-500 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* MOBILE CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {mobileTab === 'GALAXY' && <GalaxyView fullScreen />}
          {mobileTab === 'PULSE' && <PulseView fullScreen />}
          {mobileTab === 'CHAT' && <ChatView fullScreen />}
          {mobileTab === 'ARCHIVES' && (
            <div className="flex-1 flex items-center justify-center text-stone-600">
              <span className="text-sm">Archives coming soon...</span>
            </div>
          )}
        </div>

        {/* MOBILE TAB BAR - Hide when keyboard is open */}
        {!isKeyboardOpen && (
          <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
        )}
      </motion.div>
    );
  }

  // DESKTOP LAYOUT
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
          {(['GALAXY', 'PULSE', 'ARCHIVES'] as const).map((p) => (
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
          {activePane === 'GALAXY' && <GalaxyView />}
          {activePane === 'PULSE' && <PulseView />}
        </div>

        {/* RIGHT PANE: ARCHITECT CHAT */}
        <ChatView />
      </div>
    </motion.div>
  );
}
