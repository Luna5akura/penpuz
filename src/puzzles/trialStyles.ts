type TrialLevelColors = {
  fill: string;
  softFill: string;
  text: string;
  line: string;
  accent: string;
};

const TRIAL_LEVEL_PALETTE: TrialLevelColors[] = [
  {
    fill: '#2563eb',
    softFill: '#dbeafe',
    text: '#1e3a8a',
    line: '#2563eb',
    accent: '#93c5fd',
  },
  {
    fill: '#0f766e',
    softFill: '#ccfbf1',
    text: '#115e59',
    line: '#0f766e',
    accent: '#5eead4',
  },
  {
    fill: '#9333ea',
    softFill: '#f3e8ff',
    text: '#6b21a8',
    line: '#9333ea',
    accent: '#d8b4fe',
  },
  {
    fill: '#ea580c',
    softFill: '#ffedd5',
    text: '#9a3412',
    line: '#ea580c',
    accent: '#fdba74',
  },
  {
    fill: '#be123c',
    softFill: '#ffe4e6',
    text: '#9f1239',
    line: '#e11d48',
    accent: '#fda4af',
  },
  {
    fill: '#b45309',
    softFill: '#fef3c7',
    text: '#78350f',
    line: '#b45309',
    accent: '#fbbf24',
  },
  {
    fill: '#15803d',
    softFill: '#dcfce7',
    text: '#166534',
    line: '#15803d',
    accent: '#86efac',
  },
  {
    fill: '#0e7490',
    softFill: '#cffafe',
    text: '#155e75',
    line: '#0e7490',
    accent: '#67e8f9',
  },
  {
    fill: '#4f46e5',
    softFill: '#e0e7ff',
    text: '#3730a3',
    line: '#4f46e5',
    accent: '#a5b4fc',
  },
  {
    fill: '#a21caf',
    softFill: '#fae8ff',
    text: '#86198f',
    line: '#a21caf',
    accent: '#f0abfc',
  },
  {
    fill: '#4d7c0f',
    softFill: '#ecfccb',
    text: '#3f6212',
    line: '#4d7c0f',
    accent: '#bef264',
  },
  {
    fill: '#475569',
    softFill: '#e2e8f0',
    text: '#334155',
    line: '#475569',
    accent: '#94a3b8',
  },
  {
    fill: '#a16207',
    softFill: '#fef9c3',
    text: '#854d0e',
    line: '#a16207',
    accent: '#fde047',
  },
  {
    fill: '#047857',
    softFill: '#d1fae5',
    text: '#065f46',
    line: '#047857',
    accent: '#6ee7b7',
  },
  {
    fill: '#0369a1',
    softFill: '#e0f2fe',
    text: '#075985',
    line: '#0369a1',
    accent: '#7dd3fc',
  },
];

export function getTrialLevelColors(level: number): TrialLevelColors | null {
  if (level <= 0) return null;
  return TRIAL_LEVEL_PALETTE[(level - 1) % TRIAL_LEVEL_PALETTE.length];
}
