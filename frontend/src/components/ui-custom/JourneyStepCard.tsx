import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface JourneyStepCardProps {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
}

export function JourneyStepCard({ number, title, description, icon: Icon, index }: JourneyStepCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors" />

      {/* Number badge */}
      <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-display font-bold text-xl relative z-10 group-hover:scale-110 transition-transform">
        {number}
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">
          {description}
        </p>
      </div>

      {/* Decorative Icon */}
      <div className="hidden md:flex flex-shrink-0 w-16 h-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 relative z-10 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
        <Icon className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </motion.div>
  );
}
