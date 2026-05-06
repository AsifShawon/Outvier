'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  MapPin, 
  GraduationCap, 
  DollarSign, 
  Languages, 
  Calendar,
  Search,
  Plus,
  X,
  Trash2,
  TrendingUp,
  Globe,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useComparison } from '@/context/ComparisonContext';
import { programsApi } from '@/lib/api/programs.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { comparisonApi } from '@/lib/api/comparison.api';
import { cn } from '@/lib/utils';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import Link from 'next/link';

interface ComparisonRow {
  label: string;
  icon: any;
  key: string;
  formatter?: (val: any) => string | React.ReactNode;
}

const PROGRAM_ROWS: ComparisonRow[] = [
  { label: 'University', icon: Building2, key: 'university.name' },
  { label: 'State', icon: MapPin, key: 'university.state' },
  { label: 'Level', icon: GraduationCap, key: 'level', formatter: (val) => val?.replace(/_/g, ' ') || 'N/A' },
  { label: 'Duration', icon: Calendar, key: 'duration', formatter: (val) => val || 'N/A' },
  { label: 'Study Mode', icon: BookOpen, key: 'campusMode', formatter: (val) => val?.replace('-', ' ') || 'on campus' },
  { label: 'Campus', icon: MapPin, key: 'campus', formatter: (val) => val || 'Main Campus' },
  { label: 'Intake', icon: Calendar, key: 'intakeMonths', formatter: (val) => Array.isArray(val) ? val.join(', ') : val || 'N/A' },
  { label: 'Tuition (AUD/yr)', icon: DollarSign, key: 'annualTuition', formatter: (val) => val ? `$${val.toLocaleString()}` : 'N/A' },
  { label: 'Scholarship', icon: Globe, key: 'scholarshipAvailable', formatter: (val) => val ? <Badge className="bg-emerald-100 text-emerald-700 border-none">Available</Badge> : 'Not listed' },
  { label: 'IELTS', icon: Languages, key: 'ieltsRequirement', formatter: (val) => val ? val.toString() : '6.5' },
  { label: 'Min. GPA', icon: TrendingUp, key: 'minimumGPA', formatter: (val) => val || 'Not specified' },
  { label: 'Description', icon: Info, key: 'description', formatter: (val) => <p className="line-clamp-3 text-xs font-normal leading-relaxed text-slate-500">{val || 'No description available.'}</p> },
];

const UNI_ROWS: ComparisonRow[] = [
  { label: 'State', icon: MapPin, key: 'state' },
  { label: 'City', icon: MapPin, key: 'city', formatter: (val) => val || 'Various' },
  { label: 'Global Rank', icon: TrendingUp, key: 'ranking', formatter: (val) => val ? `#${val}` : 'N/A' },
  { label: 'Type', icon: Building2, key: 'providerType', formatter: (val) => val || 'University' },
  { label: 'CRICOS Code', icon: Search, key: 'cricosProviderCode', formatter: (val) => val || 'N/A' },
  { label: 'Est. Year', icon: Calendar, key: 'establishedYear', formatter: (val) => val?.toString() || 'N/A' },
  { label: 'Avg. Tuition', icon: DollarSign, key: 'averageEstimatedTotalCostAud', formatter: (val) => val ? `$${val.toLocaleString()}` : 'N/A' },
  { label: 'Capacity', icon: GraduationCap, key: 'institutionCapacity', formatter: (val) => val ? `${val.toLocaleString()} students` : 'N/A' },
  { label: 'Website', icon: Globe, key: 'officialWebsite', formatter: (val) => val ? <a href={val} target="_blank" className="text-primary-600 hover:underline inline-flex items-center gap-1">Visit <ExternalLink className="h-3 w-3" /></a> : 'N/A' },
  { label: 'Programs', icon: BookOpen, key: 'programCount', formatter: (val) => val?.toString() || '0' },
];

