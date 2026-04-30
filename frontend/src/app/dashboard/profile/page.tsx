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
import { InfoIcon, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

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
  priorityWeights: IPriorityWeights;
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

export default function ProfilePage() {
  const qc = useQueryClient();
  const [formData, setFormData] = useState<ProfileFormData>({
    preferredField: '',
    preferredLevel: 'master',
    budgetMaxAud: 40000,
    preferredStates: [],
    ieltsScore: 6.5,
    pteScore: 65,
    academicBackground: '',
    priorityWeights: {
      affordability: 30,
      ranking: 20,
      employability: 20,
      admissionMatch: 15,
      location: 10,
      scholarship: 5,
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
      setFormData({
        preferredField: p.preferredField || '',
        preferredLevel: p.preferredLevel || 'master',
        budgetMaxAud: p.budgetMaxAud || 40000,
        preferredStates: p.preferredStates || [],
        ieltsScore: p.ieltsScore || 6.5,
        pteScore: p.pteScore || 65,
        academicBackground: p.academicBackground || '',
        priorityWeights: p.priorityWeights || {
          affordability: 30,
          ranking: 20,
          employability: 20,
          admissionMatch: 15,
          location: 10,
          scholarship: 5,
        },
      });
    }
  }, [profileRes]);

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) => profileApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleWeightChange = (key: keyof IPriorityWeights, value: number) => {
    const otherKeys = (Object.keys(formData.priorityWeights) as Array<keyof IPriorityWeights>).filter(k => k !== key);
    const remainingValue = 100 - value;
    const currentOtherSum = otherKeys.reduce((sum, k) => sum + formData.priorityWeights[k], 0);

    const newWeights = { ...formData.priorityWeights, [key]: value };

    if (currentOtherSum === 0) {
      const equalShare = remainingValue / otherKeys.length;
      otherKeys.forEach(k => { newWeights[k] = Math.round(equalShare); });
    } else {
      otherKeys.forEach(k => {
        newWeights[k] = Math.round((formData.priorityWeights[k] / currentOtherSum) * remainingValue);
      });
    }

    // Adjust for rounding errors
    let total = Object.values(newWeights).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      const diff = 100 - total;
      newWeights[otherKeys[0]] += diff;
    }

    setFormData(prev => ({ ...prev, priorityWeights: newWeights }));
  };

  const totalWeight = Object.values(formData.priorityWeights).reduce((a, b) => a + b, 0);

  if (isLoadingProfile) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
        <p className="text-muted-foreground mt-1">Complete your profile to get more accurate fit scores for programs.</p>
      </div>

      <div className="grid gap-8">
        {/* Education & Preferences */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-xl">Academic Preferences</CardTitle>
            <CardDescription>Tell us about your background and what you're looking for.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="preferredField">Preferred Field of Study</Label>
                <Select 
                  value={formData.preferredField} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, preferredField: v }))}
                >
                  <SelectTrigger id="preferredField">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldsRes?.data?.data?.map((f: string) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLevel">Study Level</Label>
                <Select 
                  value={formData.preferredLevel} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, preferredLevel: v }))}
                >
                  <SelectTrigger id="preferredLevel">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Maximum Annual Budget (AUD)</Label>
                <span className="font-bold text-primary font-mono">${formData.budgetMaxAud.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="10000" 
                max="100000" 
                step="5000" 
                value={formData.budgetMaxAud}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetMaxAud: parseInt(e.target.value) }))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>$10k</span>
                <span>$100k</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Preferred Australian States</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATES.map((state) => (
                  <label key={state} className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.preferredStates.includes(state)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...formData.preferredStates, state]
                          : formData.preferredStates.filter(s => s !== state);
                        setFormData(prev => ({ ...prev, preferredStates: next }));
                      }}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{state}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ieltsScore">IELTS Score</Label>
                <Input 
                  id="ieltsScore" 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="9" 
                  value={formData.ieltsScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, ieltsScore: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pteScore">PTE Score</Label>
                <Input 
                  id="pteScore" 
                  type="number" 
                  min="0" 
                  max="90" 
                  value={formData.pteScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, pteScore: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicBackground">Academic Background / Bio</Label>
              <Textarea 
                id="academicBackground" 
                rows={4} 
                placeholder="Tell us about your previous education, GPA, and career goals..."
                value={formData.academicBackground}
                onChange={(e) => setFormData(prev => ({ ...prev, academicBackground: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Priority Weights */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Priority Weights</CardTitle>
                <CardDescription>Adjust how much each factor influences your fit score.</CardDescription>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${totalWeight === 100 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                Total: {totalWeight}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-4 flex gap-3 items-start">
              <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700/80">
                Weights must sum to 100%. As you adjust one slider, the others will automatically redistribute to maintain the balance.
              </p>
            </div>

            <div className="space-y-8 py-4">
              {Object.entries(formData.priorityWeights).map(([key, value]) => (
                <div key={key} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="capitalize font-semibold text-foreground/80">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <span className="font-bold text-primary font-mono">{value}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={value}
                    onChange={(e) => handleWeightChange(key as keyof IPriorityWeights, parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={() => qc.invalidateQueries({ queryKey: ['profile'] })}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Changes
          </Button>
          <Button 
            onClick={() => mutation.mutate(formData)} 
            disabled={mutation.isPending || totalWeight !== 100}
            className="gap-2 px-8"
          >
            {mutation.isPending ? 'Saving...' : (
              <>
                <Save className="h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
