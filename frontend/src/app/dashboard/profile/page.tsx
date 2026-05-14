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
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  GraduationCap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
}

const LEVELS = [
  { value: 'bachelor', label: 'Bachelor Degree' },
  { value: 'master', label: 'Master Degree' },
  { value: 'phd', label: 'PhD' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'graduate_certificate', label: 'Graduate Certificate' },
];

const STEPS = [
  { id: 'academic', title: 'Academic Profile', description: 'Education & Language', icon: GraduationCap },
  { id: 'goals', title: 'Future Goals', description: 'Career & Finance', icon: Target },
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
    }
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

  if (isLoadingProfile) return <div className="p-12 text-center text-sm font-medium text-slate-500">Loading your profile...</div>;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 pb-24">
      {/* Header & Stepper */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight">Profile Builder</h1>
        <p className="text-sm text-slate-500 mt-1">Keep your profile updated for better recommendations.</p>
        
        <div className="mt-8 flex items-center justify-center gap-12 relative">
           <div className="absolute top-1/2 left-[20%] right-[20%] h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
           {STEPS.map((step, i) => (
             <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setCurrentStep(i)}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  currentStep === i ? "bg-deep-green text-white shadow-md shadow-deep-green/20" : 
                  currentStep > i ? "bg-green-100 text-green-600" : "bg-white border border-slate-200 text-slate-300"
                )}>
                  {currentStep > i ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                <div className="text-center bg-background px-2">
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", currentStep === i ? "text-deep-green" : "text-slate-400")}>{step.title}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 0 && (
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
               <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                 <CardTitle className="text-xl font-bold text-slate-900">Academic Background</CardTitle>
                 <CardDescription className="text-sm">Your previous education and language skills.</CardDescription>
               </CardHeader>
               <CardContent className="p-6 space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Preferred Field</Label>
                      <Select 
                        value={formData.preferredField} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, preferredField: v }))}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-slate-200 font-medium">
                          <SelectValue placeholder="Select Field" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {fieldsRes?.data?.data?.map((f: string) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Study Level</Label>
                      <Select 
                        value={formData.preferredLevel} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, preferredLevel: v }))}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-slate-200 font-medium">
                          <SelectValue placeholder="Select Level" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {LEVELS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">IELTS Score</Label>
                      <Input 
                        type="number" step="0.5" 
                        value={formData.ieltsScore} 
                        onChange={(e) => setFormData(prev => ({ ...prev, ieltsScore: parseFloat(e.target.value) }))}
                        className="h-11 rounded-lg border-slate-200 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">PTE Score</Label>
                      <Input 
                        type="number" 
                        value={formData.pteScore} 
                        onChange={(e) => setFormData(prev => ({ ...prev, pteScore: parseInt(e.target.value) }))}
                        className="h-11 rounded-lg border-slate-200 font-medium"
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Education History (GPA, Degree, Institution)</Label>
                    <Textarea 
                      rows={3} 
                      value={formData.academicBackground}
                      onChange={(e) => setFormData(prev => ({ ...prev, academicBackground: e.target.value }))}
                      placeholder="e.g. Bachelor of IT from University of Dhaka, GPA 3.8/4.0"
                      className="rounded-lg border-slate-200 p-3 font-medium resize-none"
                    />
                 </div>
               </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
               <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                 <CardTitle className="text-xl font-bold text-slate-900">Goals & Preferences</CardTitle>
                 <CardDescription className="text-sm">Your career aspirations and financial constraints.</CardDescription>
               </CardHeader>
               <CardContent className="p-6 space-y-7">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target Career Role</Label>
                      <Input 
                        placeholder="e.g. Software Engineer, Data Scientist"
                        value={formData.careerGoals.targetRole}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          careerGoals: { ...prev.careerGoals, targetRole: e.target.value } 
                        }))}
                        className="h-11 rounded-lg border-slate-200 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Funding Source</Label>
                      <Select 
                        value={formData.careerGoals.fundingSource} 
                        onValueChange={(v) => setFormData(prev => ({ 
                          ...prev, 
                          careerGoals: { ...prev.careerGoals, fundingSource: v as any } 
                        }))}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-slate-200 font-medium">
                          <SelectValue placeholder="Select Funding" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="self">Self Funded</SelectItem>
                          <SelectItem value="family">Family Support</SelectItem>
                          <SelectItem value="loan">Bank Loan</SelectItem>
                          <SelectItem value="scholarship">Full Scholarship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                 </div>

                 <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Max Annual Budget (AUD)</Label>
                      <span className="text-lg font-black text-deep-green">${formData.budgetMaxAud.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" min="15000" max="80000" step="1000"
                      value={formData.budgetMaxAud}
                      onChange={(e) => setFormData(prev => ({ ...prev, budgetMaxAud: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-deep-green"
                    />
                 </div>

                 <div className="space-y-3">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Interested in Permanent Residency (PR)?</Label>
                    <div className="flex gap-3">
                       <Button 
                         variant={formData.careerGoals.migrationInterest ? 'default' : 'outline'} 
                         className={cn("flex-1 rounded-lg h-11 font-semibold", formData.careerGoals.migrationInterest && "bg-deep-green")}
                         onClick={() => setFormData(prev => ({ ...prev, careerGoals: { ...prev.careerGoals, migrationInterest: true } }))}
                       >Yes, interested</Button>
                       <Button 
                         variant={!formData.careerGoals.migrationInterest ? 'default' : 'outline'} 
                         className={cn("flex-1 rounded-lg h-11 font-semibold", !formData.careerGoals.migrationInterest && "bg-deep-green")}
                         onClick={() => setFormData(prev => ({ ...prev, careerGoals: { ...prev.careerGoals, migrationInterest: false } }))}
                       >No, just studying</Button>
                    </div>
                 </div>
               </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
        <div className="max-w-3xl mx-auto flex justify-between items-center px-2">
           <Button 
            variant="ghost" 
            disabled={currentStep === 0}
            onClick={handlePrev}
            className="rounded-lg h-10 px-4 font-semibold text-slate-600"
           >
             <ChevronLeft className="h-4 w-4 mr-1.5" />
             Back
           </Button>

           <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="rounded-lg h-10 px-5 font-semibold border-slate-200 hidden sm:flex"
                onClick={() => mutation.mutate(formData)}
                disabled={mutation.isPending}
              >
                Save Draft
              </Button>
              <Button 
                onClick={handleNext}
                disabled={mutation.isPending}
                className="rounded-lg h-10 px-6 font-bold bg-deep-green hover:bg-deep-green/90 shadow-sm"
              >
                {currentStep === STEPS.length - 1 ? 'Save Profile' : 'Continue'}
                {currentStep < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-1.5" />}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
