'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  applicationTrackerApi, 
  ApplicationTracker 
} from '@/lib/api/applicationTracker.api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  MoreHorizontal, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Trash2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMNS = [
  { id: 'shortlisted', title: 'Shortlisted', color: 'bg-slate-100 border-slate-200' },
  { id: 'preparing_documents', title: 'Preparing', color: 'bg-blue-50 border-blue-100' },
  { id: 'applied', title: 'Applied', color: 'bg-amber-50 border-amber-100' },
  { id: 'visa_process', title: 'Visa Process', color: 'bg-purple-50 border-purple-100' },
  { id: 'enrolled', title: 'Enrolled', color: 'bg-green-50 border-green-100' },
];

export function ApplicationKanban() {
  const qc = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<ApplicationTracker | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['application-tracker'],
    queryFn: () => applicationTrackerApi.getAll(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      applicationTrackerApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-tracker'] });
      toast.success('Status updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationTrackerApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-tracker'] });
      toast.success('Application removed');
      setSelectedApp(null);
    }
  });

  const apps = data?.data?.data || [];

  const handleMove = (id: string, currentStatus: string, direction: 'next' | 'prev') => {
    const currentIndex = COLUMNS.findIndex(c => c.id === currentStatus);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
      updateStatusMutation.mutate({ id, status: COLUMNS[nextIndex].id });
    }
  };

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {COLUMNS.map(c => <div key={c.id} className="h-64 bg-slate-50 rounded-2xl animate-pulse" />)}
    </div>;
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-6 min-w-[1200px]">
        {COLUMNS.map((column) => {
          const columnApps = apps.filter(app => app.status === column.id);
          
          return (
            <div key={column.id} className="w-80 shrink-0 flex flex-col gap-4">
              <div className={`p-4 rounded-2xl border ${column.color} flex items-center justify-between`}>
                <h3 className="font-bold text-sm text-slate-900">{column.title}</h3>
                <Badge variant="secondary" className="bg-white text-slate-600 border-none font-bold">
                  {columnApps.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-4 min-h-[400px]">
                <AnimatePresence mode="popLayout">
                  {columnApps.map((app) => (
                    <motion.div
                      key={app._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card 
                        className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-deep-green transition-all cursor-pointer group bg-white overflow-hidden"
                        onClick={() => setSelectedApp(app)}
                      >
                        <CardContent className="p-4 space-y-4">
                          <div className="flex justify-between items-start gap-2">
                             <Badge 
                               variant="outline" 
                               className={`text-[9px] uppercase font-bold py-0 h-4 ${
                                 app.priority === 'high' ? 'text-red-500 border-red-100 bg-red-50' : 
                                 app.priority === 'medium' ? 'text-amber-500 border-amber-100 bg-amber-50' : 
                                 'text-slate-400 border-slate-100 bg-slate-50'
                               }`}
                             >
                               {app.priority}
                             </Badge>
                             <div className="flex items-center gap-1">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-6 w-6 rounded-md"
                                 onClick={(e) => { e.stopPropagation(); handleMove(app._id, app.status, 'prev'); }}
                                 disabled={column.id === COLUMNS[0].id}
                               >
                                 <ChevronLeft className="h-3 w-3" />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-6 w-6 rounded-md"
                                 onClick={(e) => { e.stopPropagation(); handleMove(app._id, app.status, 'next'); }}
                                 disabled={column.id === COLUMNS[COLUMNS.length - 1].id}
                               >
                                 <ChevronRight className="h-3 w-3" />
                               </Button>
                             </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">{app.programName}</h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-1">{app.universityName}</p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-3">
                               <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                 <FileText className="h-3 w-3" />
                                 {app.documentChecklist?.filter(d => d.status === 'verified').length}/{app.documentChecklist?.length}
                               </div>
                               <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                 <Clock className="h-3 w-3" />
                                 {app.intake || '—'}
                               </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {columnApps.length === 0 && (
                  <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* App Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedApp && (
            <div className="flex flex-col">
              <div className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-green-500 text-slate-900 border-none font-black uppercase text-[10px]">
                    {selectedApp.status.replace('_', ' ')}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white/40 hover:text-white hover:bg-white/10"
                    onClick={() => deleteMutation.mutate(selectedApp._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </div>
                <h2 className="text-2xl font-black font-display leading-tight">{selectedApp.programName}</h2>
                <p className="text-white/60 font-bold mt-2">{selectedApp.universityName}</p>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Document Checklist</h3>
                    <div className="space-y-3">
                      {selectedApp.documentChecklist?.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{doc.name}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] font-bold ${
                              doc.status === 'verified' ? 'bg-green-100 text-green-700 border-none' : 
                              doc.status === 'uploaded' ? 'bg-blue-100 text-blue-700 border-none' : 
                              'text-slate-400 border-slate-200'
                            }`}
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Application Timeline</h3>
                    <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      {selectedApp.history?.slice().reverse().map((h, i) => (
                        <div key={i} className="relative pl-8">
                          <div className="absolute left-1.5 top-1.5 w-2 h-2 rounded-full bg-deep-green" />
                          <p className="text-xs font-bold text-slate-900 capitalize">{h.status.replace('_', ' ')}</p>
                          <p className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(h.changedAt), { addSuffix: true })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-cream-50 border border-cream-100">
                    <p className="text-[10px] font-black text-deep-green uppercase mb-2">Deadlines</p>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-bold">{selectedApp.deadline ? new Date(selectedApp.deadline).toLocaleDateString() : 'No deadline set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
