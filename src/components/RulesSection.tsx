// src/components/RulesSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PuzzleTemplate } from '../puzzles/types';
import { renderPuzzleExample } from '../puzzles/registry';

interface Props {
  template: PuzzleTemplate;
}

export default function RulesSection({ template }: Props) {
  return (
    <Card className="max-w-4xl mx-auto mt-12 dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-[#3f2a1e] dark:text-gray-100 text-center">
          {template.rulesTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose text-[#3f2a1e] dark:text-gray-200 leading-relaxed px-8">
        <div className="space-y-6 mb-12">
          {template.rules.map((rule, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3f2a1e] dark:bg-gray-700 text-white flex items-center justify-center font-bold text-lg">
                {i + 1}
              </span>
              <p className="text-lg pt-1">{rule}</p>
            </div>
          ))}
        </div>

        <h3 className="text-2xl font-semibold mb-8 text-center text-[#3f2a1e] dark:text-gray-100">
          {template.exampleTitle}
        </h3>

        {renderPuzzleExample(template)}
      </CardContent>
    </Card>
  );
}
