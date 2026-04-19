// src/components/RulesSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n/useI18n';
import { PuzzleTemplate } from '../puzzles/types';
import { renderPuzzleExample } from '../puzzles/registry';

interface Props {
  template: PuzzleTemplate;
}

export default function RulesSection({ template }: Props) {
  const { locale } = useI18n();

  return (
    <Card className="mx-auto mt-10 max-w-5xl border-[#d7c7b4] bg-[#fffdf9] dark:border-gray-700 dark:bg-gray-900">
      <CardHeader className="border-b px-4 pb-3 sm:px-5">
        <CardTitle className="text-2xl font-semibold text-[#2f241a] dark:text-gray-100">
          {template.rulesTitle[locale]}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-5 pt-4 text-[#2f241a] dark:text-gray-200 sm:px-5">
        <div className="mb-8 space-y-4">
          {template.rules[locale].map((rule, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-muted text-sm font-semibold text-[#3f2a1e] dark:text-gray-100">
                {i + 1}
              </span>
              <p className="pt-0.5 text-base leading-7">{rule}</p>
            </div>
          ))}
        </div>

        <h3 className="mb-5 border-t pt-4 text-lg font-semibold text-[#2f241a] dark:border-gray-700 dark:text-gray-100">
          {template.exampleTitle[locale]}
        </h3>

        {renderPuzzleExample(template, locale)}
      </CardContent>
    </Card>
  );
}
