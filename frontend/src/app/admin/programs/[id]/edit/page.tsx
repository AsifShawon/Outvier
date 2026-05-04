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
import { programsApi } from '@/lib/api/programs.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';
import { Program } from '@/types/program';

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

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();

  const { data: uniData } = useQuery({
    queryKey: ['all-universities'],
    queryFn: () => universitiesApi.getAll({ limit: 100 }),
  });

  const { data: programsData, isLoading } = useQuery({
    queryKey: ['admin-programs-edit', id],
    queryFn: () => programsApi.getAll({ limit: 200 }),
    select: (res) => {
      const progs: Program[] = res.data.programs;
      return progs.find((p) => p._id === id);
    },
  });

  const universities: University[] = uniData?.data?.universities || [];
  const program = programsData;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { level: 'bachelor', campusMode: 'on-campus' },
  });

  useEffect(() => {
    if (program) {
      reset({
        name: program.name,
        university: program.university,
        level: program.level,
        field: program.field,
        description: program.description,
        duration: program.duration,
        tuitionFeeLocal: program.tuitionFeeLocal || '',
        tuitionFeeInternational: program.tuitionFeeInternational || '',
        intakeMonths: program.intakeMonths?.join(', ') || '',
        englishRequirements: program.englishRequirements || '',
        academicRequirements: program.academicRequirements || '',
        careerPathways: program.careerPathways?.join(', ') || '',
        campusMode: program.campusMode,
        website: program.website || '',
      });
    }
  }, [program, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      programsApi.update(id, {
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
      toast.success('Program updated!');
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      router.push('/admin/programs');
    },
    onError: () => toast.error('Failed to update program'),
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
        <h1 className="text-2xl font-bold font-display">Edit Program</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data as FormData))} className="space-y-5">
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Program Details</h2>
            <div className="space-y-1.5">
              <Label>Program Name *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>University *</Label>
              <Select value={watch('university')} onValueChange={(v) => setValue('university', v as string)}>
                <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni._id} value={uni._id}>{uni.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Level *</Label>
                <Select value={watch('level')} onValueChange={(v) => setValue('level', v as FormData['level'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROGRAM_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Campus Mode *</Label>
                <Select value={watch('campusMode')} onValueChange={(v) => setValue('campusMode', v as FormData['campusMode'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Label>Field *</Label>
                <Input {...register('field')} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration *</Label>
                <Input {...register('duration')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea {...register('description')} rows={3} />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Fees &amp; Intake</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Domestic Fee (AUD/yr)</Label>
                <Input type="number" {...register('tuitionFeeLocal')} />
              </div>
              <div className="space-y-1.5">
                <Label>International Fee (AUD/yr)</Label>
                <Input type="number" {...register('tuitionFeeInternational')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Intake Months</Label>
              <Input {...register('intakeMonths')} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input {...register('website')} />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Requirements &amp; Careers</h2>
            <div className="space-y-1.5">
              <Label>Academic Requirements</Label>
              <Input {...register('academicRequirements')} />
            </div>
            <div className="space-y-1.5">
              <Label>English Requirements</Label>
              <Input {...register('englishRequirements')} />
            </div>
            <div className="space-y-1.5">
              <Label>Career Pathways</Label>
              <Input {...register('careerPathways')} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/admin/programs">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
