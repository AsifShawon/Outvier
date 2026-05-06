'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetPlanApi, BudgetPlan } from '@/lib/api/budgetPlan.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  CircleDollarSign,
  Info,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = ['#5A7863', '#90AB8B', '#B8C9A3', '#3B4953'];

export function BudgetCalculator() {
  const qc = useQueryClient();
  const [activePlan, setActivePlan] = useState<Partial<BudgetPlan>>({
    name: 'My Master Budget',
    tuitionFeesAud: 35000,
    livingExpensesAud: 22000,
    scholarshipAud: 5000,
    partTimeIncomeAud: 12000,
    savingsAud: 20000,
    durationYears: 2,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['budget-plans'],
    queryFn: () => budgetPlanApi.getAll(),
  });

  useEffect(() => {
    if (data?.data?.data?.[0]) {
      setActivePlan(data.data.data[0]);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (plan: any) => 
      plan._id ? budgetPlanApi.update(plan._id, plan) : budgetPlanApi.create(plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-plans'] });
      toast.success('Budget plan saved');
    }
  });

  const totalCost = (activePlan.tuitionFeesAud || 0) + (activePlan.livingExpensesAud || 0);
  const totalIncome = (activePlan.scholarshipAud || 0) + (activePlan.partTimeIncomeAud || 0) + (activePlan.savingsAud || 0);
  const netGap = totalCost - totalIncome;
  const isSurplus = netGap <= 0;

  const chartData = [
    { name: 'Tuition', value: activePlan.tuitionFeesAud },
    { name: 'Living', value: activePlan.livingExpensesAud },
  ];

  const incomeData = [
    { name: 'Scholarship', value: activePlan.scholarshipAud },
    { name: 'Work', value: activePlan.partTimeIncomeAud },
    { name: 'Savings', value: activePlan.savingsAud },
  ];

  const handleInputChange = (field: keyof BudgetPlan, value: any) => {
    setActivePlan(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-6">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display">Plan Inputs</CardTitle>
            <CardDescription>Adjust your estimated costs and funding sources.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Annual Expenses (AUD)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-700">Tuition Fees / year</Label>
                  <div className="flex gap-4 items-center">
                    <Input 
                      type="number" 
                      value={activePlan.tuitionFeesAud} 
                      onChange={(e) => handleInputChange('tuitionFeesAud', parseInt(e.target.value))}
                      className="rounded-xl h-11 font-bold"
                    />
                  </div>
                  <Slider 
                    value={[activePlan.tuitionFeesAud || 0]} 
                    max={100000} 
                    step={1000} 
                    onValueChange={([v]) => handleInputChange('tuitionFeesAud', v)}
                    className="py-4"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-700">Living Expenses / year</Label>
                  <Input 
                    type="number" 
                    value={activePlan.livingExpensesAud} 
                    onChange={(e) => handleInputChange('livingExpensesAud', parseInt(e.target.value))}
                    className="rounded-xl h-11 font-bold"
                  />
                  <Slider 
                    value={[activePlan.livingExpensesAud || 0]} 
                    max={50000} 
                    step={500} 
                    onValueChange={([v]) => handleInputChange('livingExpensesAud', v)}
                    className="py-4"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Annual Funding & Support (AUD)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Scholarships</Label>
                  <Input 
                    type="number" 
                    value={activePlan.scholarshipAud} 
                    onChange={(e) => handleInputChange('scholarshipAud', parseInt(e.target.value))}
                    className="rounded-xl h-10 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Part-time Work</Label>
                  <Input 
                    type="number" 
                    value={activePlan.partTimeIncomeAud} 
                    onChange={(e) => handleInputChange('partTimeIncomeAud', parseInt(e.target.value))}
                    className="rounded-xl h-10 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Personal Savings</Label>
                  <Input 
                    type="number" 
                    value={activePlan.savingsAud} 
                    onChange={(e) => handleInputChange('savingsAud', parseInt(e.target.value))}
                    className="rounded-xl h-10 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-3">
               <Button variant="outline" className="rounded-xl px-6 font-bold border-slate-200">Reset</Button>
               <Button 
                className="rounded-xl px-8 font-black bg-deep-green hover:bg-deep-green/90 shadow-lg shadow-deep-green/10"
                onClick={() => saveMutation.mutate(activePlan)}
               >
                 <Save className="h-4 w-4 mr-2" />
                 Save Plan
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5 space-y-6">
        {/* Summary Card */}
        <Card className={`rounded-3xl border-none shadow-xl overflow-hidden text-white relative ${isSurplus ? 'bg-deep-green' : 'bg-slate-900'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <CircleDollarSign className="h-32 w-32" />
          </div>
          <CardContent className="p-8 relative z-10 space-y-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Net Financial Position</p>
              <h2 className="text-4xl font-black font-display">
                {isSurplus ? '+' : ''}${Math.abs(netGap).toLocaleString()}
                <span className="text-sm font-normal text-white/60 ml-2">AUD / year</span>
              </h2>
              <Badge className={`mt-4 border-none font-bold ${isSurplus ? 'bg-white text-deep-green' : 'bg-red-500 text-white'}`}>
                {isSurplus ? 'FULLY FUNDED' : 'FUNDING GAP DETECTED'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Total Expenses</p>
                <p className="text-xl font-bold">${totalCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Total Funding</p>
                <p className="text-xl font-bold">${totalIncome.toLocaleString()}</p>
              </div>
            </div>

            {!isSurplus && (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 flex gap-3 items-start">
                <Info className="h-5 w-5 text-amber-400 shrink-0" />
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  You have an annual gap of ${netGap.toLocaleString()}. Consider applying for more scholarships or increasing your savings target.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visual Breakdown */}
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-0">
             <CardTitle className="text-lg font-display">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
               {chartData.map((item, i) => (
                 <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                       <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">${item.value?.toLocaleString()}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
