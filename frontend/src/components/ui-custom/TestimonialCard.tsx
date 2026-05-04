import { Quote } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  country: string;
  initials: string;
}

export function TestimonialCard({ quote, name, country, initials }: TestimonialCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col h-full hover:shadow-lg transition-shadow">
      <Quote className="w-10 h-10 text-primary-100 dark:text-primary-900/40 absolute top-6 right-6" />
      
      <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed flex-1 relative z-10 mb-8 italic">
        &quot;{quote}&quot;
      </p>

      <div className="flex items-center gap-4 mt-auto">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold font-display text-lg">
          {initials}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">{name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Studying in {country}</p>
        </div>
      </div>
    </div>
  );
}
