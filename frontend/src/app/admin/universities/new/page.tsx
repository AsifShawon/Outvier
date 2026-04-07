'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { universitiesApi } from '@/lib/api/universities.api';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  location: z.string().min(2),
  state: z.string().min(2),
  website: z.string().url(),
  logo: z.string().optional(),
  establishedYear: z.any(),
  ranking: z.any(),
  type: z.enum(['public', 'private']),
  campuses: z.string().optional(),
  internationalStudents: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewUniversityPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'public' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      universitiesApi.create({
        name: data.name,
        description: data.description,
        location: data.location,
        state: data.state,
        website: data.website,
        logo: data.logo,
        establishedYear: data.establishedYear ? Number(data.establishedYear) : undefined,
        ranking: data.ranking ? Number(data.ranking) : undefined,
        type: data.type,
        campuses: data.campuses ? data.campuses.split(',').map((c) => c.trim()).filter(Boolean) : [],
        internationalStudents: data.internationalStudents,
      }),
    onSuccess: () => {
      toast.success('University created!');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.push('/admin/universities');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create university';
      toast.error(msg);
    },
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/universities">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-display">Add University</h1>
      </div>

      <form onSubmit={handleSubmit((data: any) => mutation.mutate(data))} className="space-y-5">
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Basic Information</h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="uni-name">University Name *</Label>
              <Input id="uni-name" {...register('name')} placeholder="e.g. University of Adelaide" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uni-desc">Description *</Label>
              <Textarea id="uni-desc" {...register('description')} placeholder="Brief description..." rows={3} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="uni-location">Location *</Label>
                <Input id="uni-location" {...register('location')} placeholder="Adelaide, SA" />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uni-state">State *</Label>
                <Input id="uni-state" {...register('state')} placeholder="SA" maxLength={10} />
                {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uni-website">Official Website *</Label>
              <Input id="uni-website" {...register('website')} placeholder="https://www.university.edu.au" />
              {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uni-logo">Logo URL</Label>
              <Input id="uni-logo" {...register('logo')} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="uni-type">Type *</Label>
              <Select value={watch('type')} onValueChange={(v) => setValue('type', v as 'public' | 'private')}>
                <SelectTrigger id="uni-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uni-year">Established Year</Label>
              <Input id="uni-year" type="number" {...register('establishedYear')} placeholder="1874" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uni-ranking">Ranking</Label>
              <Input id="uni-ranking" type="number" {...register('ranking')} placeholder="100" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uni-campuses">Campuses (comma separated)</Label>
            <Input id="uni-campuses" {...register('campuses')} placeholder="North Terrace, Mawson Lakes" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending} className="flex-1">
            {mutation.isPending ? 'Creating...' : 'Create University'}
          </Button>
          <Link href="/admin/universities">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
