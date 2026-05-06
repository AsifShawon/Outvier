'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api/profile.api';
import { programsApi } from '@/lib/api/programs.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  InfoIcon, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  GraduationCap,
  Globe,
  Wallet,
  Target,
  Settings2,
  Sparkles
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IPriorityWeights {
  affordability: number;
  ranking: number;
  employability: number;
  admissionMatch: number;
  location: number;
  scholarship: number;
}

interface ProfileFormData {
  preferredField: string;
  preferredLevel: string;
  budgetMaxAud: number;
  preferredStates: string[];
  ieltsScore: number;
  pteScore: number;
  academicBackground: string;
  careerGoals: {
    targetRole: string;
    migrationInterest: boolean;
    fundingSource: 'self' | 'loan' | 'scholarship' | 'family';
  };
  priorityWeights: IPriorityWeights;
  priorityPreset: 'balanced' | 'budget' | 'career' | 'prestige' | 'easy-admission' | 'scholarship';
}

const STATES = ['SA', 'QLD', 'VIC', 'NSW', 'WA', 'TAS', 'NT', 'ACT'];
const LEVELS = [
  { value: 'bachelor', label: 'Bachelor Degree' },
  { value: 'master', label: 'Master Degree' },
  { value: 'phd', label: 'PhD' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'graduate_certificate', label: 'Graduate Certificate' },
];

const PRESETS = [
  { id: 'balanced', label: 'Balanced', description: 'All factors considered equally', icon: Sparkles, weights: { affordability: 25, ranking: 20, employability: 20, admissionMatch: 15, location: 10, scholarship: 10 } },
  { id: 'budget', label: 'Budget First', description: 'Prioritises affordable tuition', icon: Wallet, weights: { affordability: 45, scholarship: 20, admissionMatch: 15, employability: 10, location: 5, ranking: 5 } },
  { id: 'career', label: 'Career Growth', description: 'Focus on graduate outcomes', icon: Target, weights: { employability: 40, ranking: 20, affordability: 15, admissionMatch: 10, scholarship: 10, location: 5 } },
  { id: 'prestige', label: 'Academic Prestige', description: 'Prioritises world rankings', icon: GraduationCap, weights: { ranking: 45, employability: 20, affordability: 10, admissionMatch: 10, scholarship: 5, location: 10 } },
];

const STEPS = [
  { id: 'academic', title: 'Academic', description: 'Education & Language', icon: GraduationCap },
  { id: 'goals', title: 'Goals', description: 'Career & Migration', icon: Target },
  { id: 'fit', title: 'Fit Strategy', description: 'Recommendation Weights', icon: Settings2 },
];