export default function ComparisonWorkspacePage() {
  const { hash, selectedIds, selectedUniIds, addToCompare, removeFromCompare, addUniversityToCompare, removeUniversityFromCompare, isLoading: isContextLoading } = useComparison();
  const [activeTab, setActiveTab] = useState<'programs' | 'universities'>('programs');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['comparison-session', hash],
    queryFn: () => comparisonApi.getSession(hash!),
    enabled: !!hash,
  });

  const { data: scoresData } = useQuery({
    queryKey: ['comparison-scores', hash],
    queryFn: () => comparisonApi.getScores(hash!),
    enabled: !!hash && selectedIds.length > 0,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search-items', searchQuery, activeTab],
    queryFn: () => activeTab === 'programs' 
      ? programsApi.getAll({ q: searchQuery, limit: 5 })
      : universitiesApi.getAll({ q: searchQuery, limit: 5 }),
    enabled: searchQuery.length > 1,
  });

  const session = sessionData?.data?.data;
  const programs = session?.selectedProgramIds || [];
  const universities = session?.selectedUniversityIds || [];
  const scores = scoresData?.data?.data || [];

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const handleAddItem = async (id: string) => {
    if (activeTab === 'programs') {
      await addToCompare(id);
    } else {
      await addUniversityToCompare(id);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7FAF1]">
      <Navbar />
      
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Badge variant="outline" className="border-primary-200 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Comparison Engine v2.0
            </Badge>
            <h1 className="text-5xl font-black font-display tracking-tight text-slate-900 leading-none">
              Your Study <span className="text-primary-600">Decision</span> Workspace
            </h1>
            <p className="text-slate-500 max-w-2xl text-lg font-medium">
              Analyze courses and universities side-by-side. We use your academic profile to generate personalized fit scores and deep insights.
            </p>
          </div>

          <Button 
            onClick={() => setIsSearchOpen(true)}
            className="rounded-2xl h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 font-bold text-base gap-3"
          >
            <Plus className="h-5 w-5" />
            Add {activeTab === 'programs' ? 'Program' : 'University'}
          </Button>
        </div>

        {/* Workspace Controls */}
        <div className="flex items-center gap-2 mb-8 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
          <button 
            onClick={() => setActiveTab('programs')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
              activeTab === 'programs' 
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            Compare Programs
            <Badge className="ml-2 bg-white/20 border-none text-[10px]">{selectedIds.length}</Badge>
          </button>
          <button 
            onClick={() => setActiveTab('universities')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
              activeTab === 'universities' 
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            Compare Universities
            <Badge className="ml-2 bg-white/20 border-none text-[10px]">{selectedUniIds.length}</Badge>
          </button>
        </div>

        {/* Main Content Area */}
        {isContextLoading || isLoadingSession ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[500px] rounded-3xl" />
            <Skeleton className="h-[500px] rounded-3xl" />
            <Skeleton className="h-[500px] rounded-3xl" />
          </div>
        ) : (activeTab === 'programs' ? programs : universities).length === 0 ? (
          <div className="py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center">
              <Search className="h-10 w-10 text-primary-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Your workspace is empty</h3>
              <p className="text-slate-400 max-w-sm mx-auto font-medium">
                Start by adding some {activeTab} to see side-by-side comparison and fit scores.
              </p>
            </div>
            <Button 
              onClick={() => setIsSearchOpen(true)}
              variant="outline" 
              className="rounded-2xl px-8 border-slate-200 font-bold"
            >
              Search {activeTab === 'programs' ? 'Programs' : 'Universities'}
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-8 text-left border-b border-slate-100 min-w-[280px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Metric</span>
                        <span className="text-2xl font-black text-slate-900">Side-by-Side</span>
                      </div>
                    </th>
                    {(activeTab === 'programs' ? programs : universities).map((item: any) => (
                      <th key={item._id} className="p-8 border-b border-slate-100 border-l border-slate-100 min-w-[320px] relative group">
                        <button 
                          onClick={() => activeTab === 'programs' ? removeFromCompare(item._id) : removeUniversityFromCompare(item._id)}
                          className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        
                        <div className="space-y-5">
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden p-2">
                              {activeTab === 'programs' ? (
                                item.university?.logoUrl || item.university?.logo ? (
                                  <img src={item.university.logoUrl || item.university.logo} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <GraduationCap className="h-8 w-8 text-slate-200" />
                                )
                              ) : (
                                item.logoUrl || item.logo ? (
                                  <img src={item.logoUrl || item.logo} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Building2 className="h-8 w-8 text-slate-200" />
                                )
                              )}
                            </div>
                            
                            {activeTab === 'programs' && (
                              <div className="flex-1">
                                {scores.find((s: any) => s.programId === item._id) && (
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-2xl font-black",
                                      scores.find((s: any) => s.programId === item._id).totalScore > 80 ? 'text-emerald-500' : 
                                      scores.find((s: any) => s.programId === item._id).totalScore > 50 ? 'text-amber-500' : 'text-red-500'
                                    )}>
                                      {scores.find((s: any) => s.programId === item._id).totalScore}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Fit Score</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="text-left space-y-1">
                            <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2 min-h-[3.5rem]">
                              {item.name}
                            </h3>
                            <p className="text-xs font-bold text-primary-600 flex items-center gap-1">
                              {activeTab === 'programs' ? item.universityName : `${item.city || 'Various'}, ${item.state}`}
                            </p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Dynamic Rows */}
                  {(activeTab === 'programs' ? PROGRAM_ROWS : UNI_ROWS).map((row) => (
                    <tr key={row.key} className="group hover:bg-primary-50/30 transition-colors">
                      <td className="p-6 border-b border-slate-100 text-sm font-bold text-slate-400">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-white group-hover:text-primary-600 transition-colors">
                            <row.icon className="h-4 w-4" />
                          </div>
                          {row.label}
                        </div>
                      </td>
                      {(activeTab === 'programs' ? programs : universities).map((item: any) => {
                        const val = getNestedValue(item, row.key);
                        const formatted = row.formatter ? row.formatter(val) : val;
                        return (
                          <td key={item._id} className="p-6 border-b border-slate-100 border-l border-slate-100 text-sm text-slate-900 font-bold align-top">
                            {formatted || <span className="text-slate-300 font-normal">Not available</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Fit Reasons for Programs */}
                  {activeTab === 'programs' && (
                    <tr className="bg-primary-50/20">
                      <td className="p-6 text-sm font-bold text-primary-700 align-top">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-primary-600">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          AI Fit Insights
                        </div>
                      </td>
                      {programs.map((program: any) => {
                        const score = scores.find((s: any) => s.programId === program._id);
                        return (
                          <td key={program._id} className="p-6 border-l border-slate-100 align-top">
                            <div className="space-y-3">
                              {score?.reasons?.slice(0, 3).map((r: string, i: number) => (
                                <div key={i} className="flex gap-2 text-[11px] text-slate-700 leading-snug font-medium">
                                  {r.includes('exceeds') || r.includes('below') || r.includes('Required') ? (
                                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                  )}
                                  <span>{r}</span>
                                </div>
                              ))}
                              {!score && <span className="text-[10px] text-slate-400 italic">Scores loading...</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Search Modal */}
        <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <CommandInput 
            placeholder={`Search ${activeTab === 'programs' ? 'programs by name or university...' : 'universities by name or state...'}`} 
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No {activeTab} found for "{searchQuery}"</CommandEmpty>
            <CommandGroup heading="Results">
              {searchResults?.data?.data?.map((item: any) => (
                <CommandItem 
                  key={item._id}
                  onSelect={() => handleAddItem(item._id)}
                  className="flex items-center gap-4 p-4 cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border">
                    {activeTab === 'programs' ? (
                      item.university?.logoUrl ? <img src={item.university.logoUrl} alt="" className="object-contain" /> : <GraduationCap className="h-5 w-5 text-slate-400" />
                    ) : (
                      item.logoUrl ? <img src={item.logoUrl} alt="" className="object-contain" /> : <Building2 className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {activeTab === 'programs' ? item.universityName : `${item.city || 'Various'}, ${item.state}`}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-slate-300" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </main>

      <Footer />
    </div>
  );
}
