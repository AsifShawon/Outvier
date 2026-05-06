import { ApplicationKanban } from '@/components/dashboard/ApplicationKanban';
import { Badge } from '@/components/ui/badge';
import { Layout, CheckCircle2, Info } from 'lucide-react';

export default function TrackerPage() {
  return (
    <div className="space-y-10 pb-20">
      <div className="relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Layout className="h-3 w-3" />
            <span>Student Dashboard</span>
            <span className="text-slate-200">/</span>
            <span className="text-primary">Application Tracker</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
                Application <span className="text-primary">Board</span>
              </h1>
              <p className="text-slate-500 max-w-xl text-lg font-medium">
                Manage your global study journey with a custom Kanban board. Track applications, documents, and tasks in one place.
              </p>
            </div>
            
            <div className="flex items-center gap-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategy</span>
                <span className="text-sm font-bold text-slate-900">Custom Workflow</span>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assistance</span>
                <span className="text-sm font-bold text-primary">Priority Mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <ApplicationKanban />
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-lg">
            <Badge className="bg-primary text-white border-none font-bold uppercase tracking-widest text-[10px]">Pro Tip</Badge>
            <h3 className="text-3xl font-black font-display leading-tight">Keep your documents ready</h3>
            <p className="text-slate-400 font-medium">
              Most universities in Australia require your Passport and Transcripts first. Use the checklist in each card to stay ahead of deadlines.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
             <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <span className="text-sm font-bold">Auto-check deadlines</span>
             </div>
             <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <Info className="h-6 w-6 text-blue-400" />
                <span className="text-sm font-bold">Visa requirement alerts</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
