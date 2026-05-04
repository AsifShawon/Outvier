'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop',
    floatingCard: {
      icon: CheckCircle2,
      color: 'text-primary-500',
      bgColor: 'bg-primary-100 dark:bg-primary-500/20',
      title: 'Fit score ready',
      subtitle: '94% Match'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop',
    floatingCard: {
      icon: DollarSign,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      title: 'Budget matched',
      subtitle: 'Within $30k'
    }
  },
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop',
    floatingCard: {
      icon: Sparkles,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
      title: 'Scholarship found',
      subtitle: '$5,000 Awarded'
    }
  }
];

export function HeroImageSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[380px] lg:h-[460px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[current].image})` }}
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current + '-card'}
          initial={{ opacity: 0, y: 10, x: -10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -10, x: 10 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="absolute bottom-8 left-6 sm:left-8 glass rounded-2xl p-3 shadow-xl border border-white/20 flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md"
        >
          {(() => {
            const CardIcon = slides[current].floatingCard.icon;
            return (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${slides[current].floatingCard.bgColor}`}>
                  <CardIcon className={`w-5 h-5 ${slides[current].floatingCard.color}`} />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold text-sm leading-tight">{slides[current].floatingCard.title}</p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-medium">{slides[current].floatingCard.subtitle}</p>
                </div>
              </>
            );
          })()}
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              current === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
