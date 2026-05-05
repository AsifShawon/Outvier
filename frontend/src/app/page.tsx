'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Map, BookOpen, Calculator, Compass, Building, BarChart, FileCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useQuery } from '@tanstack/react-query';
import { universitiesApi } from '@/lib/api/universities.api';
import { programsApi } from '@/lib/api/programs.api';

// Components
import { CompactSmartSearch } from '@/components/ui-custom/CompactSmartSearch';
import { HeroImageSlider } from '@/components/ui-custom/HeroImageSlider';
import { FeaturedCountryCard } from '@/components/ui-custom/FeaturedCountryCard';
import { JourneyStepCard } from '@/components/ui-custom/JourneyStepCard';
import { BudgetPreviewSection } from '@/components/ui-custom/BudgetPreviewSection';
import { ComparisonPreview } from '@/components/ui-custom/ComparisonPreview';
import { TestimonialCard } from '@/components/ui-custom/TestimonialCard';
import { UniversityCard } from '@/components/ui-custom/UniversityCard';
import { ProgramCard } from '@/components/ui-custom/ProgramCard';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';

const valueProps = [
  { icon: Compass, title: 'Personalized Support', description: 'Tailored recommendations based on your unique academic background, budget, and career goals.' },
  { icon: BarChart, title: 'Side-by-Side Comparison', description: 'Compare universities, programs, tuition, and living costs easily in one dashboard.' },
  { icon: Calculator, title: 'Budget Clarity', description: 'No hidden costs. Get accurate estimates for tuition, housing, and everyday living.' },
  { icon: FileCheck, title: 'Verified Data', description: 'Information sourced directly from official university guidelines and trusted institutional partners.' },
];

const journeySteps = [
  { number: '1', title: 'Discover Countries', description: 'Explore top study destinations, their culture, and post-study work opportunities.', icon: Map },
  { number: '2', title: 'Compare Universities', description: 'Filter universities by ranking, location, public/private status, and campus life.', icon: Building },
  { number: '3', title: 'Choose Programs', description: 'Find the exact degree, check intakes, tuition fees, and duration.', icon: BookOpen },
  { number: '4', title: 'Estimate Costs', description: 'Use our calculators to plan your budget confidently before you apply.', icon: Calculator },
];

