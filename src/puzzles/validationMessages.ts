import type { Locale } from '@/i18n/types';

/**
 * Validators deliberately return stable, human-readable Chinese strings so
 * they remain useful to non-UI callers (for example answer examples and
 * imported notes).  The board UI is bilingual, however, so it must translate
 * those strings at the presentation boundary instead of leaking Chinese into
 * an English session.
 */
const ENGLISH_VALIDATION_MESSAGES: Record<string, string> = {
  '存档中存在无法识别的线段': 'The saved board contains an invalid line segment.',
  '数字周围的线段数量不正确': 'The number of loop edges around a clue is incorrect.',
  '需要画出一条单一回路': 'Draw one single loop.',
  '回路不能分叉或产生端点': 'The loop may not branch or have dangling ends.',
  '所有线段必须连成一个单一回路': 'All line segments must form one single loop.',
  '羊必须在回路内': 'Every sheep must be inside the loop.',
  '狼必须在回路外': 'Every wolf must be outside the loop.',
  '数字格不能放置形状': 'A numbered cell cannot contain a shape part.',
  '数字周围的形状格数量不正确': 'A clue has the wrong number of surrounding shape cells.',
  '盘面中的形状与形状库不一致': 'The shapes in the grid do not exactly match the shape bank.',
  '不同形状不能正交或斜向接触': 'Different shapes may not touch orthogonally or diagonally.',
  '形状格必须正交连通': 'Every shape must be orthogonally connected.',
  '数字格必须属于洞穴': 'Every numbered cell must belong to the cave.',
  '数字与可见洞穴格总数不符': 'A clue does not match the number of visible cave cells.',
  '所有洞穴格必须正交连通': 'All cave cells must form one orthogonally connected area.',
  '洞穴外不能有被围住的涂黑区域': 'There may be no enclosed shaded area outside the cave.',
  '每个白格都必须填入 1~9 的数字': 'Every white cell must contain a digit from 1 to 9.',
  '同一横段或纵段内的数字不能重复': 'Digits may not repeat within a horizontal or vertical run.',
  '横段或纵段的数字总和不正确': 'A horizontal or vertical run has the wrong sum.',
  '线索格不可涂黑': 'Clue cells must remain unshaded.',
  '存在未连接数字的空白格': 'There is a white cell that is not connected to a clue.',
  '每个岛屿必须且只能包含一个线索': 'Each island must contain exactly one clue.',
  '海域必须全部连通': 'All shaded sea cells must be connected.',
  '不能出现 2×2 全黑区域': 'A 2×2 block may not be completely shaded.',
  '存在区域大小不匹配、同一区域内数字冲突，或相同大小区域正交相邻':
    'A region size or number constraint is violated.',
  '箭头数字与涂黑格数量不匹配，或线索格被错误使用。':
    'The arrow count, shaded cells, or clue cells do not satisfy Yajilin rules.',
  '回路、黑格或经过的格子不满足 Yajilin 规则。':
    'The loop, shaded cells, or visited cells do not satisfy Yajilin rules.',
  '存档中存在无法识别的线段，或回路为空。':
    'The saved board contains an invalid segment, or the loop is empty.',
  '数字周围的黑格数量不正确，或线索格被错误使用。':
    'A neighbour count is wrong, or a clue cell is used incorrectly.',
  '回路、黑格或相邻关系不满足 Koburin 规则。':
    'The loop, shaded cells, or neighbour relationships do not satisfy Koburin rules.',
  '盘面数据尺寸不正确。': 'The board dimensions are invalid.',
  '每行每列中，数字 1、2、3 都必须恰好出现三次。':
    'Each row and column must contain each of 1, 2, and 3 exactly three times.',
  '白格必须接触同号格，灰格不能接触同号格。':
    'Every white cell needs an orthogonal matching neighbour; gray cells may not have one.',
  '固定数字不能被修改。': 'Given numbers cannot be changed.',
  '灯泡不能互相照亮': 'Lights may not illuminate one another.',
  '所有非黑格都必须被照亮': 'Every non-black cell must be illuminated.',
  '数字线索周围的灯泡数量不正确': 'The number of lights around a clue is incorrect.',
  '水域线索格不能放置船只': 'A ship cannot be placed on a water clue.',
  '给定船段的形状或方向不匹配': 'A given ship segment has the wrong shape or direction.',
  '行列外侧数字必须等于该行或该列中的船格数':
    'Each outside row or column clue must equal the number of ship cells in that line.',
  '两艘不同的船不能斜向接触': 'Different ships may not touch diagonally.',
  '盘面上的船只必须与舰队中的形状和数量完全一致':
    'The ships on the board must match the fleet shapes and counts exactly.',
  '盘面数据尺寸不正确': 'The board dimensions are invalid.',
  '骨牌只能覆盖两个正交相邻的格子': 'A domino must cover two orthogonally adjacent cells.',
  '骨牌超出了盘面范围': 'A domino extends outside the board.',
  '骨牌不能覆盖空洞格': 'A domino cannot cover a blocked cell.',
  '存在不在目标列表中或重复使用的骨牌组合': 'A domino pair is missing, duplicated, or not in the target list.',
  '每个格子必须恰好属于一张骨牌': 'Every playable cell must belong to exactly one domino.',
  '目标骨牌组合尚未全部使用': 'Not all target domino pairs have been used.',
  '同一行中不能重复出现相同数字': 'A number may not repeat in a row.',
  '同一列中不能重复出现相同数字': 'A number may not repeat in a column.',
  '固定数字不能被修改': 'Given numbers cannot be changed.',
  '至少需要沿螺旋填出一轮完整数字序列': 'At least one complete number sequence must be filled along the spiral.',
  '沿螺旋读取的数字顺序不正确': 'The numbers do not follow the required spiral order.',
  '每个区域必须恰好包含一个字母': 'Each region must contain exactly one letter.',
  '相同字母的区域必须形状、朝向和字母相对位置都一致':
    'Regions with the same letter must have the same shape, orientation, and relative letter position.',
  '不同字母的区域不能是相同形状（旋转或镜像后也不行）':
    'Regions with different letters may not have the same shape, even after rotation or reflection.',
  '涂黑格不能正交相邻': 'Shaded cells may not be orthogonally adjacent.',
  '某个区域的黑格数量与线索不符': 'A region has the wrong number of shaded cells.',
  '横向或纵向都不能出现连续4格或以上同色':
    'There may not be four or more consecutive cells of one color horizontally or vertically.',
  '所有黑格必须正交连成一片': 'All shaded cells must form one orthogonally connected area.',
  '留白线段不能穿过两个或以上的区域边界':
    'An unshaded run may not cross two or more region borders.',
  '所有留白格必须连成一片': 'All unshaded cells must form one connected area.',
  '每一行都必须恰好包含一次每个指定数字': 'Each row must contain every specified number exactly once.',
  '每一列都必须恰好包含一次每个指定数字': 'Each column must contain every specified number exactly once.',
  '黑格线索的相邻数字数量或总和不正确': 'The adjacent count or sum in a clue cell is incorrect.',
  '线索周围的连续黑格段不符合': 'The contiguous shaded runs around a clue do not match.',
  '每个湖区必须恰好包含一个线索': 'Each lake must contain exactly one clue.',
  '线索数字必须等于所在湖区的格数': 'A lake clue must equal the size of its lake.',
  '有叉标记的格子不能填数': 'A crossed cell cannot contain a number.',
  '行外侧数字与该行连续数码组成的数字之和不符': 'A row-side clue does not match the sum of its consecutive digits.',
  '列外侧数字与该列连续数码组成的数字之和不符': 'A column-side clue does not match the sum of its consecutive digits.',
  '每行和每列都不能重复数字，且只能填入规定范围内的数字':
    'Rows and columns may not repeat numbers and may use only the permitted range.',
  '盘面外的可见摩天楼数量不正确': 'An outside skyscraper clue has the wrong visibility count.',
  '盘面外的可见摩天楼数量不正确。': 'An outside skyscraper clue has the wrong visibility count.',
  '星星之间有接触，或每行、每列、每个区域的星星数量不正确。':
    'Stars touch one another, or a row, column, or region has the wrong count.',
  '星星之间不能横向、纵向或对角相邻。': 'Stars may not be adjacent horizontally, vertically, or diagonally.',
  '每行、每列、每个区域中的星星数量都必须等于右上角提示。':
    'Every row, column, and region must contain the indicated number of stars.',
  '回路不能分叉，也不能出现断头线段': 'The loop may not branch or contain dangling segments.',
  '单一回路必须经过所有数字': 'The single loop must pass through every number.',
  '请先画出经过所有数字的单一回路': 'Draw a single loop through every number first.',
  '所有线段必须连成一条单一回路': 'All segments must form one single loop.',
  '数字表示回路在该区域内连续经过的格子数量': 'A number gives the length of the loop run in that region.',
  '每条线都必须恰好连接两个圆圈': 'Each line must connect exactly two circles.',
  '只有圆圈格可以作为线段的端点': 'Only circle cells may be endpoints of a line.',
  '线段不能分叉或形成自交': 'Lines may not branch or self-intersect.',
  '线段不能形成闭环': 'Lines may not form a closed loop.',
  '回路、涂黑或圆点约束尚未满足': 'Loop, shading, or circle constraints are not satisfied yet.',
  '每个区域必须恰好涂出一个四连块': 'Each region must contain exactly one tetromino.',
  '每个区域内的四个黑格必须正交连通': 'The four shaded cells in each region must be orthogonally connected.',
  '黑格不能形成 2x2 方块': 'Shaded cells may not form a 2×2 block.',
  '相邻区域的四连块不能是相同形状': 'Adjacent regions may not contain tetrominoes of the same shape.',
  '线索格不能涂黑': 'Clue cells must remain unshaded.',
  '不能出现 2x2 全黑区域': 'A 2×2 block may not be completely shaded.',
  '所有黑格必须连成一个整体': 'All shaded cells must form one connected area.',
};

const NURIKABE_AREA_MESSAGE = /^岛屿面积不符：预期\s*(\d+)，实际\s*(\d+)$/u;

/** Translate a validator message for the current UI locale. */
export function localizeValidationMessage(message: string | undefined, locale: Locale): string | undefined {
  if (!message || locale === 'zh-CN') return message;

  const direct = ENGLISH_VALIDATION_MESSAGES[message];
  if (direct) return direct;

  const areaMatch = message.match(NURIKABE_AREA_MESSAGE);
  if (areaMatch) {
    return `Island area mismatch: expected ${areaMatch[1]}, got ${areaMatch[2]}.`;
  }

  // Keep an English UI free of untranslated Han text when a future validator
  // adds a message without updating this table. Existing English messages are
  // returned unchanged.
  if (/\p{Script=Han}/u.test(message)) return 'The current board does not satisfy the puzzle rules.';
  return message;
}
