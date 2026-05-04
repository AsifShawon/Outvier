import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

interface FeaturedCountryCardProps {
  country: string;
  image: string;
  budget: string;
  programs: string;
  intakes: string;
}

export function FeaturedCountryCard({ country, image, budget, programs, intakes }: FeaturedCountryCardProps) {
  return (
    <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-[400px] card-hover">
      {/* Background Image Header */}
      <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <MapPin className="text-white w-5 h-5" />
          <h3 className="text-white font-bold text-2xl drop-shadow-md">{country}</h3>
        </div>
      </div>
      
      {/* Content */}
      <div className="absolute top-48 bottom-0 left-0 right-0 p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
        <div className="space-y-4 mt-2">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Popular Programs</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{programs}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Avg. Yearly Budget</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{budget}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Main Intakes</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{intakes}</span>
          </div>
        </div>

        <Link href="/universities" className="w-full">
          <button className="w-full py-3 rounded-xl bg-primary-50 hover:bg-primary-600 text-primary-600 hover:text-white dark:bg-slate-800 dark:text-primary-400 dark:hover:bg-primary-600 dark:hover:text-white font-semibold flex items-center justify-center gap-2 transition-colors">
            Explore {country} <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
