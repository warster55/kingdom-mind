'use client';

import { signIn } from 'next-auth/react';
import { Sparkles, Heart, Shield, ArrowRight } from 'lucide-react';

export function WelcomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-stone-950 font-serif overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Soft Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-200/40 dark:bg-stone-800/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl w-full space-y-16 text-center relative z-10">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-7xl text-stone-800 dark:text-stone-100 tracking-tight leading-tight italic font-light animate-fadeIn">
              Kingdom Mind
            </h1>
            <p className="text-xl md:text-2xl text-stone-500 dark:text-stone-400 font-light italic max-w-xl mx-auto leading-relaxed animate-fadeIn">
              "Be transformed by the renewing of your mind."
            </p>
          </div>

          <div className="pt-8 flex flex-col items-center gap-8">
            <button
              onClick={() => signIn('credentials')}
              className="group relative flex items-center gap-4 px-12 py-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full text-lg font-medium hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-700 animate-slideUp"
            >
              <span className="text-stone-700 dark:text-stone-300">Enter the Sanctuary</span>
              <ArrowRight className="w-5 h-5 text-amber-600 transition-transform duration-500 group-hover:translate-x-1" />
            </button>

            <div className="flex items-center gap-12 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 animate-fadeIn">
              <div className="flex items-center gap-2"><Shield className="w-3 h-3 opacity-50" /> Secure</div>
              <div className="flex items-center gap-2"><Heart className="w-3 h-3 opacity-50" /> Compassionate</div>
              <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 opacity-50" /> Transformative</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-12 border-t border-stone-100 dark:border-stone-900/50 text-center">
        <p className="text-[10px] uppercase tracking-widest text-stone-300 dark:text-stone-700 font-bold">
          © 2026 Kingdom Mind • Romans 12:2
        </p>
      </footer>
    </div>
  );
}
