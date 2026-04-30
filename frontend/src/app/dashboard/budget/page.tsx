'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, DollarSign, Home, Coffee, Bus, ShieldCheck, Landmark, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/profile.api';

const LIVING_COSTS: Record<string, number> = {
  'NSW': 32000,
  'VIC': 30000,
  'QLD': 28000,
  'SA': 26000,
  'WA': 27000,
  'TAS': 25000,
  'ACT': 31000,
  'NT': 28000,
};

export default function BudgetCalculatorPage() {
  const { data: profileRes } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const profile = profileRes?.data?.data;

  const [tuition, setTuition] = useState<number>(35000);
  const [state, setState] = useState<string>('SA');
  const [accommodation, setAccommodation] = useState<string>('shared');
  const [lifestyle, setLifestyle] = useState<string>('moderate');
  const [ohsc, setOhsc] = useState<number>(650);

  useEffect(() => {
    if (profile?.budgetMaxAud) {
      setTuition(Math.min(profile.budgetMaxAud, 45000));
    }
    if (profile?.preferredStates?.length > 0) {
      setState(profile.preferredStates[0]);
    }
  }, [profile]);

  const livingBase = LIVING_COSTS[state] || 28000;
  
  const accModifier = accommodation === 'studio' ? 1.4 : accommodation === 'campus' ? 1.2 : 1.0;
  const lifeModifier = lifestyle === 'thrifty' ? 0.8 : lifestyle === 'premium' ? 1.5 : 1.0;
  
  const calculatedLiving = Math.round(livingBase * accModifier * lifeModifier);
  const total = tuition + calculatedLiving + ohsc;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Budget Calculator</h1>
        <p className="text-muted-foreground mt-1">Estimate your total cost of study in Australia per year.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Study Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Annual Tuition Fee (AUD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    className="pl-9" 
                    value={tuition} 
                    onChange={(e) => setTuition(Number(e.target.value))} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LIVING_COSTS).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Health Insurance (OSHC)</Label>
                  <Input 
                    type="number" 
                    value={ohsc} 
                    onChange={(e) => setOhsc(Number(e.target.value))} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Lifestyle Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Accommodation Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'shared', label: 'Shared House', icon: Home },
                    { id: 'campus', label: 'On-Campus', icon: GraduationCap },
                    { id: 'studio', label: 'Studio/Single', icon: Landmark },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAccommodation(item.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2 ${
                        accommodation === item.id 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border/50 bg-card hover:border-border'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Lifestyle Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'thrifty', label: 'Thrifty', icon: Bus },
                    { id: 'moderate', label: 'Moderate', icon: Coffee },
                    { id: 'premium', label: 'Premium', icon: ShieldCheck },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setLifestyle(item.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2 ${
                        lifestyle === item.id 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border/50 bg-card hover:border-border'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-blue-900 text-white shadow-xl overflow-hidden sticky top-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display opacity-80 uppercase tracking-widest">Yearly Estimate</CardTitle>
              <div className="text-5xl font-black font-display tracking-tighter">
                ${total.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center opacity-80">
                  <span>Tuition Fees</span>
                  <span className="font-mono font-bold">${tuition.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center opacity-80">
                  <span>Living Expenses</span>
                  <span className="font-mono font-bold">${calculatedLiving.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center opacity-80">
                  <span>Insurance & Other</span>
                  <span className="font-mono font-bold">${ohsc.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between items-center text-lg font-bold">
                  <span>Total (AUD)</span>
                  <span className="font-display">${total.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/10 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Info className="h-3 w-3" />
                  Monthly Breakdown
                </div>
                <div className="text-2xl font-black font-display">
                  ${Math.round(total / 12).toLocaleString()} <span className="text-xs font-normal opacity-60">/ month</span>
                </div>
              </div>

              <p className="text-[10px] opacity-60 leading-relaxed italic text-center">
                * Estimates are based on average costs and may vary significantly by city, lifestyle, and program type.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
