import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnsavedChangesDialogProps {
  open: boolean;
  /** Called when user confirms they want to leave */
  onConfirm: () => void;
  /** Called when user chooses to stay */
  onCancel: () => void;
}

/**
 * A confirmation dialog shown when a user attempts to navigate away from
 * a dirty form. Powered by the radix AlertDialog component already in the
 * project.
 *
 * Wire it up with `useUnsavedChanges`:
 * ```tsx
 * const unsaved = useUnsavedChanges(methods) as UseUnsavedChangesReturnExtended;
 *
 * <UnsavedChangesDialog
 *   open={unsaved.showDialog}
 *   onConfirm={unsaved.confirmLeave}
 *   onCancel={unsaved.cancelLeave}
 * />
 * ```
 */
export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you leave this page.
            Your auto-saved draft will remain available if you return.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Stay on page</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Leave without saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
