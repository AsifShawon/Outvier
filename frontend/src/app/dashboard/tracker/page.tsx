'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackerApi } from '@/lib/api/tracker.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, 
  FileText, 
  Send, 
  CheckCircle, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin,
  GraduationCap
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const COLUMNS = [
  { id: 'researching', title: 'Researching', icon: Search, color: 'text-slate-500' },
  { id: 'preparing', title: 'Preparing', icon: FileText, color: 'text-amber-500' },
  { id: 'submitted', title: 'Submitted', icon: Send, color: 'text-primary-500' },
  { id: 'accepted', title: 'Accepted/Outcome', icon: CheckCircle, color: 'text-emerald-500' },
];

export default function ApplicationTrackerPage() {
  const qc = useQueryClient();
  const { data: appsRes, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => trackerApi.getApplications(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      trackerApi.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trackerApi.removeApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application removed');
    },
  });

  const applications = appsRes?.data?.data || [];

  if (isLoading) return <div className="p-8">Loading tracker...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Application Tracker</h1>
          <p className="text-muted-foreground mt-1">Manage your university applications across different stages.</p>
        </div>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Manual Application
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((app: any) => 
            col.id === 'accepted' 
              ? ['accepted', 'rejected', 'enrolled'].includes(app.status)
              : app.status === col.id
          );

          return (
            <div key={col.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <col.icon className={`h-4 w-4 ${col.color}`} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">{col.title}</h3>
                </div>
                <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-[10px]">
                  {colApps.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 min-h-[500px] p-2 rounded-2xl bg-muted/30 border border-dashed border-border/60">
                {colApps.map((app: any) => (
                  <Card key={app._id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-bold leading-tight line-clamp-2">
                            {app.programId?.name || 'Unknown Program'}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                            <MapPin className="h-3 w-3" />
                            {app.programId?.universityName || 'Unknown University'}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-7 w-7 -mr-2 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="text-xs" onClick={() => {}}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => {}}>
                              Edit Notes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-xs text-destructive focus:text-destructive" 
                              onClick={() => deleteMutation.mutate(app._id)}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter px-1.5 py-0">
                          {app.programId?.level || 'Degree'}
                        </Badge>
                        {app.deadline && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            {format(new Date(app.deadline), 'MMM d')}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2">
                         {COLUMNS.filter(c => c.id !== app.status && (app.status !== 'accepted' || c.id !== 'accepted')).map(c => (
                           <Button 
                             key={c.id}
                             variant="ghost" 
                             size="sm" 
                             className="h-7 text-[10px] font-bold px-2 py-0 bg-muted/50 hover:bg-primary/10 hover:text-primary"
                             onClick={() => updateMutation.mutate({ id: app._id, status: c.id })}
                           >
                             Move to {c.title.split('/')[0]}
                           </Button>
                         ))}
                         {app.status === 'submitted' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] font-bold px-2 py-0 bg-green-50 text-green-700 hover:bg-green-100"
                                onClick={() => updateMutation.mutate({ id: app._id, status: 'accepted' })}
                              >
                                Accepted
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] font-bold px-2 py-0 bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => updateMutation.mutate({ id: app._id, status: 'rejected' })}
                              >
                                Rejected
                              </Button>
                            </>
                         )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {colApps.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-40">
                    <col.icon className="h-8 w-8 mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
