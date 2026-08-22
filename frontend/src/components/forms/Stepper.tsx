import { CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepDefinition {
  id: string;
  title: string;
  description?: string;
  /** Lucide icon component */
  icon?: LucideIcon;
}

interface StepperProps {
  steps: StepDefinition[];
  current: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

/**
 * A horizontal stepper showing step progress.
 *
 * - Completed steps show a checkmark.
 * - Active step is highlighted with the primary colour.
 * - Steps are keyboard-navigable when `onStepClick` is provided.
 *
 * ```tsx
 * <Stepper steps={STEPS} current={currentStep} onStepClick={setCurrentStep} />
 * ```
 */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <nav
      aria-label="Form steps"
      className={cn('flex items-center justify-center gap-10 relative', className)}
    >
      {/* Connecting line */}
      {steps.length > 1 && (
        <div
          aria-hidden="true"
          className="absolute top-5 left-[20%] right-[20%] h-0.5 bg-border z-0"
        />
      )}

      {steps.map((step, i) => {
        const isCompleted = i < current;
        const isActive = i === current;
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            aria-label={`${step.title}${isCompleted ? ' (completed)' : ''}`}
            onClick={() => onStepClick?.(i)}
            disabled={!onStepClick}
            className={cn(
              'relative z-10 flex flex-col items-center gap-2 group',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm',
              onStepClick ? 'cursor-pointer' : 'cursor-default'
            )}
          >
            {/* Circle */}
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : isCompleted
                  ? 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                  : 'bg-card text-muted-foreground border-border'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : Icon ? (
                <Icon className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{i + 1}</span>
              )}
            </div>

            {/* Labels */}
            <div className="text-center bg-background px-2">
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-wider',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 hidden sm:block">
                  {step.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
