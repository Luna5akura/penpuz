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
      <div className="mx-4 w-full max-w-md border-2 border-[#bfa889] bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="mb-6 text-xl leading-8 dark:text-gray-200">
          {copy.shared.revealAnswerPrompt}
          <br />
          ({copy.shared.revealAnswerHint})
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border-2 px-4 py-3 text-lg font-semibold">
            {copy.shared.cancel}
          </button>
          <button onClick={onConfirm} className="flex-1 border-2 border-[#3f2a1e] bg-[#3f2a1e] px-4 py-3 text-lg font-semibold text-white">
            {copy.shared.confirmView}
          </button>
        </div>
      </div>
    </div>
  );
}