export default function HomePage() {
  const { data: uniData, isLoading: uniLoading } = useQuery({
    queryKey: ['home-universities'],
    queryFn: () => universitiesApi.getAll({ limit: 4 }),
  });

  const { data: progData, isLoading: progLoading } = useQuery({
    queryKey: ['home-programs'],
    queryFn: () => programsApi.getAll({ limit: 4 }),
  });

  const universities = uniData?.data?.universities || [];
  const programs = progData?.data?.programs || [];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden bg-white dark:bg-slate-950">
        {/* Subtle background glow */}
        <div className="absolute top-0 inset-x-0 h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full bg-primary-50/50 dark:bg-primary-900/10 blur-3xl opacity-40" />
          <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-primary-50/50 dark:bg-primary-900/10 blur-3xl opacity-40" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-start">
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 text-xs font-bold uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Focused on Australia
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display mb-4 leading-[1.15] tracking-tight text-slate-900 dark:text-white">
                  Find your best <br className="hidden sm:block" />
                  <span className="text-primary-600 dark:text-primary-400">
                    Australian university match.
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-xl">
                  Compare programs, costs, scholarships, and fit scores in one simple platform.
                </p>

                {/* Trust Chips - Compact */}
                <div className="flex flex-wrap gap-2 mb-10">
                  {['Australian universities', 'Program comparison', 'Budget estimate', 'Scholarships'].map((chip, idx) => (
                    <div key={idx} className="flex items-center text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg shadow-sm">
                      <CheckCircle2 className="w-3 h-3 text-primary-500 mr-2" />
                      {chip}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Compact Search Panel */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.15 }}
                className="w-full relative z-30"
              >
                <CompactSmartSearch />
              </motion.div>
            </div>

            {/* Right Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:col-span-5 xl:col-span-4 w-full mt-8 lg:mt-0"
            >
              <HeroImageSlider />
            </motion.div>

          </div>
        </div>
      </section>

      {/* Smart Study Abroad Journey */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold font-display text-slate-900 dark:text-white mb-4">Smart Study Abroad Journey</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">From confusion to clarity. We&apos;ve mapped out exactly how you should plan your global education.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {journeySteps.map((step, idx) => (
              <JourneyStepCard key={idx} index={idx} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Countries */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 dark:text-white mb-4">Featured Destinations</h2>
              <p className="text-slate-500 dark:text-slate-400">Explore the most popular countries for international students.</p>
            </div>
            <Link href="/universities" className="hidden md:flex items-center text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              View all countries <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeaturedCountryCard 
              country="Australia"
              image="https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=2130&auto=format&fit=crop"
              budget="$25k - $45k"
              programs="1,200+"
              intakes="Feb, Jul, Nov"
            />
            {/* Placeholder countries for visual appeal */}
            <FeaturedCountryCard 
              country="Canada"
              image="https://images.unsplash.com/photo-1490623970972-ae8bb3da443e?q=80&w=2069&auto=format&fit=crop"
              budget="$20k - $40k"
              programs="900+"
              intakes="Jan, May, Sep"
            />
            <FeaturedCountryCard 
              country="United Kingdom"
              image="https://images.unsplash.com/photo-1513635269975-5969336cd122?q=80&w=2070&auto=format&fit=crop"
              budget="$22k - $42k"
              programs="1,500+"
              intakes="Jan, Sep"
            />
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/universities">
              <Button variant="outline" className="w-full">View all countries</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top University Matches */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 dark:text-white mb-4">Top Universities</h2>
              <p className="text-slate-500 dark:text-slate-400">Discover highly-ranked institutions matching global standards.</p>
            </div>
            <Link href="/universities" className="hidden md:flex items-center text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              View all universities <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {uniLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : universities.length > 0 ? (
              universities.map((uni: any) => <UniversityCard key={uni._id} university={uni} />)
            ) : (
              <p className="text-slate-500 col-span-4">No universities available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Program Discovery Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 dark:text-white mb-4">Popular Programs</h2>
              <p className="text-slate-500 dark:text-slate-400">Explore degrees with the best career outcomes and student satisfaction.</p>
            </div>
            <Link href="/programs" className="hidden md:flex items-center text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              View all programs <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {progLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : programs.length > 0 ? (
              programs.map((prog: any) => <ProgramCard key={prog._id} program={prog} />)
            ) : (
              <p className="text-slate-500 col-span-4">No programs available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Budget Confidence Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BudgetPreviewSection />
        </div>
      </section>

      {/* Compare Before You Apply */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ComparisonPreview />
        </div>
      </section>

      {/* Why Outvier */}
      <section className="py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 dark:text-white mb-4">Why students choose Outvier</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">We give you the data and tools to make your own confident decisions.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueProps.map((vp, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <vp.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{vp.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{vp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Student Stories</h2>
            <p className="text-slate-400">Hear from international students who found their perfect match.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard 
              quote="Outvier made comparing tuition fees so easy. I saved thousands by finding a program that fit my budget exactly."
              name="Sarah K."
              country="Australia"
              initials="SK"
            />
            <TestimonialCard 
              quote="The side-by-side comparison tool helped me decide between two amazing universities in minutes instead of weeks."
              name="Michael T."
              country="Canada"
              initials="MT"
            />
            <TestimonialCard 
              quote="I loved how I could see the actual total cost of living, not just the tuition. It helped me prepare my finances."
              name="Elena R."
              country="UK"
              initials="ER"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden bg-primary-600 dark:bg-primary-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">Ready to plan your study-abroad journey?</h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of students making data-driven degree decisions. Start exploring today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/programs">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 bg-white text-primary-600 hover:bg-slate-100 font-bold rounded-full text-lg shadow-xl">
                Start Exploring
              </Button>
            </Link>
            <Link href="/universities">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 border-white text-white hover:bg-white/10 font-bold rounded-full text-lg">
                Compare Universities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

