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
];

export function getTrialLevelColors(level: number): TrialLevelColors | null {
  if (level <= 0) return null;
  return TRIAL_LEVEL_PALETTE[(level - 1) % TRIAL_LEVEL_PALETTE.length];
}