export default function ProfilePage() {
  const qc = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>({
    preferredField: '',
    preferredLevel: 'master',
    budgetMaxAud: 40000,
    preferredStates: [],
    ieltsScore: 6.5,
    pteScore: 65,
    academicBackground: '',
    careerGoals: {
      targetRole: '',
      migrationInterest: false,
      fundingSource: 'family'
    },
    priorityPreset: 'balanced',
    priorityWeights: {
      affordability: 25,
      ranking: 20,
      employability: 20,
      admissionMatch: 15,
      location: 10,
      scholarship: 10,
    },
  });

  const { data: profileRes, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const { data: fieldsRes } = useQuery({
    queryKey: ['program-fields'],
    queryFn: () => programsApi.getFields(),
  });

  useEffect(() => {
    if (profileRes?.data?.data) {
      const p = profileRes.data.data;
      setFormData(prev => ({
        ...prev,
        ...p,
        careerGoals: p.careerGoals || prev.careerGoals,
        priorityWeights: p.priorityWeights || prev.priorityWeights,
      }));
    }
  }, [profileRes]);

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) => profileApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    else mutation.mutate(formData);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (isLoadingProfile) return <div className="p-12 text-center">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-20">
      {/* Header & Stepper */}
      <div className="mb-12">
        <h1 className="text-4xl font-black font-display text-slate-900 tracking-tight">Profile Builder</h1>
        <p className="text-slate-500 mt-2">Help us find the perfect Australian university for your goals.</p>
        
        <div className="mt-10 flex items-center justify-between relative">
           <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
           {STEPS.map((step, i) => (
             <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setCurrentStep(i)}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  currentStep === i ? "bg-deep-green text-white shadow-lg shadow-deep-green/20" : 
                  currentStep > i ? "bg-green-100 text-green-600" : "bg-white border border-slate-200 text-slate-300"
                )}>
                  {currentStep > i ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                </div>
                <div className="text-center">
                  <p className={cn("text-xs font-black uppercase tracking-widest", currentStep === i ? "text-deep-green" : "text-slate-400")}>{step.title}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
               <CardHeader className="bg-slate-50/50 p-8 border-b">
                 <CardTitle className="text-2xl font-display">Academic Background</CardTitle>
                 <CardDescription>Tell us about your previous education and language skills.</CardDescription>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Preferred Field</Label>
                      <Select 
                        value={formData.preferredField} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, preferredField: v }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                          <SelectValue placeholder="Select Field" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {fieldsRes?.data?.data?.map((f: string) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Study Level</Label>
                      <Select 
                        value={formData.preferredLevel} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, preferredLevel: v }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                          <SelectValue placeholder="Select Level" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {LEVELS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">IELTS Score</Label>
                      <Input 
                        type="number" step="0.5" 
                        value={formData.ieltsScore} 
                        onChange={(e) => setFormData(prev => ({ ...prev, ieltsScore: parseFloat(e.target.value) }))}
                        className="h-12 rounded-xl border-slate-200 font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">PTE Score</Label>
                      <Input 
                        type="number" 
                        value={formData.pteScore} 
                        onChange={(e) => setFormData(prev => ({ ...prev, pteScore: parseInt(e.target.value) }))}
                        className="h-12 rounded-xl border-slate-200 font-bold"
                      />
                    </div>
                 </div>

                 <div className="space-y-3 pt-4">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Education History (GPA, Degree, Institution)</Label>
                    <Textarea 
                      rows={4} 
                      value={formData.academicBackground}
                      onChange={(e) => setFormData(prev => ({ ...prev, academicBackground: e.target.value }))}
                      placeholder="e.g. Bachelor of IT from University of Dhaka, GPA 3.8/4.0"
                      className="rounded-2xl border-slate-200 p-4 font-medium"
                    />
                 </div>
               </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
               <CardHeader className="bg-slate-50/50 p-8 border-b">
                 <CardTitle className="text-2xl font-display">Goals & Preferences</CardTitle>
                 <CardDescription>Your career aspirations and financial constraints.</CardDescription>
               </CardHeader>
               <CardContent className="p-8 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Career Role</Label>
                      <Input 
                        placeholder="e.g. Software Engineer, Data Scientist"
                        value={formData.careerGoals.targetRole}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          careerGoals: { ...prev.careerGoals, targetRole: e.target.value } 
                        }))}
                        className="h-12 rounded-xl border-slate-200 font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Funding Source</Label>
                      <Select 
                        value={formData.careerGoals.fundingSource} 
                        onValueChange={(v) => setFormData(prev => ({ 
                          ...prev, 
                          careerGoals: { ...prev.careerGoals, fundingSource: v as any } 
                        }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                          <SelectValue placeholder="Select Funding" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="self">Self Funded</SelectItem>
                          <SelectItem value="family">Family Support</SelectItem>
                          <SelectItem value="loan">Bank Loan</SelectItem>
                          <SelectItem value="scholarship">Full Scholarship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                 </div>

                 <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-black text-slate-900 uppercase tracking-widest">Max Annual Budget (AUD)</Label>
                      <span className="text-lg font-black text-deep-green">${formData.budgetMaxAud.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" min="15000" max="80000" step="1000"
                      value={formData.budgetMaxAud}
                      onChange={(e) => setFormData(prev => ({ ...prev, budgetMaxAud: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-deep-green"
                    />
                 </div>

                 <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Interested in Permanent Residency (PR)?</Label>
                    <div className="flex gap-4">
                       <Button 
                         variant={formData.careerGoals.migrationInterest ? 'default' : 'outline'} 
                         className={cn("flex-1 rounded-xl h-12 font-bold", formData.careerGoals.migrationInterest && "bg-deep-green")}
                         onClick={() => setFormData(prev => ({ ...prev, careerGoals: { ...prev.careerGoals, migrationInterest: true } }))}
                       >Yes</Button>
                       <Button 
                         variant={!formData.careerGoals.migrationInterest ? 'default' : 'outline'} 
                         className={cn("flex-1 rounded-xl h-12 font-bold", !formData.careerGoals.migrationInterest && "bg-deep-green")}
                         onClick={() => setFormData(prev => ({ ...prev, careerGoals: { ...prev.careerGoals, migrationInterest: false } }))}
                       >No</Button>
                    </div>
                 </div>
               </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
               <CardHeader className="bg-slate-50/50 p-8 border-b">
                 <CardTitle className="text-2xl font-display">Recommendation Strategy</CardTitle>
                 <CardDescription>How should we weight different factors for your Fit Score?</CardDescription>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRESETS.map((preset) => (
                      <div 
                        key={preset.id}
                        onClick={() => setFormData(prev => ({ ...prev, priorityPreset: preset.id as any, priorityWeights: preset.weights }))}
                        className={cn(
                          "p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 hover:shadow-md",
                          formData.priorityPreset === preset.id ? "border-deep-green bg-green-50/50" : "border-slate-100 hover:border-slate-200"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", formData.priorityPreset === preset.id ? "bg-deep-green text-white" : "bg-slate-100 text-slate-400")}>
                           <preset.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{preset.label}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-1">{preset.description}</p>
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="bg-slate-900 text-white p-6 rounded-2xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4">Algorithm Weights</h4>
                    <div className="flex flex-wrap gap-4">
                       {Object.entries(formData.priorityWeights).map(([key, val]) => (
                         <div key={key} className="flex flex-col">
                            <span className="text-[9px] text-white/40 uppercase font-black">{key}</span>
                            <span className="text-sm font-black text-green-400">{val}%</span>
                         </div>
                       ))}
                    </div>
                 </div>
               </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
           <Button 
            variant="ghost" 
            disabled={currentStep === 0}
            onClick={handlePrev}
            className="rounded-xl h-12 px-6 font-bold text-slate-500"
           >
             <ChevronLeft className="h-4 w-4 mr-2" />
             Back
           </Button>

           <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="rounded-xl h-12 px-6 font-bold border-slate-200 hidden sm:flex"
                onClick={() => mutation.mutate(formData)}
                disabled={mutation.isPending}
              >
                Save Draft
              </Button>
              <Button 
                onClick={handleNext}
                disabled={mutation.isPending}
                className="rounded-xl h-12 px-8 font-black bg-deep-green hover:bg-deep-green/90 shadow-lg shadow-deep-green/10"
              >
                {currentStep === STEPS.length - 1 ? 'Finish & Analyze' : 'Next Step'}
                {currentStep < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
