import { useI18n } from '@/i18n/useI18n';

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ExampleAnswerRevealDialog({ open, onCancel, onConfirm }: Props) {
  const { copy } = useI18n();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="max-w-sm w-full mx-4 bg-white dark:bg-gray-900 rounded-lg p-6 text-center shadow-xl">
        <p className="text-lg mb-6 dark:text-gray-200">
          {copy.shared.revealAnswerPrompt}
          <br />
          ({copy.shared.revealAnswerHint})
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border rounded-lg">
            {copy.shared.cancel}
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-[#3f2a1e] text-white rounded-lg">
            {copy.shared.confirmView}
          </button>
        </div>
      </div>
    </div>
  );
}
