'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GraduationCap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FormField,
  FormSummary,
  Stepper,
  DraftStatus,
  StickyFormActions,
  UnsavedChangesDialog,
} from '@/components/forms';

import { profileApi } from '@/lib/api/profile.api';
import { programsApi } from '@/lib/api/programs.api';
import {
  profileFormSchema,
  profileFormDefaults,
  PROFILE_STEPS,
  type ProfileFormInput,
  type ProfileFormOutput,
} from '@/lib/schemas/profile.schema';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useAutosave } from '@/hooks/useAutosave';
import { useServerErrors } from '@/hooks/useServerErrors';
import {
  useUnsavedChanges,
  type UseUnsavedChangesReturnExtended,
} from '@/hooks/useUnsavedChanges';
import { cn } from '@/lib/utils';

const LEVELS = [
  { value: 'bachelor', label: 'Bachelor Degree' },
  { value: 'master', label: 'Master Degree' },
  { value: 'phd', label: 'PhD' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'graduate_certificate', label: 'Graduate Certificate' },
];

const STEP_ICONS = [GraduationCap, Target];

const steps = PROFILE_STEPS.map((s, i) => ({
  ...s,
  icon: STEP_ICONS[i],
}));

export default function ProfilePage() {
  const qc = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  // -------------------------------------------------------------------------
  // RHF setup
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<ProfileFormInput, any, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema) as any,
    defaultValues: profileFormDefaults,
    mode: 'onTouched',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { isSubmitting },
  } = methods;

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const { data: profileRes, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const { data: fieldsRes } = useQuery({
    queryKey: ['program-fields'],
    queryFn: () => programsApi.getFields(),
  });

  const fields: string[] = fieldsRes?.data?.data ?? [];

  // Populate from server
  useEffect(() => {
    const profileData = profileRes?.data?.data;
    if (profileData) {
      reset({
        preferredField: profileData.preferredField ?? '',
        preferredLevel: profileData.preferredLevel ?? 'master',
        budgetMaxAud: profileData.budgetMaxAud ?? 40000,
        preferredStates: profileData.preferredStates ?? [],
        ieltsScore: profileData.ieltsScore,
        pteScore: profileData.pteScore,
        academicBackground: profileData.academicBackground ?? '',
        careerGoals: {
          targetRole: profileData.careerGoals?.targetRole ?? '',
          migrationInterest: profileData.careerGoals?.migrationInterest ?? false,
          fundingSource: profileData.careerGoals?.fundingSource ?? 'family',
        },
      });
    }
  }, [profileRes, reset]);

  // -------------------------------------------------------------------------
  // Draft + autosave
  // -------------------------------------------------------------------------
  // Cast away the transform type param (TFieldValues) for hook compatibility
  const methodsForHooks = methods as unknown as import('react-hook-form').UseFormReturn<ProfileFormInput>;
  const draft = useFormDraft('profile', methodsForHooks);
  const autosave = useAutosave(methodsForHooks, {
    key: 'profile',
    delay: 1500,
    enabled: true,
    saveDraft: draft.saveDraft,
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const mapServerErrors = useServerErrors(methodsForHooks);
  const unsaved = useUnsavedChanges(methodsForHooks) as UseUnsavedChangesReturnExtended;

  const mutation = useMutation({
    mutationFn: (output: ProfileFormOutput) =>
      profileApi.updateProfile(output as Record<string, unknown>),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      draft.clearDraft();
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => {
      mapServerErrors(err);
      toast.error('Failed to update profile');
    },
  });

  const isPending = mutation.isPending || isSubmitting;

  // handleSubmit types with the input type; we cast to bridge input→output
  const onSubmit = (output: ProfileFormOutput) => {
    mutation.mutate(output);
  };

  // Validate step 0 before advancing
  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      const stepFields: (keyof ProfileFormInput)[] =
        currentStep === 0
          ? ['preferredField', 'preferredLevel', 'ieltsScore', 'pteScore', 'academicBackground']
          : ['careerGoals'];
      const valid = await trigger(stepFields);
      if (valid) setCurrentStep((s) => s + 1);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit(onSubmit as any)();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  // -------------------------------------------------------------------------
  // Watched values
  // -------------------------------------------------------------------------
  const preferredField = watch('preferredField');
  const preferredLevel = watch('preferredLevel');
  const budgetMaxAud = watch('budgetMaxAud');
  const ieltsScore = watch('ieltsScore');
  const pteScore = watch('pteScore');
  const migrationInterest = watch('careerGoals.migrationInterest');
  const fundingSource = watch('careerGoals.fundingSource');

  if (isLoadingProfile) {
    return (
      <div className="p-12 text-center text-sm font-medium text-muted-foreground">
        Loading your profile…
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-3xl mx-auto py-6 px-4 pb-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display tracking-tight">
            Profile Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keep your profile updated for better recommendations.
          </p>

          {/* Draft status */}
          <DraftStatus
            hasDraft={draft.hasDraft}
            draftSavedAt={draft.draftSavedAt}
            isSaving={autosave.isSaving}
            onRestore={draft.restoreDraft}
            onClear={draft.clearDraft}
            className="mt-4"
          />

          {/* Stepper */}
          <Stepper
            steps={steps}
            current={currentStep}
            onStepClick={setCurrentStep}
            className="mt-8"
          />
        </div>

        {/* Error summary */}
        <FormSummary className="mb-4" />

        <form
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSubmit={handleSubmit(onSubmit as any)}
          noValidate
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Step 0: Academic Profile ──────────────────────────── */}
              {currentStep === 0 && (
                <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                  <CardHeader className="p-6 border-b border-border bg-muted/30">
                    <CardTitle className="text-xl font-bold">
                      Academic Background
                    </CardTitle>
                    <CardDescription>
                      Your previous education and language skills.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField
                        name="preferredField"
                        label="Preferred Field"
                      >
                        <Select
                          value={preferredField ?? ''}
                          onValueChange={(v) =>
                            setValue('preferredField', v, { shouldDirty: true })
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select field…" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((f: string) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField
                        name="preferredLevel"
                        label="Study Level"
                      >
                        <Select
                          value={preferredLevel}
                          onValueChange={(v) =>
                            setValue(
                              'preferredLevel',
                              v as ProfileFormInput['preferredLevel'],
                              { shouldDirty: true }
                            )
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select level…" />
                          </SelectTrigger>
                          <SelectContent>
                            {LEVELS.map((l) => (
                              <SelectItem key={l.value} value={l.value}>
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField
                        name="ieltsScore"
                        label="IELTS Score"
                        hint="Overall band score (0–9)"
                      >
                        <Input
                          type="number"
                          step="0.5"
                          min={0}
                          max={9}
                          value={ieltsScore ?? ''}
                          onChange={(e) =>
                            setValue(
                              'ieltsScore',
                              e.target.value === '' ? undefined : parseFloat(e.target.value),
                              { shouldDirty: true }
                            )
                          }
                          className="h-11"
                          placeholder="7.0"
                        />
                      </FormField>

                      <FormField
                        name="pteScore"
                        label="PTE Score"
                        hint="PTE Academic score (0–90)"
                      >
                        <Input
                          type="number"
                          min={0}
                          max={90}
                          value={pteScore ?? ''}
                          onChange={(e) =>
                            setValue(
                              'pteScore',
                              e.target.value === '' ? undefined : parseInt(e.target.value),
                              { shouldDirty: true }
                            )
                          }
                          className="h-11"
                          placeholder="65"
                        />
                      </FormField>
                    </div>

                    <FormField
                      name="academicBackground"
                      label="Education History"
                      hint="GPA, degree, and institution"
                    >
                      <Textarea
                        rows={3}
                        {...register('academicBackground')}
                        placeholder="e.g. Bachelor of IT from University of Dhaka, GPA 3.8/4.0"
                        className="resize-none"
                      />
                    </FormField>
                  </CardContent>
                </Card>
              )}

              {/* ── Step 1: Goals & Preferences ──────────────────────── */}
              {currentStep === 1 && (
                <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                  <CardHeader className="p-6 border-b border-border bg-muted/30">
                    <CardTitle className="text-xl font-bold">
                      Goals & Preferences
                    </CardTitle>
                    <CardDescription>
                      Your career aspirations and financial constraints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField
                        name="careerGoals.targetRole"
                        label="Target Career Role"
                      >
                        <Input
                          {...register('careerGoals.targetRole')}
                          placeholder="e.g. Software Engineer, Data Scientist"
                          className="h-11"
                        />
                      </FormField>

                      <FormField
                        name="careerGoals.fundingSource"
                        label="Funding Source"
                      >
                        <Select
                          value={fundingSource}
                          onValueChange={(v) =>
                            setValue(
                              'careerGoals.fundingSource',
                              v as 'self' | 'loan' | 'scholarship' | 'family',
                              { shouldDirty: true }
                            )
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select funding…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self">Self Funded</SelectItem>
                            <SelectItem value="family">Family Support</SelectItem>
                            <SelectItem value="loan">Bank Loan</SelectItem>
                            <SelectItem value="scholarship">
                              Full Scholarship
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    {/* Budget slider */}
                    <div className="space-y-4 bg-muted/30 p-5 rounded-xl border border-border">
                      <div className="flex justify-between items-center">
                        <Label className="text-[11px] font-bold uppercase tracking-widest">
                          Max Annual Budget (AUD)
                        </Label>
                        <span className="text-lg font-black">
                          ${(budgetMaxAud ?? 40000).toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={15000}
                        max={80000}
                        step={1000}
                        value={budgetMaxAud ?? 40000}
                        onChange={(e) =>
                          setValue('budgetMaxAud', parseInt(e.target.value), {
                            shouldDirty: true,
                          })
                        }
                        aria-label="Maximum annual budget in AUD"
                        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    {/* Migration interest toggle */}
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Interested in Permanent Residency (PR)?
                      </Label>
                      <div
                        role="group"
                        aria-label="Migration interest"
                        className="flex gap-3"
                      >
                        <Button
                          type="button"
                          variant={migrationInterest ? 'default' : 'outline'}
                          className="flex-1 h-11 font-semibold"
                          onClick={() =>
                            setValue('careerGoals.migrationInterest', true, {
                              shouldDirty: true,
                            })
                          }
                          aria-pressed={migrationInterest ? true : false}
                        >
                          Yes, interested
                        </Button>
                        <Button
                          type="button"
                          variant={!migrationInterest ? 'default' : 'outline'}
                          className="flex-1 h-11 font-semibold"
                          onClick={() =>
                            setValue('careerGoals.migrationInterest', false, {
                              shouldDirty: true,
                            })
                          }
                          aria-pressed={!migrationInterest ? true : false}
                        >
                          No, just studying
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </form>

        {/* Sticky actions */}
        <StickyFormActions
          primaryLabel={currentStep === steps.length - 1 ? 'Save Profile' : 'Continue'}
          secondaryLabel={currentStep === 0 ? undefined : 'Back'}
          onSecondary={currentStep === 0 ? undefined : handlePrev}
          isLoading={isPending}
          showSaveDraft
          onSaveDraft={draft.saveDraft}
          primaryType="button"
          onPrimary={handleNext}
        />

        <UnsavedChangesDialog
          open={unsaved.showDialog}
          onConfirm={unsaved.confirmLeave}
          onCancel={unsaved.cancelLeave}
        />
      </div>
    </FormProvider>
  );
}
