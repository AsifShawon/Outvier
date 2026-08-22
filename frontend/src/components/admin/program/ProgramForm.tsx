'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  FormSection,
  FormField,
  FormSummary,
  DraftStatus,
  StickyFormActions,
  UnsavedChangesDialog,
} from '@/components/forms';

import { programsApi } from '@/lib/api/programs.api';
import { universitiesApi } from '@/lib/api/universities.api';
import {
  programFormSchema,
  programFormDefaults,
  PROGRAM_LEVELS,
  CAMPUS_MODES,
  type ProgramFormInput,
  type ProgramFormOutput,
} from '@/lib/schemas/program.schema';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useAutosave } from '@/hooks/useAutosave';
import { useServerErrors } from '@/hooks/useServerErrors';
import {
  useUnsavedChanges,
  type UseUnsavedChangesReturnExtended,
} from '@/hooks/useUnsavedChanges';
import { University } from '@/types/university';
import { Program } from '@/types/program';

// ---------------------------------------------------------------------------
// Field labels for FormSummary
// ---------------------------------------------------------------------------
const FIELD_LABELS: Record<string, string> = {
  name: 'Program Name',
  field: 'Field of Study',
  description: 'Description',
  status: 'Status',
  university: 'University',
  level: 'Level',
  campusMode: 'Campus Mode',
  duration: 'Duration',
  cricosCourseCode: 'CRICOS Course Code',
  tuitionFeeLocal: 'Domestic Fee',
  tuitionFeeInternational: 'International Fee',
  intakeMonths: 'Intake Months',
  academicRequirements: 'Academic Requirements',
  englishRequirements: 'English Requirements',
  website: 'Program Website',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export type ProgramFormMode = 'create' | 'edit';

interface ProgramFormProps {
  mode: ProgramFormMode;
  defaultData?: Program;
  programId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProgramForm({ mode, defaultData, programId }: ProgramFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const draftKey =
    mode === 'create'
      ? 'program-new'
      : `program-edit:${programId ?? ''}`;

  // -------------------------------------------------------------------------
  // Universities list for the selector
  // -------------------------------------------------------------------------
  const { data: uniData } = useQuery({
    queryKey: ['all-universities-select'],
    queryFn: () => universitiesApi.adminGetAll({ limit: 200 }),
  });
  const universities: University[] = uniData?.data?.data ?? [];

  // -------------------------------------------------------------------------
  // RHF setup
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<ProgramFormInput, any, ProgramFormOutput>({
    resolver: zodResolver(programFormSchema) as any,
    defaultValues: programFormDefaults,
    mode: 'onTouched',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  // -------------------------------------------------------------------------
  // Draft + autosave
  // -------------------------------------------------------------------------
  // Cast away the transform type param (TFieldValues) for hook compatibility
  const methodsForHooks = methods as unknown as import('react-hook-form').UseFormReturn<ProgramFormInput>;
  const draft = useFormDraft(draftKey, methodsForHooks);
  const autosave = useAutosave(methodsForHooks, {
    key: draftKey,
    delay: 1500,
    enabled: true,
    saveDraft: draft.saveDraft,
  });

  // -------------------------------------------------------------------------
  // Server errors + unsaved changes
  // -------------------------------------------------------------------------
  const mapServerErrors = useServerErrors(methodsForHooks);
  const unsaved = useUnsavedChanges(methodsForHooks) as UseUnsavedChangesReturnExtended;

  // -------------------------------------------------------------------------
  // Populate form from server data (edit mode)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (defaultData) {
      reset({
        name: defaultData.name ?? '',
        field: defaultData.field ?? '',
        description: defaultData.description ?? '',
        status: (defaultData.status as ProgramFormInput['status']) ?? 'draft',
        university: defaultData.university ?? '',
        level: defaultData.level ?? 'bachelor',
        campusMode: defaultData.campusMode ?? 'on-campus',
        duration: defaultData.duration ?? '',
        cricosCourseCode: defaultData.cricosCourseCode ?? '',
        cricosProviderCode: defaultData.cricosProviderCode ?? '',
        courseLevel: defaultData.courseLevel ?? '',
        expired: defaultData.expired ?? false,
        courseLanguage: defaultData.courseLanguage ?? '',
        workComponent: defaultData.workComponent ?? '',
        workComponentHoursPerWeek: defaultData.workComponentHoursPerWeek
          ? String(defaultData.workComponentHoursPerWeek)
          : '',
        vetNationalCode: defaultData.vetNationalCode ?? '',
        tuitionFeeLocal: defaultData.tuitionFeeLocal
          ? String(defaultData.tuitionFeeLocal)
          : '',
        tuitionFeeInternational: defaultData.tuitionFeeInternational
          ? String(defaultData.tuitionFeeInternational)
          : '',
        tuitionFeeAud: defaultData.tuitionFeeAud
          ? String(defaultData.tuitionFeeAud)
          : '',
        nonTuitionFeeAud: defaultData.nonTuitionFeeAud
          ? String(defaultData.nonTuitionFeeAud)
          : '',
        estimatedTotalCourseCostAud: defaultData.estimatedTotalCourseCostAud
          ? String(defaultData.estimatedTotalCourseCostAud)
          : '',
        intakeMonths: defaultData.intakeMonths?.join(', ') ?? '',
        durationWeeks: defaultData.durationWeeks
          ? String(defaultData.durationWeeks)
          : '',
        academicRequirements: defaultData.academicRequirements ?? '',
        minimumGPA: defaultData.dataQuality?.confidence
          ? String(defaultData.dataQuality.confidence)
          : '',
        dualQualification: defaultData.dualQualification ?? false,
        foundationStudies: defaultData.foundationStudies ?? false,
        englishRequirements: defaultData.englishRequirements ?? '',
        sourceName: defaultData.dataQuality?.sourceName ?? '',
        sourceResourceId: defaultData.dataQuality?.sourceResourceId ?? '',
        importMethod: defaultData.dataQuality?.importMethod ?? '',
        confidence: defaultData.dataQuality?.confidence
          ? String(defaultData.dataQuality.confidence)
          : '',
        careerPathways: defaultData.careerPathways?.join(', ') ?? '',
        website: defaultData.website ?? '',
      });
    }
  }, [defaultData, reset]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (output: ProgramFormOutput) =>
      programsApi.create({
        name: output.name,
        university: output.university,
        level: output.level,
        field: output.field,
        description: output.description,
        duration: output.duration,
        tuitionFeeLocal: output.tuitionFeeLocal,
        tuitionFeeInternational: output.tuitionFeeInternational,
        intakeMonths: output.intakeMonths,
        englishRequirements: output.englishRequirements,
        academicRequirements: output.academicRequirements,
        careerPathways: output.careerPathways,
        campusMode: output.campusMode,
        website: output.website || undefined,
      }),
    onSuccess: () => {
      toast.success('Program created successfully!');
      draft.clearDraft();
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.push('/admin/programs');
    },
    onError: (err) => {
      mapServerErrors(err);
      toast.error('Failed to create program. Please check the form.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (output: ProgramFormOutput) =>
      programsApi.update(programId!, {
        name: output.name,
        university: output.university,
        level: output.level,
        field: output.field,
        description: output.description,
        duration: output.duration,
        tuitionFeeLocal: output.tuitionFeeLocal,
        tuitionFeeInternational: output.tuitionFeeInternational,
        intakeMonths: output.intakeMonths,
        englishRequirements: output.englishRequirements,
        academicRequirements: output.academicRequirements,
        careerPathways: output.careerPathways,
        campusMode: output.campusMode,
        website: output.website || undefined,
      }),
    onSuccess: (res) => {
      toast.success('Program updated!');
      draft.clearDraft();
      // Preserve server-returned canonical values
      const saved = res.data.data;
      if (saved) {
        reset({
          name: saved.name ?? '',
          field: saved.field ?? '',
          description: saved.description ?? '',
          status: (saved.status as ProgramFormInput['status']) ?? 'draft',
          university: saved.university ?? '',
          level: saved.level ?? 'bachelor',
          campusMode: saved.campusMode ?? 'on-campus',
          duration: saved.duration ?? '',
          cricosCourseCode: saved.cricosCourseCode ?? '',
          cricosProviderCode: saved.cricosProviderCode ?? '',
          courseLevel: saved.courseLevel ?? '',
          expired: saved.expired ?? false,
          courseLanguage: saved.courseLanguage ?? '',
          workComponent: saved.workComponent ?? '',
          workComponentHoursPerWeek: '',
          vetNationalCode: saved.vetNationalCode ?? '',
          tuitionFeeLocal: saved.tuitionFeeLocal ? String(saved.tuitionFeeLocal) : '',
          tuitionFeeInternational: saved.tuitionFeeInternational
            ? String(saved.tuitionFeeInternational)
            : '',
          tuitionFeeAud: '',
          nonTuitionFeeAud: '',
          estimatedTotalCourseCostAud: '',
          intakeMonths: saved.intakeMonths?.join(', ') ?? '',
          durationWeeks: '',
          academicRequirements: saved.academicRequirements ?? '',
          minimumGPA: '',
          dualQualification: saved.dualQualification ?? false,
          foundationStudies: saved.foundationStudies ?? false,
          englishRequirements: saved.englishRequirements ?? '',
          sourceName: '',
          sourceResourceId: '',
          importMethod: '',
          confidence: '',
          careerPathways: saved.careerPathways?.join(', ') ?? '',
          website: saved.website ?? '',
        });
      }
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      router.push('/admin/programs');
    },
    onError: (err) => {
      mapServerErrors(err);
      toast.error('Failed to update program. Please check the form.');
    },
  });

  const summaryMutation = useMutation({
    mutationFn: () =>
      programsApi.update(programId!, { generateSummary: true } as never),
    onSuccess: () => {
      toast.success('AI Summary generation queued!');
      router.push('/admin/staged-changes');
    },
  });

  const isPending =
    createMutation.isPending || updateMutation.isPending || isSubmitting;

  // -------------------------------------------------------------------------
  // Submit handlers
  // -------------------------------------------------------------------------
  const onSubmit = (output: ProgramFormOutput) => {
    if (mode === 'create') createMutation.mutate(output);
    else updateMutation.mutate(output);
  };

  const onInvalid = () => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const el = document.querySelector<HTMLElement>(`[name="${firstError}"]`);
      el?.focus();
    }
  };

  const guardedBack = () =>
    unsaved.guardNavigate(() => router.push('/admin/programs'));

  // -------------------------------------------------------------------------
  // Watched values for controlled fields
  // -------------------------------------------------------------------------
  const levelValue = watch('level');
  const campusModeValue = watch('campusMode');
  const statusValue = watch('status');
  const universityValue = watch('university');
  const cricosCourseCode = watch('cricosCourseCode');
  const dualQualification = watch('dualQualification');
  const foundationStudies = watch('foundationStudies');
  const expired = watch('expired');

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <FormProvider {...methods}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={guardedBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold font-display">
            {mode === 'create' ? 'Add Program' : 'Edit Program'}
          </h1>
        </div>

        {mode === 'edit' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-primary/20"
            onClick={() => summaryMutation.mutate()}
            disabled={summaryMutation.isPending}
          >
            {summaryMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 text-primary" />
            )}
            Generate Program Summary
          </Button>
        )}
      </div>

      {/* Draft status */}
      <DraftStatus
        hasDraft={draft.hasDraft}
        draftSavedAt={draft.draftSavedAt}
        isSaving={autosave.isSaving}
        onRestore={draft.restoreDraft}
        onClear={draft.clearDraft}
        className="mb-4"
      />

      <form
        onSubmit={handleSubmit(onSubmit as never, onInvalid)}
        noValidate
        className="space-y-5 pb-24"
      >
        <FormSummary labels={FIELD_LABELS} />

        {/* ── Section 1: Identity ─────────────────────────────────────── */}
        <FormSection
          id="section-identity"
          title="Identity"
          description="Core details about this program."
        >
          <FormField name="name" label="Program Name" required fullWidth>
            <Input
              {...register('name')}
              placeholder="e.g. Bachelor of Computer Science"
            />
          </FormField>

          <FormField name="field" label="Field of Study" required>
            <Input
              {...register('field')}
              placeholder="e.g. Information Technology"
            />
          </FormField>

          <FormField name="status" label="Status" required>
            <Select
              value={statusValue}
              onValueChange={(v) =>
                setValue('status', v as ProgramFormInput['status'], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            name="description"
            label="Description"
            fullWidth
            hint="Short overview shown on public listings"
          >
            <Textarea
              {...register('description')}
              rows={4}
              placeholder="Brief program overview…"
            />
          </FormField>
        </FormSection>

        {/* ── Section 2: Provider / Offering ──────────────────────────── */}
        <FormSection
          id="section-provider"
          title="Provider & Offering"
          description="University, level, mode, and duration."
        >
          <FormField name="university" label="University" required fullWidth>
            <Select
              value={universityValue}
              onValueChange={(v) =>
                setValue('university', v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a university…" />
              </SelectTrigger>
              <SelectContent>
                {universities.map((uni) => (
                  <SelectItem key={uni._id} value={uni._id}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField name="level" label="Level" required>
            <Select
              value={levelValue}
              onValueChange={(v) =>
                setValue('level', v as ProgramFormInput['level'], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField name="campusMode" label="Campus Mode" required>
            <Select
              value={campusModeValue}
              onValueChange={(v) =>
                setValue('campusMode', v as ProgramFormInput['campusMode'], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMPUS_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            name="duration"
            label="Duration"
            hint="e.g. 3 years full-time"
          >
            <Input
              {...register('duration')}
              placeholder="3 years full-time"
            />
          </FormField>
        </FormSection>

        {/* ── Section 3: CRICOS ───────────────────────────────────────── */}
        <FormSection
          id="section-cricos"
          title="CRICOS"
          description="CRICOS course registration details. Fill in the course code to unlock additional CRICOS fields."
        >
          <FormField
            name="cricosCourseCode"
            label="CRICOS Course Code"
            hint="e.g. 012345A — enables additional CRICOS fields when set"
          >
            <Input
              {...register('cricosCourseCode')}
              placeholder="012345A"
              maxLength={10}
            />
          </FormField>

          {/* Conditional CRICOS fields — shown only when a code is entered */}
          {cricosCourseCode && cricosCourseCode.trim() !== '' && (
            <>
              <FormField name="cricosProviderCode" label="Provider Code">
                <Input
                  {...register('cricosProviderCode')}
                  placeholder="00123M"
                />
              </FormField>

              <FormField name="courseLevel" label="Course Level">
                <Input
                  {...register('courseLevel')}
                  placeholder="e.g. Bachelor Degree"
                />
              </FormField>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="expired"
                  checked={expired ?? false}
                  onCheckedChange={(c) =>
                    setValue('expired', Boolean(c), { shouldDirty: true })
                  }
                />
                <Label htmlFor="expired">CRICOS listing expired</Label>
              </div>
            </>
          )}
        </FormSection>

        {/* ── Section 4: Delivery ─────────────────────────────────────── */}
        <FormSection
          id="section-delivery"
          title="Delivery"
          description="Language, work-integrated learning, and vocational codes."
        >
          <FormField name="courseLanguage" label="Language of Instruction">
            <Input {...register('courseLanguage')} placeholder="English" />
          </FormField>

          <FormField name="vetNationalCode" label="VET National Code">
            <Input {...register('vetNationalCode')} placeholder="ICT50220" />
          </FormField>

          <FormField
            name="workComponent"
            label="Work Component"
            fullWidth
            hint="Description of work-integrated learning component"
          >
            <Input
              {...register('workComponent')}
              placeholder="e.g. 12-week industry placement"
            />
          </FormField>

          <FormField
            name="workComponentHoursPerWeek"
            label="Work Component (hrs/week)"
          >
            <Input
              type="number"
              min={0}
              {...register('workComponentHoursPerWeek')}
              placeholder="20"
            />
          </FormField>
        </FormSection>

        {/* ── Section 5: Fees ─────────────────────────────────────────── */}
        <FormSection
          id="section-fees"
          title="Fees"
          description="Annual tuition and total cost figures (AUD)."
        >
          <FormField
            name="tuitionFeeLocal"
            label="Domestic Annual Fee (AUD)"
          >
            <Input
              type="number"
              min={0}
              {...register('tuitionFeeLocal')}
              placeholder="12500"
            />
          </FormField>

          <FormField
            name="tuitionFeeInternational"
            label="International Annual Fee (AUD)"
          >
            <Input
              type="number"
              min={0}
              {...register('tuitionFeeInternational')}
              placeholder="38000"
            />
          </FormField>

          <FormField
            name="tuitionFeeAud"
            label="CRICOS Tuition Fee (AUD)"
          >
            <Input
              type="number"
              min={0}
              {...register('tuitionFeeAud')}
              placeholder="114000"
            />
          </FormField>

          <FormField
            name="nonTuitionFeeAud"
            label="Non-Tuition Fee (AUD)"
          >
            <Input
              type="number"
              min={0}
              {...register('nonTuitionFeeAud')}
              placeholder="3000"
            />
          </FormField>

          <FormField
            name="estimatedTotalCourseCostAud"
            label="Estimated Total Cost (AUD)"
            fullWidth
          >
            <Input
              type="number"
              min={0}
              {...register('estimatedTotalCourseCostAud')}
              placeholder="117000"
            />
          </FormField>
        </FormSection>

        {/* ── Section 6: Intakes / Deadlines ──────────────────────────── */}
        <FormSection
          id="section-intakes"
          title="Intakes & Deadlines"
          description="When students can enrol."
        >
          <FormField
            name="intakeMonths"
            label="Intake Months"
            hint="Comma-separated e.g. February, July, November"
          >
            <Input
              {...register('intakeMonths')}
              placeholder="February, July, November"
            />
          </FormField>

          <FormField
            name="durationWeeks"
            label="Duration (weeks)"
            hint="For CRICOS reporting"
          >
            <Input
              type="number"
              min={0}
              {...register('durationWeeks')}
              placeholder="156"
            />
          </FormField>
        </FormSection>

        {/* ── Section 7: Entry Requirements ───────────────────────────── */}
        <FormSection
          id="section-entry"
          title="Entry Requirements"
          description="Academic prerequisites."
        >
          <FormField
            name="academicRequirements"
            label="Academic Requirements"
            fullWidth
            hint="e.g. ATAR 80 or equivalent"
          >
            <Input
              {...register('academicRequirements')}
              placeholder="ATAR 80 or equivalent"
            />
          </FormField>

          <FormField name="minimumGPA" label="Minimum GPA">
            <Input
              type="number"
              step="0.01"
              min={0}
              max={4}
              {...register('minimumGPA')}
              placeholder="3.0"
            />
          </FormField>

          <div className="flex items-center gap-3">
            <Checkbox
              id="dualQualification"
              checked={dualQualification ?? false}
              onCheckedChange={(c) =>
                setValue('dualQualification', Boolean(c), { shouldDirty: true })
              }
            />
            <Label htmlFor="dualQualification">Dual qualification</Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="foundationStudies"
              checked={foundationStudies ?? false}
              onCheckedChange={(c) =>
                setValue('foundationStudies', Boolean(c), { shouldDirty: true })
              }
            />
            <Label htmlFor="foundationStudies">Includes foundation studies</Label>
          </div>
        </FormSection>

        {/* ── Section 8: English Requirements ─────────────────────────── */}
        <FormSection
          id="section-english"
          title="English Requirements"
          description="Language proficiency expectations."
          columns={1}
        >
          <FormField
            name="englishRequirements"
            label="English Requirements"
            hint="e.g. IELTS 6.5 overall, no band below 6.0; or PTE 58"
          >
            <Input
              {...register('englishRequirements')}
              placeholder="IELTS 6.5 overall with no band below 6.0"
            />
          </FormField>
        </FormSection>

        {/* ── Section 9: Evidence / Data Quality ──────────────────────── */}
        <FormSection
          id="section-evidence"
          title="Evidence & Data Quality"
          description="Source provenance metadata."
        >
          <FormField
            name="sourceName"
            label="Source Name"
            hint="Where this record originated"
          >
            <Input {...register('sourceName')} placeholder="CRICOS" />
          </FormField>

          <FormField name="sourceResourceId" label="Source Resource ID">
            <Input {...register('sourceResourceId')} placeholder="AU-0123" />
          </FormField>

          <FormField name="importMethod" label="Import Method">
            <Input {...register('importMethod')} placeholder="csv_upload" />
          </FormField>

          <FormField
            name="confidence"
            label="Confidence Score"
            hint="0 – 1 scale"
          >
            <Input
              type="number"
              step="0.01"
              min={0}
              max={1}
              {...register('confidence')}
              placeholder="0.95"
            />
          </FormField>
        </FormSection>

        {/* ── Section 10: Publication ──────────────────────────────────── */}
        <FormSection
          id="section-publication"
          title="Publication"
          description="Career outcomes and public visibility."
        >
          <FormField
            name="careerPathways"
            label="Career Pathways"
            fullWidth
            hint="Comma-separated e.g. Software Engineer, Data Scientist"
          >
            <Input
              {...register('careerPathways')}
              placeholder="Software Engineer, Data Scientist, Systems Analyst"
            />
          </FormField>

          <FormField
            name="website"
            label="Program Website"
            hint="Direct link to this program's page"
          >
            <Input
              type="url"
              {...register('website')}
              placeholder="https://www.university.edu.au/programs/bcs"
            />
          </FormField>
        </FormSection>
      </form>

      {/* Sticky actions */}
      <StickyFormActions
        primaryLabel={mode === 'create' ? 'Create Program' : 'Save Changes'}
        secondaryLabel="Cancel"
        onSecondary={guardedBack}
        isLoading={isPending}
        showSaveDraft
        onSaveDraft={draft.saveDraft}
        primaryType="button"
        onPrimary={() => handleSubmit(onSubmit as never, onInvalid)()}
      />

      <UnsavedChangesDialog
        open={unsaved.showDialog}
        onConfirm={unsaved.confirmLeave}
        onCancel={unsaved.cancelLeave}
      />
    </FormProvider>
  );
}
