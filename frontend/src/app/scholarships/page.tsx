'use client';

import { useState, useEffect } from 'react';
import { scholarshipsApi } from '@/lib/api/scholarships.api';
import { Scholarship } from '@/types/scholarship';
import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        setLoading(true);
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (category && category !== 'all') params.category = category;
        
        const res = await scholarshipsApi.getScholarships(params);
        if (res.data.success) {
          setScholarships(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch scholarships:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchScholarships();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200/60 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-50 via-white to-white opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold font-display text-slate-900 tracking-tight leading-tight mb-4">
              Discover Study Australia <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">Scholarships</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Explore scholarships, university grants, application support events, and resources to help you study in Australia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Search by keyword, university, or field..." 
                  className="pl-11 h-12 shadow-sm border-slate-200/80 rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 shadow-sm border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="scholarship">Scholarships</SelectItem>
                  <SelectItem value="grant">Grants</SelectItem>
                  <SelectItem value="internship">Internships</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="admission">Admission Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : scholarships.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No scholarships found</h3>
            <p className="text-slate-500">Try adjusting your search criteria or checking back later.</p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-full"
              onClick={() => { setSearch(''); setCategory('all'); }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scholarships.map(opp => (
              <ScholarshipCard key={opp._id} scholarship={opp} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
