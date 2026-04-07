'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Search, BarChart3, GraduationCap, MapPin, BookOpen, University, Shield, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const features = [
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Instantly search across all Australian universities and programs with real-time filtering by field, level, and location.',
  },
  {
    icon: BarChart3,
    title: 'Compare Analytics',
    description: 'Compare tuition fees, program duration, intake months, and career pathways side by side to make informed decisions.',
  },
  {
    icon: Shield,
    title: 'Verified Data',
    description: 'All data is curated by admins and sourced directly from official university websites to ensure accuracy.',
  },
];

const steps = [
  { number: '01', title: 'Browse Universities', description: 'Explore our curated list of Australian universities filtered by state, type, and ranking.' },
  { number: '02', title: 'Discover Programs', description: 'Filter programs by study level, field, campus mode, and tuition fees.' },
  { number: '03', title: 'Compare & Decide', description: 'Review detailed program information including career pathways and entry requirements.' },
];

const stats = [
  { label: 'Universities', value: '4+', icon: University },
  { label: 'Programs', value: '11+', icon: BookOpen },
  { label: 'States', value: '2', icon: MapPin },
  { label: 'Study Levels', value: '6', icon: GraduationCap },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Modernized Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[90vh] flex flex-col justify-center">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.15)_0%,transparent_60%)] blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_60%)] blur-[100px]" 
          />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.div variants={fadeUp}>
                <Badge className="mb-6 bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    The Ultimate Australian University Guide
                  </span>
                </Badge>
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display mb-6 leading-[1.05] tracking-tight">
                Data-Driven <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300">
                  Degree Decisions
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl">
                Compare tuition fees, program duration, and career pathways across leading Australian universities. We do the research so you can do the learning.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Link href="/programs">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 bg-white text-slate-950 hover:bg-slate-200 font-semibold shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 rounded-full gap-2 text-base">
                    Explore Programs
                    <ArrowUpRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/universities">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white backdrop-blur-md rounded-full text-base transition-colors">
                    Browse Universities
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Content - Abstract Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.4, type: "spring" }}
              className="hidden lg:block relative perspective-1000"
            >
              <div className="relative rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-xl p-6 shadow-2xl transform-gpu rotate-y-[-10deg] rotate-x-[5deg]">
                <div className="flex gap-2 mb-6">
                  <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-400/80"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-slate-800 rounded-lg animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-slate-700/50 p-4">
                      <div className="h-4 w-1/2 bg-slate-700 rounded mb-2" />
                      <div className="h-8 w-3/4 bg-blue-500/50 rounded" />
                    </div>
                    <div className="h-24 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-slate-700/50 p-4">
                      <div className="h-4 w-1/2 bg-slate-700 rounded mb-2" />
                      <div className="h-8 w-3/4 bg-purple-500/50 rounded" />
                    </div>
                  </div>
                  <div className="h-32 rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                     <div className="flex justify-between items-end h-full gap-2 opacity-50">
                        {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                           <div key={i} className="w-full bg-blue-400/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                     </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-12 -top-12 glass shadow-xl border border-slate-700/50 rounded-2xl p-4 bg-slate-800/90 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Verified Match</div>
                      <div className="text-xs text-slate-400">Master of IT</div>
                    </div>
                  </div>
                </motion.div>
                
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm relative z-20 mt-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-800/50">
              {stats.map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={stat.label} 
                  className="p-8 text-center flex flex-col items-center justify-center group"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:border-blue-500/50 transition-all duration-300">
                    <stat.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1 font-display">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full">Platform Features</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold font-display mb-6 tracking-tight">Everything you need to choose wisely</h2>
            <p className="text-lg text-muted-foreground">
              A meticulously curated platform designed to eliminate the noise and give you precisely the data you need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -8 }}
                key={feature.title}
                className="p-8 rounded-3xl border border-border/50 bg-card hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 transform origin-top-right">
                  <feature.icon className="h-32 w-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 shadow-inner">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with Sticky Scroll Feel */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/20 border-y border-border/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full">How It Works</Badge>
              <h2 className="text-4xl sm:text-5xl font-bold font-display mb-6 tracking-tight">Your path to the perfect program</h2>
              <p className="text-lg text-muted-foreground mb-8">
                We've simplified the research process into three actionable steps so you can focus on what matters: your future.
              </p>
              <Link href="/programs">
                <Button className="rounded-full px-8 h-12 gap-2">
                  Start Exploring <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  key={step.number} 
                  className="flex gap-6 bg-card p-6 rounded-3xl border border-border/50 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl font-black font-display text-primary">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rich CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-12 sm:p-20 text-center shadow-2xl border border-slate-800"
          >
            {/* Animated Glow behind CTA */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.3),transparent_50%)] pointer-events-none" />
            
            <GraduationCap className="h-16 w-16 mx-auto mb-8 text-blue-400 opacity-80" />
            <h2 className="text-4xl sm:text-5xl font-bold font-display mb-6 tracking-tight text-white">Begin your academic journey</h2>
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
              Join thousands of students who have securely and confidently matched with their dream university using Outvier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/programs">
                <Button size="lg" className="rounded-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 gap-2 w-full sm:w-auto shadow-lg shadow-blue-500/25 transition-all">
                  Browse All Programs
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

