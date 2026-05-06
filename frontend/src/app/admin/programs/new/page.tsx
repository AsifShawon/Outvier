'use client';

import { useRouter } from 'next/navigation';
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
import { programsApi } from '@/lib/api/programs.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';

const schema = z.object({
  name: z.string().min(2),
  university: z.string().min(1),
  level: z.enum(['bachelor', 'master', 'phd', 'diploma', 'certificate', 'graduate_certificate']),
  field: z.string().min(2),
  description: z.string().min(10),
  duration: z.string().min(1),
  tuitionFeeLocal: z.coerce.number().optional().or(z.literal('')),
  tuitionFeeInternational: z.coerce.number().optional().or(z.literal('')),
  intakeMonths: z.string().optional(),
  englishRequirements: z.string().optional(),
  academicRequirements: z.string().optional(),
  careerPathways: z.string().optional(),
  campusMode: z.enum(['on-campus', 'online', 'hybrid']),
  website: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const PROGRAM_LEVELS = [
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'graduate_certificate', label: 'Graduate Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
];

export default function NewProgramPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: uniData } = useQuery({
    queryKey: ['all-universities'],
    queryFn: () => universitiesApi.adminGetAll({ limit: 100 }),
  });

  const universities: University[] = uniData?.data?.data || [];

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { level: 'bachelor', campusMode: 'on-campus' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      programsApi.create({
        name: data.name,
        university: data.university,
        level: data.level,
        field: data.field,
        description: data.description,
        duration: data.duration,
        tuitionFeeLocal: data.tuitionFeeLocal ? Number(data.tuitionFeeLocal) : undefined,
        tuitionFeeInternational: data.tuitionFeeInternational ? Number(data.tuitionFeeInternational) : undefined,
        intakeMonths: data.intakeMonths ? data.intakeMonths.split(',').map((m) => m.trim()).filter(Boolean) : [],
        englishRequirements: data.englishRequirements,
        academicRequirements: data.academicRequirements,
        careerPathways: data.careerPathways ? data.careerPathways.split(',').map((c) => c.trim()).filter(Boolean) : [],
        campusMode: data.campusMode,
        website: data.website || undefined,
      }),
    onSuccess: () => {
      toast.success('Program created!');
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.push('/admin/programs');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create program';
      toast.error(msg);
    },
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/programs">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-display">Add Program</h1>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data as FormData))} className="space-y-5">
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Program Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="prog-name">Program Name *</Label>
            <Input id="prog-name" {...register('name')} placeholder="Bachelor of Computer Science" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prog-uni">University *</Label>
            <Select value={watch('university')} onValueChange={(v) => setValue('university', v as string)}>
              <SelectTrigger id="prog-uni">
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                {universities.map((uni) => (
                  <SelectItem key={uni._id} value={uni._id}>{uni.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.university && <p className="text-xs text-destructive">{errors.university.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prog-level">Level *</Label>
              <Select value={watch('level')} onValueChange={(v) => setValue('level', v as FormData['level'])}>
                <SelectTrigger id="prog-level"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog-mode">Campus Mode *</Label>
              <Select value={watch('campusMode')} onValueChange={(v) => setValue('campusMode', v as FormData['campusMode'])}>
                <SelectTrigger id="prog-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-campus">On Campus</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prog-field">Field of Study *</Label>
              <Input id="prog-field" {...register('field')} placeholder="Information Technology" />
              {errors.field && <p className="text-xs text-destructive">{errors.field.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog-duration">Duration *</Label>
              <Input id="prog-duration" {...register('duration')} placeholder="3 years full-time" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prog-desc">Description *</Label>
            <Textarea id="prog-desc" {...register('description')} rows={3} placeholder="Brief program overview..." />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Fees &amp; Intake</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prog-fee-local">Domestic Fee (AUD/yr)</Label>
              <Input id="prog-fee-local" type="number" {...register('tuitionFeeLocal')} placeholder="12500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog-fee-intl">International Fee (AUD/yr)</Label>
              <Input id="prog-fee-intl" type="number" {...register('tuitionFeeInternational')} placeholder="38000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-intake">Intake Months (comma separated)</Label>
            <Input id="prog-intake" {...register('intakeMonths')} placeholder="February, July, November" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-website">Program Website</Label>
            <Input id="prog-website" {...register('website')} placeholder="https://..." />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Requirements &amp; Careers</h2>
          <div className="space-y-1.5">
            <Label htmlFor="prog-academic">Academic Requirements</Label>
            <Input id="prog-academic" {...register('academicRequirements')} placeholder="ATAR 80 or equivalent" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-english">English Requirements</Label>
            <Input id="prog-english" {...register('englishRequirements')} placeholder="IELTS 6.5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-careers">Career Pathways (comma separated)</Label>
            <Input id="prog-careers" {...register('careerPathways')} placeholder="Software Engineer, Data Scientist" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending} className="flex-1">
            {mutation.isPending ? 'Creating...' : 'Create Program'}
          </Button>
          <Link href="/admin/programs">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
