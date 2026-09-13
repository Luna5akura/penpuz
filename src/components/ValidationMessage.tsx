import { useI18n } from '@/i18n/useI18n';
import { localizeValidationMessage } from '@/puzzles/validationMessages';

interface ValidationMessageProps {
  message?: string;
  className?: string;
}

/** Shared presentation for validator feedback across every puzzle board. */
export default function ValidationMessage({ message, className = '' }: ValidationMessageProps) {
  const { locale } = useI18n();
  const localizedMessage = localizeValidationMessage(message, locale);
  if (!localizedMessage) return null;

  return (
    <div
      className={`text-center text-sm text-muted-foreground dark:text-gray-400 ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      {localizedMessage}
    </div>
  );
}

