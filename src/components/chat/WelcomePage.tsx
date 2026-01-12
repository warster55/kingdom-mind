'use client';

import { ArrowRight } from 'lucide-react';
import { useConfig } from '@/lib/contexts/ConfigContext';

interface WelcomePageProps {
  onEnter: () => void;
}

export function WelcomePage({ onEnter }: WelcomePageProps) {
  const { get } = useConfig();

  const subtitle = get('app_subtitle', '"Be transformed by the renewing of your mind."');
  const buttonText = get('app_button_enter', 'Enter the Sanctuary');

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 font-serif overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl w-full space-y-16 text-center relative z-10">
          <div className="space-y-6">
            {/* KINGDOMIND UNIFIED SIGNATURE - MATCHING HEADER STYLE */}
            <h1 className="flex items-baseline justify-center text-amber-500/80 text-4xl md:text-6xl uppercase tracking-[0.2em] font-black drop-shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-fadeIn">
              <span>KINGDO</span>
              <span className="text-7xl md:text-[10rem] font-normal text-amber-400 font-script mx-[-4px] md:mx-[-12px] transform translate-y-[10px] md:translate-y-[20px] scale-110 drop-shadow-[0_0_35px_rgba(251,191,36,0.5)]">m</span>
              <span>IND</span>
            </h1>
            <p className="text-xl md:text-2xl text-stone-500 dark:text-stone-400 font-light italic max-w-xl mx-auto leading-relaxed animate-fadeIn">
              {subtitle}
            </p>
          </div>

          <div className="pt-8 flex flex-col items-center gap-8">
            <input 
              type="text" 
              className="absolute opacity-0 pointer-events-none" 
              id="gesture-bridge" 
              readOnly 
            />
            
            <button
              onClick={() => {
                const bridge = document.getElementById('gesture-bridge');
                bridge?.focus();
                onEnter();
              }}
              className="group relative flex items-center gap-4 px-12 py-5 bg-white dark:bg-stone-900 border border-stone-800 rounded-full text-lg font-medium hover:border-amber-500/50 transition-all duration-700 animate-slideUp"
            >
              <span className="text-stone-700 dark:text-stone-300">{buttonText}</span>
              <ArrowRight className="w-5 h-5 text-amber-600 transition-transform duration-500 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
