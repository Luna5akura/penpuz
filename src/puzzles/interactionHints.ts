// src/puzzles/interactionHints.ts
import type { LocalizedText } from '@/i18n/types';
import type { PuzzleType } from './types';

export interface InteractionHint {
  label: LocalizedText;
  detail: LocalizedText;
}

const entry = (labelZh: string, labelEn: string, detailZh: string, detailEn: string): InteractionHint => ({
  label: { 'zh-CN': labelZh, en: labelEn },
  detail: { 'zh-CN': detailZh, en: detailEn },
});

/**
 * Per-type operation hints shown in the shortcut panel.  Types without a
 * specific entry fall back to the generic keyboard list.
 */
export const interactionHints: Partial<Record<PuzzleType, InteractionHint[]>> = {
  fillomino: [
    entry('填入数字', 'Fill numbers', '点击或悬停空格后按 1-9 填入区域面积；按住数字格拖动可复制该数字。', 'Click an empty cell or hover it and press 1-9; drag from a numbered cell to copy its value.'),
    entry('画边界', 'Draw borders', '在格线上点击或拖动，添加/删除区域边界。', 'Click or drag on grid lines to add/remove region borders.'),
    entry('检查', 'Check', '工具栏的放大镜按钮会高亮不符合规则的格子。', 'The magnifier button highlights cells that violate the rules.'),
  ],
  'fillomino-checkerboard': [
    entry('填入数字', 'Fill numbers', '点击或悬停空格后按 1-9 填入区域面积；按住数字格拖动可复制该数字。', 'Click an empty cell or hover it and press 1-9; drag from a numbered cell to copy its value.'),
    entry('画边界', 'Draw borders', '在格线上点击或拖动，添加/删除区域边界。', 'Click or drag on grid lines to add/remove region borders.'),
    entry('棋盘染色约束', 'Checkerboard constraint', '相邻区域必须可交替染成黑白两色；无需输入颜色，检查按钮会自动判定。', 'Adjacent regions must be 2-colorable; you never enter colors, the check button verifies it for you.'),
  ],
  starbattle: [
    entry('放置星', 'Place stars', '点击格子放置或移除星；每行/列/区恰好两（或题设数量）颗星。', 'Click a cell to place or remove a star; every row, column and region takes exactly the given number of stars.'),
    entry('标记空格', 'Mark empty cells', '右键点击（或拖动）标记非星格，辅助排除。', 'Right-click or drag to mark non-star cells.'),
  ],
  nurikabe: [
    entry('涂黑 / 擦除', 'Shade / erase', '点击或拖动涂黑/擦除格子；数字格不能涂黑。', 'Click or drag to shade/unshade cells; numbered cells cannot be shaded.'),
  ],
  slither: [
    entry('画回路', 'Draw the loop', '点击格子之间的边画出回路，再次点击擦除。', 'Click cell edges to draw the loop; click again to erase.'),
  ],
  masyu: [
    entry('放珍珠', 'Place pearls', '点击格子循环切换：空白 → 黑珠 → 白珠。', 'Click a cell to cycle: empty → black pearl → white pearl.'),
    entry('画回路', 'Draw the loop', '点击格子之间的边画出经过所有珍珠的回路。', 'Click cell edges to draw the loop through every pearl.'),
  ],
  kakuro: [
    entry('填入数字', 'Fill numbers', '点击空格后按 1-9 填入数字；点线索格切换横/竖求和。', 'Click a white cell and press 1-9; click a clue to switch across/down.'),
  ],
  tapa: [
    entry('涂黑 / 擦除', 'Shade / erase', '点击或拖动涂黑/擦除空格；数字格不能涂黑。', 'Click or drag to shade/unshade cells; clue cells cannot be shaded.'),
  ],
  akari: [
    entry('放灯 / 画叉', 'Place lamps / crosses', '点击格子循环切换：空格 → 灯 → 叉。', 'Click a cell to cycle: empty → lamp → cross.'),
  ],
  heyawake: [
    entry('涂黑 / 擦除', 'Shade / erase', '点击或拖动涂黑/擦除格子；含数字的区域按数字涂黑。', 'Click or drag to shade/unshade cells per the room clues.'),
  ],
};

export function getInteractionHints(type: PuzzleType): InteractionHint[] {
  return interactionHints[type] ?? [];
}
