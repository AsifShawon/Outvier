'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/profile.api';
import { UniversityCard } from '@/components/ui-custom/UniversityCard';
import { ProgramCard } from '@/components/ui-custom/ProgramCard';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookmarkX, GraduationCap, School } from 'lucide-react';
import Link from 'next/link';

export default function SavedItemsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('programs');

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const profile = profileRes?.data?.data;
  const savedPrograms = profile?.savedPrograms || [];
  const savedUniversities = profile?.savedUniversities || [];

  const unsaveMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'university' | 'program'; id: string }) => 
      type === 'university' ? profileApi.unsaveUniversity(id) : profileApi.unsaveProgram(id),
    onSuccess: () => {
      toast.success('Removed from saved items');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Failed to remove item'),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading saved items...</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Saved Items</h1>
        <p className="text-muted-foreground mt-1">Manage your shortlisted universities and programs.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="programs" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Programs ({savedPrograms.length})
            </TabsTrigger>
            <TabsTrigger value="universities" className="gap-2">
              <School className="h-4 w-4" />
              Universities ({savedUniversities.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="programs" className="mt-0">
          {savedPrograms.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                title="No saved programs" 
                description="Browse programs and click the bookmark icon to save them for later."
              />
              <div className="flex justify-center mt-6">
                <Link href="/programs">
                  <Button>Explore Programs</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedPrograms.map((program: any) => (
                <div key={program._id} className="group relative">
                  <ProgramCard program={program} />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => unsaveMutation.mutate({ type: 'program', id: program._id })}
                    disabled={unsaveMutation.isPending}
                  >
                    <BookmarkX className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="universities" className="mt-0">
          {savedUniversities.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                title="No saved universities" 
                description="Shortlist universities to compare them later."
              />
              <div className="flex justify-center mt-6">
                <Link href="/universities">
                  <Button>Explore Universities</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedUniversities.map((uni: any) => (
                <div key={uni._id} className="group relative">
                  <UniversityCard university={uni} />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => unsaveMutation.mutate({ type: 'university', id: uni._id })}
                    disabled={unsaveMutation.isPending}
                  >
                    <BookmarkX className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
