import { useI18n } from '@/i18n/useI18n';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation dialog shared by all answer examples.
 *
 * The Radix dialog wrapper supplies focus management, Escape-to-close,
 * `role="dialog"`, `aria-modal`, and a consistent overlay.  Keeping those
 * behaviours here means every example board has the same spoiler UX.
 */
export default function ExampleAnswerRevealDialog({ open, onCancel, onConfirm }: Props) {
  const { copy } = useI18n();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-md border-border bg-card p-6 text-card-foreground"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl leading-8">
            {copy.shared.revealAnswerPrompt}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="-mx-6 -mb-6 flex-row gap-3 border-t-0 bg-transparent p-6 pt-0 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            {copy.shared.cancel}
          </Button>
          <Button type="button" onClick={onConfirm} className="flex-1">
            {copy.shared.confirmView}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
