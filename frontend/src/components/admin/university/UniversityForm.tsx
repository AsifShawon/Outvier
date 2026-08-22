'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

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

import { universitiesApi } from '@/lib/api/universities.api';
import { ingestionApi } from '@/lib/api/ingestion.api';
import {
  universityFormSchema,
  universityFormDefaults,
  type UniversityFormInput,
  type UniversityFormOutput,
} from '@/lib/schemas/university.schema';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useAutosave } from '@/hooks/useAutosave';
import { useServerErrors } from '@/hooks/useServerErrors';
import {
  useUnsavedChanges,
  type UseUnsavedChangesReturnExtended,
} from '@/hooks/useUnsavedChanges';
import { University } from '@/types/university';

// ---------------------------------------------------------------------------
// Field labels for FormSummary
// ---------------------------------------------------------------------------
const FIELD_LABELS: Record<string, string> = {
  name: 'University Name',
  description: 'Description',
  type: 'Type',
  establishedYear: 'Established Year',
  cricosProviderCode: 'CRICOS Provider Code',
  institutionType: 'Institution Type',
  providerType: 'Provider Type',
  institutionCapacity: 'Institution Capacity',
  website: 'Website',
  officialWebsite: 'Official Website',
  logo: 'Logo URL',
  city: 'City',
  state: 'State',
  country: 'Country',
  campuses: 'Campuses',
  ranking: 'Ranking',
  status: 'Status',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export type UniversityFormMode = 'create' | 'edit';

interface UniversityFormProps {
  mode: UniversityFormMode;
  /** Existing university data (edit mode only) */
  defaultData?: University;
  /** University ID (edit mode only) */
  universityId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function UniversityForm({
  mode,
  defaultData,
  universityId,
}: UniversityFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const draftKey =
    mode === 'create'
      ? 'university-new'
      : `university-edit:${universityId ?? ''}`;

  // -------------------------------------------------------------------------
  // RHF setup
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<UniversityFormInput, any, UniversityFormOutput>({
    resolver: zodResolver(universityFormSchema) as any,
    defaultValues: universityFormDefaults,
    mode: 'onTouched', // validate after first interaction per field
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
  const methodsForHooks = methods as unknown as import('react-hook-form').UseFormReturn<UniversityFormInput>;
  const draft = useFormDraft(draftKey, methodsForHooks);
  const autosave = useAutosave(methodsForHooks, {
    key: draftKey,
    delay: 1500,
    enabled: true,
    saveDraft: draft.saveDraft,
  });

  // -------------------------------------------------------------------------
  // Server error mapping
  // -------------------------------------------------------------------------
  const mapServerErrors = useServerErrors(methodsForHooks);

  // -------------------------------------------------------------------------
  // Unsaved changes guard
  // -------------------------------------------------------------------------
  const unsaved = useUnsavedChanges(methodsForHooks) as UseUnsavedChangesReturnExtended;

  // -------------------------------------------------------------------------
  // Populate form from server data (edit mode)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (defaultData) {
      reset({
        name: defaultData.name ?? '',
        shortName: defaultData.shortName ?? '',
        description: defaultData.description ?? '',
        type: defaultData.type ?? 'public',
        establishedYear: defaultData.establishedYear
          ? String(defaultData.establishedYear)
          : '',
        cricosProviderCode: defaultData.cricosProviderCode ?? '',
        institutionType: defaultData.institutionType ?? '',
        providerType: defaultData.providerType ?? '',
        institutionCapacity: defaultData.institutionCapacity
          ? String(defaultData.institutionCapacity)
          : '',
        website: defaultData.website ?? '',
        officialWebsite: defaultData.officialWebsite ?? '',
        logo: defaultData.logo ?? '',
        city: defaultData.city ?? '',
        state: defaultData.state ?? '',
        country: defaultData.country ?? 'Australia',
        location: defaultData.location ?? '',
        campuses: defaultData.campuses?.join(', ') ?? '',
        internationalStudents: defaultData.internationalStudents ?? false,
        sourceName: defaultData.sourceMetadata?.sourceName ?? '',
        ranking: defaultData.ranking ? String(defaultData.ranking) : '',
        rankingBand: defaultData.rankingBand ?? '',
        status:
          (defaultData.status as UniversityFormInput['status']) ?? 'draft',
        autoDiscoverPrograms: false,
      });
    }
  }, [defaultData, reset]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (output: UniversityFormOutput) =>
      universitiesApi.create({
        name: output.name,
        description: output.description,
        location: output.location ?? '',
        state: output.state,
        website: output.website ?? '',
        logo: output.logo,
        establishedYear: output.establishedYear,
        ranking: output.ranking,
        type: output.type,
        campuses: output.campuses,
        internationalStudents: output.internationalStudents,
        cricosProviderCode: output.cricosProviderCode,
        officialWebsite: output.officialWebsite,
      }),
    onSuccess: () => {
      toast.success('University created successfully!');
      draft.clearDraft();
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.push('/admin/universities');
    },
    onError: (err) => {
      mapServerErrors(err);
      toast.error('Failed to create university. Please check the form.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (output: UniversityFormOutput) =>
      universitiesApi.update(universityId!, {
        name: output.name,
        description: output.description,
        location: output.location,
        state: output.state,
        website: output.website,
        logo: output.logo,
        establishedYear: output.establishedYear,
        ranking: output.ranking,
        type: output.type,
        campuses: output.campuses,
        internationalStudents: output.internationalStudents,
        cricosProviderCode: output.cricosProviderCode,
        officialWebsite: output.officialWebsite,
      }),
    onSuccess: (res) => {
      toast.success('University updated!');
      draft.clearDraft();
      // Preserve server-returned canonical values
      const saved = res.data.data;
      if (saved) {
        reset({
          name: saved.name ?? '',
          shortName: saved.shortName ?? '',
          description: saved.description ?? '',
          type: saved.type ?? 'public',
          establishedYear: saved.establishedYear
            ? String(saved.establishedYear)
            : '',
          cricosProviderCode: saved.cricosProviderCode ?? '',
          institutionType: saved.institutionType ?? '',
          providerType: saved.providerType ?? '',
          institutionCapacity: saved.institutionCapacity
            ? String(saved.institutionCapacity)
            : '',
          website: saved.website ?? '',
          officialWebsite: saved.officialWebsite ?? '',
          logo: saved.logo ?? '',
          city: saved.city ?? '',
          state: saved.state ?? '',
          country: saved.country ?? 'Australia',
          location: saved.location ?? '',
          campuses: saved.campuses?.join(', ') ?? '',
          internationalStudents: saved.internationalStudents ?? false,
          sourceName: saved.sourceMetadata?.sourceName ?? '',
          ranking: saved.ranking ? String(saved.ranking) : '',
          rankingBand: saved.rankingBand ?? '',
          status: (saved.status as UniversityFormInput['status']) ?? 'draft',
          autoDiscoverPrograms: false,
        });
      }
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      router.push('/admin/universities');
    },
    onError: (err) => {
      mapServerErrors(err);
      toast.error('Failed to update university. Please check the form.');
    },
  });

  const discoverMutation = useMutation({
    mutationFn: () => ingestionApi.discoverPrograms(universityId!),
    onSuccess: (res) => {
      toast.success(res.message || 'Program discovery started!');
      router.push('/admin/staged-changes');
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to start discovery'
      );
    },
  });

  const summaryMutation = useMutation({
    mutationFn: () =>
      universitiesApi.update(universityId!, { generateSummary: true } as never),
    onSuccess: () => {
      toast.success('AI Summary generation queued!');
      router.push('/admin/staged-changes');
    },
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    isSubmitting;

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const onSubmit = (output: UniversityFormOutput) => {
    if (mode === 'create') {
      createMutation.mutate(output);
    } else {
      updateMutation.mutate(output);
    }
  };

  // Focus first invalid field on submit error
  const onInvalid = () => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const el = document.querySelector<HTMLElement>(
        `[name="${firstError}"], [data-name="${firstError}"]`
      );
      el?.focus();
    }
  };

  // -------------------------------------------------------------------------
  // Navigation guard helper
  // -------------------------------------------------------------------------
  const guardedBack = () =>
    unsaved.guardNavigate(() => router.push('/admin/universities'));

  // -------------------------------------------------------------------------
  // Watched values
  // -------------------------------------------------------------------------
  const typeValue = watch('type');
  const statusValue = watch('status');
  const autoDiscoverValue = watch('autoDiscoverPrograms');
  const internationalValue = watch('internationalStudents');

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <FormProvider {...methods}>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            type="button"
            onClick={guardedBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold font-display">
            {mode === 'create' ? 'Add University' : 'Edit University'}
          </h1>
        </div>

        {/* Edit-mode AI actions */}
        {mode === 'edit' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/20"
              type="button"
              onClick={() => summaryMutation.mutate()}
              disabled={summaryMutation.isPending}
            >
              {summaryMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 text-primary" />
              )}
              Generate Summary
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              type="button"
              onClick={() => discoverMutation.mutate()}
              disabled={discoverMutation.isPending}
            >
              {discoverMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <BrainCircuit className="h-3 w-3" />
              )}
              AI Discover Programs
            </Button>
          </div>
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

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit as never, onInvalid)}
        noValidate
        className="space-y-5 pb-24"
      >
        {/* Error summary */}
        <FormSummary labels={FIELD_LABELS} />

        {/* ── Section 1: Identity ─────────────────────────────────────── */}
        <FormSection
          id="section-identity"
          title="Identity"
          description="Core identifying information for this institution."
        >
          <FormField name="name" label="University Name" required fullWidth>
            <Input
              {...register('name')}
              placeholder="e.g. University of Adelaide"
            />
          </FormField>

          <FormField name="shortName" label="Short Name / Abbreviation">
            <Input {...register('shortName')} placeholder="e.g. UniAdelaide" />
          </FormField>

          <FormField name="type" label="Type" required>
            <Select
              value={typeValue}
              onValueChange={(v) =>
                setValue('type', v as UniversityFormInput['type'], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            name="establishedYear"
            label="Established Year"
            hint="Four-digit year e.g. 1874"
          >
            <Input
              type="number"
              min={1600}
              max={new Date().getFullYear()}
              {...register('establishedYear')}
              placeholder="1874"
            />
          </FormField>

          <FormField
            name="description"
            label="Description"
            required
            fullWidth
            hint="A short overview shown on public listings"
          >
            <Textarea
              {...register('description')}
              rows={4}
              placeholder="Brief overview of the institution…"
            />
          </FormField>
        </FormSection>

        {/* ── Section 2: Registration ─────────────────────────────────── */}
        <FormSection
          id="section-registration"
          title="Registration"
          description="Official provider identifiers and CRICOS details."
        >
          <FormField
            name="cricosProviderCode"
            label="CRICOS Provider Code"
            hint="e.g. 00123M"
          >
            <Input
              {...register('cricosProviderCode')}
              placeholder="00123M"
              maxLength={10}
            />
          </FormField>

          <FormField name="institutionType" label="Institution Type">
            <Input
              {...register('institutionType')}
              placeholder="e.g. University, TAFE"
            />
          </FormField>

          <FormField name="providerType" label="Provider Type">
            <Input
              {...register('providerType')}
              placeholder="e.g. Government, Private"
            />
          </FormField>

          <FormField
            name="institutionCapacity"
            label="Institution Capacity"
            hint="Maximum enrolled student count"
          >
            <Input
              type="number"
              min={0}
              {...register('institutionCapacity')}
              placeholder="30000"
            />
          </FormField>
        </FormSection>

        {/* ── Section 3: Websites & Branding ──────────────────────────── */}
        <FormSection
          id="section-websites"
          title="Websites & Branding"
          description="Public-facing URLs and logo."
        >
          <FormField
            name="website"
            label="Main Website"
            hint="https:// URL used on public listings"
          >
            <Input
              type="url"
              {...register('website')}
              placeholder="https://www.university.edu.au"
            />
          </FormField>

          <FormField
            name="officialWebsite"
            label="Official Website"
            hint="If different from the main website"
          >
            <Input
              type="url"
              {...register('officialWebsite')}
              placeholder="https://www.university.edu.au"
            />
          </FormField>

          <FormField
            name="logo"
            label="Logo URL"
            fullWidth
            hint="Direct link to the institution logo image"
          >
            <Input
              type="url"
              {...register('logo')}
              placeholder="https://cdn.example.com/logo.png"
            />
          </FormField>
        </FormSection>

        {/* ── Section 4: Locations / Campuses ─────────────────────────── */}
        <FormSection
          id="section-locations"
          title="Locations & Campuses"
          description="Primary address and campus names."
        >
          <FormField name="city" label="City">
            <Input {...register('city')} placeholder="Adelaide" />
          </FormField>

          <FormField name="state" label="State" required hint="e.g. SA, NSW, VIC">
            <Input
              {...register('state')}
              placeholder="SA"
              maxLength={10}
            />
          </FormField>

          <FormField name="country" label="Country">
            <Input {...register('country')} placeholder="Australia" />
          </FormField>

          <FormField name="location" label="Location Description">
            <Input
              {...register('location')}
              placeholder="e.g. North Terrace, Adelaide CBD"
            />
          </FormField>

          <FormField
            name="campuses"
            label="Campuses"
            fullWidth
            hint="Comma-separated list of campus names"
          >
            <Input
              {...register('campuses')}
              placeholder="North Terrace, Mawson Lakes, City West"
            />
          </FormField>

          {/* International students toggle */}
          <div className="md:col-span-2 flex items-center gap-3">
            <Checkbox
              id="internationalStudents"
              checked={internationalValue ?? false}
              onCheckedChange={(checked) =>
                setValue('internationalStudents', Boolean(checked), {
                  shouldDirty: true,
                })
              }
            />
            <Label htmlFor="internationalStudents">
              Accepts international students
            </Label>
          </div>
        </FormSection>

        {/* ── Section 5: Source & Verification ────────────────────────── */}
        <FormSection
          id="section-source"
          title="Source & Verification"
          description="Data provenance and ranking information."
        >
          <FormField
            name="sourceName"
            label="Source Name"
            hint="Where this record originated e.g. CRICOS, manual"
          >
            <Input {...register('sourceName')} placeholder="CRICOS" />
          </FormField>

          <FormField name="ranking" label="Global Ranking">
            <Input
              type="number"
              min={1}
              {...register('ranking')}
              placeholder="100"
            />
          </FormField>

          <FormField
            name="rankingBand"
            label="Ranking Band"
            hint="e.g. Top 100, 101-200"
          >
            <Input {...register('rankingBand')} placeholder="Top 100" />
          </FormField>
        </FormSection>

        {/* ── Section 6: Publication ──────────────────────────────────── */}
        <FormSection
          id="section-publication"
          title="Publication"
          description="Control the visibility of this record."
          columns={1}
        >
          <FormField name="status" label="Status" required>
            <Select
              value={statusValue}
              onValueChange={(v) =>
                setValue('status', v as UniversityFormInput['status'], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* AI Program Discovery — create mode only */}
          {mode === 'create' && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 flex gap-4 items-start max-w-2xl">
              <div className="mt-0.5 bg-indigo-500/20 p-2 rounded-lg shrink-0">
                <BrainCircuit className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  AI Program Discovery
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatically trigger the AI crawler to find, extract, and
                  stage programs from the official university website right after
                  creation.
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoDiscoverPrograms"
                    checked={autoDiscoverValue ?? true}
                    onCheckedChange={(c) =>
                      setValue('autoDiscoverPrograms', Boolean(c), {
                        shouldDirty: true,
                      })
                    }
                  />
                  <Label htmlFor="autoDiscoverPrograms">
                    Enable automated program discovery
                  </Label>
                </div>
              </div>
            </div>
          )}
        </FormSection>
      </form>

      {/* Sticky actions */}
      <StickyFormActions
        primaryLabel={mode === 'create' ? 'Create University' : 'Save Changes'}
        secondaryLabel="Cancel"
        onSecondary={guardedBack}
        isLoading={isPending}
        showSaveDraft
        onSaveDraft={draft.saveDraft}
        primaryType="button"
        onPrimary={() =>
          handleSubmit(onSubmit as never, onInvalid)()
        }
      />

      {/* Unsaved changes dialog */}
      <UnsavedChangesDialog
        open={unsaved.showDialog}
        onConfirm={unsaved.confirmLeave}
        onCancel={unsaved.cancelLeave}
      />
    </FormProvider>
  );
}
