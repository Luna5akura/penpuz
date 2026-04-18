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
    <Card className="mx-auto mt-14 max-w-5xl border-[#bfa889] bg-[#fffdf8] dark:border-gray-700 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-center text-4xl font-bold text-[#2f241a] dark:text-gray-100">
          {template.rulesTitle[locale]}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-8 text-[#2f241a] dark:text-gray-200 sm:px-10">
        <div className="mb-14 space-y-7">
          {template.rules[locale].map((rule, i) => (
            <div key={i} className="flex items-start gap-4 border-l-4 border-[#3f2a1e] pl-4 sm:gap-5 sm:pl-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-[#3f2a1e] bg-[#f2e5d1] text-xl font-bold text-[#3f2a1e] dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100">
                {i + 1}
              </span>
              <p className="pt-0.5 text-lg leading-8 sm:text-xl">{rule}</p>
            </div>
          ))}
        </div>

        <h3 className="mb-8 border-t-2 border-[#d5c1a6] pt-8 text-center text-3xl font-semibold text-[#2f241a] dark:border-gray-700 dark:text-gray-100">
          {template.exampleTitle[locale]}
        </h3>

        {renderPuzzleExample(template, locale)}
      </CardContent>
    </Card>
  );
}
