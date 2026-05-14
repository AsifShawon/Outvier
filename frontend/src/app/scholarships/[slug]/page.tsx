'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { scholarshipsApi } from '@/lib/api/scholarships.api';
import { Scholarship } from '@/types/scholarship';
import { University } from '@/types/university';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, Clock, MapPin, Building, ExternalLink, 
  CheckCircle2, FileText, ListOrdered, Share2, Info, Mail
} from 'lucide-react';
import Link from 'next/link';

export default function ScholarshipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const res = await scholarshipsApi.getScholarshipBySlug(resolvedParams.slug);
        if (res.data.success && res.data.data) {
          setData(res.data.data);
        } else {
          setData(null);
        }
      } catch (error) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    if (resolvedParams.slug) {
      fetchScholarship();
    }
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Skeleton className="h-[400px] w-full" />
        <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 space-y-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return notFound();
  }

  const university = data.linkedUniversity as University | undefined;
  
  const getDaysRemaining = () => {
    if (!data.deadlineDate) return null;
    const deadline = new Date(data.deadlineDate);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysRemaining = getDaysRemaining();

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <div className="relative h-[300px] md:h-[400px] w-full bg-slate-900">
        {data.imageUrl ? (
          <>
            <img src={data.imageUrl} alt={data.imageAlt || data.title} className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-slate-900" />
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-32 relative z-10">
        
        {/* Title Card */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-lg border border-slate-100 mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 uppercase tracking-wider text-xs border-none font-semibold">
              {data.category}
            </Badge>
            {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 14 && (
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none">
                Closing Soon: {daysRemaining} days left
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold font-display text-slate-900 leading-tight mb-4">
            {data.title}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-8 max-w-3xl">
            {data.shortSummary}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-6 border-t border-slate-100">
            {data.applicationLink ? (
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 shadow-md" asChild>
                <a href={data.applicationLink} target="_blank" rel="noopener noreferrer">
                  Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            ) : (
              <Button size="lg" disabled className="rounded-full px-8">
                Applications Closed
              </Button>
            )}
            
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => {
              if (navigator.share) {
                navigator.share({ title: data.title, url: window.location.href });
              }
            }}>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Rich Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold font-display text-slate-900 mb-4">Overview</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {data.description}
              </div>
            </div>

            {/* Benefits */}
            {data.benefits && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg text-green-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-slate-900">Benefits & Value</h2>
                </div>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {data.benefits}
                </div>
              </div>
            )}

            {/* Eligibility */}
            {data.eligibility && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold font-display text-slate-900 mb-4">Eligibility Criteria</h2>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {data.eligibility}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            
            {/* Key Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Key Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Deadline</p>
                    <p className="text-sm text-slate-600">
                      {data.deadlineDate ? new Date(data.deadlineDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No specific deadline'}
                    </p>
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <p className={`text-xs mt-1 font-medium ${daysRemaining <= 14 ? 'text-orange-600' : 'text-green-600'}`}>
                        {daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                </div>

                {(data.city || data.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Location</p>
                      <p className="text-sm text-slate-600">
                        {[data.city, data.state, data.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* University Card */}
            {university && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Offered By</h3>
                <div className="flex items-center gap-4 mb-4">
                  {university.logoUrl ? (
                    <img src={university.logoUrl} alt={university.name} className="w-12 h-12 rounded object-contain bg-slate-50 border p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                      <Building className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-slate-900 leading-tight">{university.name}</h4>
                    <Link href={`/universities/${university.slug}`} className="text-sm text-primary hover:underline mt-1 inline-block">
                      View Profile &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Resources Needed Block */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-400" /> Resources Needed
              </h3>

              {data.requiredDocuments && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" /> Documents Checklist
                  </h4>
                  <div className="text-sm text-slate-400 whitespace-pre-wrap pl-6">
                    {data.requiredDocuments}
                  </div>
                </div>
              )}

              {data.applicationSteps && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                    <ListOrdered className="w-4 h-4" /> Application Steps
                  </h4>
                  <div className="text-sm text-slate-400 whitespace-pre-wrap pl-6">
                    {data.applicationSteps}
                  </div>
                </div>
              )}

              {data.sourceLinks && data.sourceLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4" /> Official Sources
                  </h4>
                  <div className="space-y-2 pl-6">
                    {data.sourceLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-sm text-teal-400 hover:text-teal-300 hover:underline break-words"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {data.contactEmail && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" /> Need Help?
                  </h4>
                  <a href={`mailto:${data.contactEmail}`} className="text-sm text-teal-400 hover:text-teal-300 pl-6">
                    {data.contactEmail}
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
