'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Skeleton } from '@/components/ui/skeleton';
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  location: z.string().min(2),
  state: z.string().min(2),
  website: z.string().url(),
  logo: z.string().optional(),
  establishedYear: z.coerce.number().int().min(1800).max(2030).optional().or(z.literal('')),
  ranking: z.coerce.number().int().min(1).optional().or(z.literal('')),
  type: z.enum(['public', 'private']),
  campuses: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditUniversityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['university-edit', id],
    queryFn: () => universitiesApi.getAll({ limit: 200 }),
    select: (res) => {
      const unis: University[] = res.data.universities;
      return unis.find((u) => u._id === id);
    },
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { type: 'public' },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        description: data.description,
        location: data.location,
        state: data.state,
        website: data.website,
        logo: data.logo || '',
        establishedYear: data.establishedYear || '',
        ranking: data.ranking || '',
        type: data.type,
        campuses: data.campuses?.join(', ') || '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      universitiesApi.update(id, {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        state: formData.state,
        website: formData.website,
        logo: formData.logo,
        establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
        ranking: formData.ranking ? Number(formData.ranking) : undefined,
        type: formData.type,
        campuses: formData.campuses ? formData.campuses.split(',').map((c) => c.trim()).filter(Boolean) : [],
      } as any),
    onSuccess: () => {
      toast.success('University updated!');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      router.push('/admin/universities');
    },
    onError: () => toast.error('Failed to update university'),
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
        <h1 className="text-2xl font-bold font-display">Edit University</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data as FormData))} className="space-y-5">
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Basic Information</h2>
            <div className="space-y-1.5">
              <Label>University Name *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea {...register('description')} rows={3} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Location *</Label>
                <Input {...register('location')} />
              </div>
              <div className="space-y-1.5">
                <Label>State *</Label>
                <Input {...register('state')} maxLength={10} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Official Website *</Label>
              <Input {...register('website')} />
            </div>
            <div className="space-y-1.5">
              <Label>Logo URL</Label>
              <Input {...register('logo')} />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={watch('type')} onValueChange={(v) => setValue('type', v as 'public' | 'private')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Established Year</Label>
                <Input type="number" {...register('establishedYear')} />
              </div>
              <div className="space-y-1.5">
                <Label>Ranking</Label>
                <Input type="number" {...register('ranking')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Campuses (comma separated)</Label>
              <Input {...register('campuses')} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/admin/universities">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
