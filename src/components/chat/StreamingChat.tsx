'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/components/chat/ChatMessage';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Insight, Habit } from '@/lib/types';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { RotateCcw } from 'lucide-react';

interface StreamingChatProps {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  insights: Insight[];
  habits: Habit[];
  mode?: 'mentor' | 'architect';
  isKeyboardOpen?: boolean;
  onStatusChange?: (status: 'thinking' | 'waiting' | 'reading') => void;
  isAuthenticated?: boolean; // New prop
}

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

const DOMAIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'Identity': { x: 20, y: 20 }, 
  'Purpose': { x: 80, y: 20 }, 
  'Mindset': { x: 10, y: 50 },
  'Relationships': { x: 50, y: 85 }, 
  'Vision': { x: 90, y: 50 }, 
  'Action': { x: 20, y: 80 }, 
  'Legacy': { x: 80, y: 80 },
};

export function StreamingChat({
  messages, isStreaming, error: _error, insights: _insights, habits: _habits, mode: _mode = 'mentor', isKeyboardOpen = false, onStatusChange, isAuthenticated = false
}: StreamingChatProps) {
  const { get } = useConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  interface BornStar {
    id: string;
    domain: string;
    size: number;
    offsetX: number;
    offsetY: number;
  }
  const [bornStars, setBornStars] = useState<BornStar[]>([]);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isSurgeActive, setIsSurgeActive] = useState(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setHasMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile(); window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: status } = useQuery({
    queryKey: ['user-status'],
    queryFn: async () => { 
      const res = await fetch('/api/user/status'); 
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json(); 
    },
    refetchInterval: 10000,
    enabled: isAuthenticated, // Only run if authenticated
  });

  const starSpeed = get('star_speed', 2.5);
  const mobileZoomScale = get('mobile_zoom_scale', 0.7);
  const mobileYOffset = get('mobile_y_offset', -5);
  const colorAccent = get('color_accent', '#fbbf24');
  const colorTextMain = get('color_text_main', '#fafaf9');
  const colorTextDim = get('color_text_dim', '#a8a29e');
  
  const wordsPerPageBase = isMobile ? 25 : 40;

  const aiMessages = messages.filter(m => m.role === 'assistant');
  const lastAiMessage = aiMessages[aiMessages.length - 1];
  const lastMessage = messages[messages.length - 1];
  const rawContent = lastAiMessage?.content || '';

  // --- SMART CHUNKING ---
  const fullContent = useMemo(() => rawContent.replace(/\[RESONANCE:\s*[^\]]+\]/, '').trim(), [rawContent]);
  const allWords = useMemo(() => fullContent.split(' '), [fullContent]);

  const pages = useMemo(() => {
    const chunks: string[][] = [];
    const threshold = 8; // Prevent dangling words (merge if less than 8 words left)
    let i = 0;
    while (i < allWords.length) {
      let end = i + wordsPerPageBase;
      if (allWords.length - end < threshold) {
        end = allWords.length;
      }
      chunks.push(allWords.slice(i, end));
      i = end;
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [allWords, wordsPerPageBase]);

  const currentWords = pages[currentPage] || [];
  const isPageComplete = wordIndex >= currentWords.length;
  const hasMorePages = currentPage < pages.length - 1;

  const lastReportedStatus = useRef<string>('');

  useEffect(() => {
    if (!onStatusChange) return;
    
    let newStatus: 'thinking' | 'waiting' | 'reading' = 'reading';
    
    if (isStreaming && (lastMessage?.role === 'user' || rawContent === '' || (currentPage === 0 && wordIndex === 0))) {
      newStatus = 'thinking';
    } else if (isPageComplete) {
      newStatus = 'waiting';
    } else {
      newStatus = 'reading';
    }

    if (lastReportedStatus.current !== newStatus) {
      lastReportedStatus.current = newStatus;
      onStatusChange(newStatus);
    }
  }, [isStreaming, isPageComplete, lastMessage?.role, rawContent, currentPage, wordIndex, onStatusChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') e.preventDefault();

    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 300;
    lastTapRef.current = now;

    if (isDoubleTap) {
      setIsSurgeActive(true);
      return;
    }

    if (!isPageComplete) {
      setWordIndex(currentWords.length);
    } else if (hasMorePages) {
      setCurrentPage(prev => prev + 1);
      setWordIndex(0);
      setIsSurgeActive(false);
    } else if (pages.length > 1) {
      setCurrentPage(0);
      setWordIndex(0);
      setIsSurgeActive(false);
    }
  };

  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  useEffect(() => {
    if (lastAiMessage?.id && lastAiMessage.id !== activeMessageId) {
      setActiveMessageId(lastAiMessage.id);
      setWordIndex(0); 
      setCurrentPage(0);
      setIsSurgeActive(false);
    }
  }, [lastAiMessage?.id, activeMessageId]);

  // Heartbeat stays active until 3 words are shown to prevent flickering
  const showHeartbeat = isStreaming && (lastMessage?.role === 'user' || rawContent === '' || (currentPage === 0 && wordIndex < 3));

  useEffect(() => {
    if (isPageComplete) return;
    const nextWord = currentWords[wordIndex];
    let delay = get('pacer_base', 150);
    if (nextWord?.endsWith('.')) delay = get('pacer_period', 800);
    else if (nextWord?.endsWith(',')) delay = get('pacer_comma', 400);
    if (isSurgeActive) delay = delay * 0.2;
    const timer = setTimeout(() => { setWordIndex(prev => prev + 1); }, delay);
    return () => clearTimeout(timer);
  }, [currentWords, wordIndex, isSurgeActive, isPageComplete, get]);

  // --- DUAL RESONANCE READER ---
  interface MessageWithTelemetry extends Message {
    telemetry?: { resonance?: string[] };
  }
  const activeResonanceList = useMemo(() => {
    const list: string[] = [];
    // 1. Check Telemetry (New Silent Protocol)
    const msgWithTelemetry = lastAiMessage as MessageWithTelemetry | undefined;
    if (msgWithTelemetry?.telemetry?.resonance) {
      list.push(...msgWithTelemetry.telemetry.resonance);
    }
    // 2. Check Text Tags (Legacy fallback)
    const match = rawContent.match(/\[RESONANCE:\s*([^\]]+)\]/);
    if (match) {
      list.push(...match[1].split(',').map(s => s.trim()));
    }
    return Array.from(new Set(list)); // Unique values
  }, [rawContent, lastAiMessage]);

  const [lastTaggedId, setLastTaggedId] = useState<string | null>(null);
  useEffect(() => {
    if (activeResonanceList.length > 0 && lastAiMessage?.id !== lastTaggedId) {
      setLastTaggedId(lastAiMessage?.id || null);
      const newStars: BornStar[] = [];
      activeResonanceList.forEach(domain => {
        if (DOMAINS.includes(domain)) {
          newStars.push({ id: `star-${Math.random()}`, domain, size: 2.5, offsetX: 0, offsetY: 0 });
        }
      });
      setBornStars(prev => [...prev, ...newStars]);
    }
  }, [activeResonanceList, lastAiMessage?.id, lastTaggedId]);

  interface StarCluster {
    domain: string;
    offsetX: number;
    offsetY: number;
    size: number;
  }
  const baseStarClusters = useMemo(() => {
    if (!hasMounted) return [] as StarCluster[];
    const clusters: StarCluster[] = [];
    Object.entries(status?.resonance || {}).forEach(([domain, count]) => {
      const pos = DOMAIN_POSITIONS[domain] || { x: 50, y: 50 };
      const _pos = pos; // Silence unused variable warning - pos used for positioning
      const starCount = Math.floor((count as number) * (isMobile ? 0.3 : 1));
      for (let i = 0; i < starCount; i++) {
        const u = Math.random(); const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        clusters.push({ domain, offsetX: z * 8, offsetY: (Math.random() - 0.5) * 16, size: Math.random() * 0.8 + 0.2 });
      }
    });
    return clusters;
  }, [status?.resonance, isMobile, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    
    // Optimization: Create Set outside the loop for O(1) lookups
    const glowingDomains = new Set(activeResonanceList);
    
    let frame: number;
    const render = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const zoomScale = isKeyboardOpen ? mobileZoomScale : 1.0;
      const zoomYOffset = isKeyboardOpen ? -50 : 0;

      baseStarClusters.forEach(star => {
        const pos = DOMAIN_POSITIONS[star.domain] || { x: 50, y: 50 };
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        let x = (pos.x + star.offsetX) / 100 * canvas.width;
        let y = (pos.y + star.offsetY) / 100 * canvas.height;
        x = centerX + (x - centerX) * zoomScale;
        y = centerY + (y - centerY) * zoomScale + zoomYOffset;

        const isGlowing = glowingDomains.has(star.domain);
        ctx.beginPath(); ctx.arc(x, y, star.size * zoomScale, 0, Math.PI * 2);
        ctx.fillStyle = isGlowing ? `rgba(251, 191, 36, 0.6)` : `rgba(255, 255, 255, ${status?.activeDomain === star.domain ? 0.4 : 0.1})`; 
        ctx.fill();
      });
      frame = requestAnimationFrame(render);
    };
    render(); return () => cancelAnimationFrame(frame);
  }, [baseStarClusters, activeResonanceList, hasMounted, isKeyboardOpen, status?.activeDomain, mobileZoomScale]);

  return (
    <div 
      className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center cursor-pointer touch-none" 
      onPointerDown={handlePointerDown}
    >
      <motion.canvas ref={canvasRef} animate={{ filter: isStreaming ? 'blur(12px) brightness(0.4)' : 'blur(0px) brightness(1)' }} transition={{ duration: 2.5 }} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none z-10">
        {hasMounted && DOMAINS.map((domain) => {
          const isActive = status?.activeDomain === domain;
          const isGlowing = activeResonanceList.includes(domain);
          const pos = DOMAIN_POSITIONS[domain] || { x: 50, y: 50 };
          
          return (
            <motion.div 
              key={domain} 
              initial={{ scale: 0, opacity: 0, left: '50%', top: '50%', x: '-50%', y: '-50%' }}
              animate={{ 
                opacity: isStreaming ? 0.3 : (isActive || isGlowing ? 1 : 0.7),
                left: `${pos.x}%`, 
                top: `${pos.y}%`,
                scale: isKeyboardOpen ? mobileZoomScale : (isActive ? 1.2 : 1),
                y: isKeyboardOpen ? `${mobileYOffset - 75}%` : '-50%'
              }} 
              transition={{ duration: 1.5, ease: "easeOut" }} 
              className="absolute"
            >
              <span className={cn("font-serif italic uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-1000", isMobile ? "text-[10px]" : "text-sm")} style={{ color: isGlowing ? colorAccent : (isActive ? colorTextMain : colorTextDim) }}>{domain}</span>
            </motion.div>
          );
        })}
      </div>

      {/* BORN STARS */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <AnimatePresence>
          {bornStars.map((star) => {
            const targetPos = DOMAIN_POSITIONS[star.domain] || { x: 50, y: 50 };
            return (
              <motion.div
                key={star.id}
                initial={{ left: '50%', top: '50%', scale: 0, opacity: 0 }}
                animate={{ left: [`50%`, `${targetPos.x + star.offsetX}%`], top: [`50%`, `${targetPos.y + star.offsetY}%`], scale: [0, 2, 1], opacity: [0, 1, 0.8] }}
                transition={{ duration: starSpeed, ease: "easeOut" }}
                onAnimationComplete={() => setBornStars(prev => prev.filter(s => s.id !== star.id))}
                className="absolute w-1 h-1 rounded-full shadow-[0_0_15px_#fbbf24] blur-[1px]"
                style={{ backgroundColor: colorAccent }}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showHeartbeat && (
          <motion.div key="heartbeat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute z-50 flex flex-col items-center justify-center gap-4" >
            <motion.div animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-32 h-32 bg-stone-100/20 blur-[30px] rounded-full" />
            <motion.div animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.4, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute w-64 h-48 bg-white/5 blur-[60px] rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-30 w-full flex justify-center items-center h-full pointer-events-none">
        <div className="w-full px-12 max-w-3xl flex flex-col text-center">
          <AnimatePresence mode="wait">
            {!showHeartbeat && (
              <motion.div 
                key={`${activeMessageId}-${currentPage}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 0.8 }}
                className={cn("font-serif italic leading-loose", isMobile ? "text-lg" : "text-2xl")}
                style={{ color: colorTextMain }}
              >
                {currentWords.map((word, i) => (
                  <span 
                    key={i} 
                    className={cn(
                      "transition-opacity duration-500", 
                      i < wordIndex ? "opacity-100" : "opacity-0"
                    )}
                  >
                    {word}{' '}
                  </span>
                ))}
                
                {/* INTERACTION INDICATORS */}
                {isPageComplete && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="inline-flex items-center justify-center ml-2"
                  >
                    {hasMorePages ? (
                      <motion.span 
                        animate={{ opacity: [0.2, 1, 0.2] }} 
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-amber-500"
                      >
                        ...
                      </motion.span>
                    ) : (
                      pages.length > 1 && (
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="text-amber-500/40"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </motion.div>
                      )
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
