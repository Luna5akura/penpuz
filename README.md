# penpuz

一个按北京时间每天轮换的纸笔谜题站点。题目来自 PuzzLink/pzpr 编码，支持中英文界面、答题进度保存、撤销/重做、试错分支、历史回放和规则速查。

## 已接入题型

当前注册中心中的题型包括：

- 数墙（Nurikabe）、数织（Fillomino）、仙人指路（Yajilin）、数回（Slitherlink）
- 仙人指邻（Koburin）
- 邻居（Neighbors，数字 1/2/3 邻接题，支持 9×9 题面；题面来自 WPF Puzzle GP 2015 第 4 轮）
- 摩天邻居（Sky-neighbors，9×9 摩天楼 + 邻接题；题面来自 WPF Puzzle GP 2015 第 4 轮）
- 星战（Star Battle）、黑白墙（Heyawake）、Aqre、Mintonette、Nikoji、灯（Akari）
- 黑暗回路（Kurarin）、Walkwalk、LITS、湖（Lakes）、Tapa
- 魔术夏（Magic Summer）、摩天楼（Skyscrapers）、战舰（Battleship）
- Domino Search、魔法蜗牛（Magic Snail）、斯洛伐克和（Slovak Sums）
- 数和（Kakuro）
- 狼羊围栏（Wolves and Sheep Fences，PuzzLink ID：`wolvesandsheepfences`）

题型的短 ID、中文名和英文名统一维护在 `src/puzzles/registry.tsx`。笔记编辑器和规则速查会从同一注册中心读取题型，避免出现“题库支持但其他入口不支持”的分叉。

## 本地开发

```bash
pnpm install
pnpm dev
```

常用检查：

```bash
pnpm build
pnpm lint
```

开发测试页：访问 `/?page=database-test`（主页顶部烧瓶图标也可打开）。页面会从
`database.ts` 为每个已注册题型自动选取第一道可解析题目；新增题型和题库条目后会自动出现。
电脑端可在页面顶部切换每行显示 1、2 或 3 道题，移动端始终使用单列布局。

`pnpm lint` 同时执行 ESLint 和棋盘样式契约检查。

## 目录职责

```text
src/
  App.tsx                         页面入口
  hooks/useDailyPuzzleSession.ts  每日题、存档和完成状态
  components/                     页面、规则区、示例和笔记回放
  puzzles/
    types.ts                      题型数据与示例的联合类型
    registry.tsx                  题型注册中心
    database.ts                   每日题库（PuzzLink 链接 + 难度）
    boardTheme.ts                 统一木质棋盘、线条、文字和响应式尺寸
    shared/                       可复用的数字填格、涂色棋盘
    Koburin/                     仙人指邻（Koburin）解析器、校验器和棋盘
    Neighbor/                    Neighbors 数字邻接题解析器、校验器和棋盘
    SkyNeighbor/                 Sky-neighbors 摩天楼邻接题解析器、校验器和棋盘
    Kakuro/                       数和解析器、校验器和棋盘
    WolvesAndSheep/               狼羊围栏解析器、校验器和棋盘
```

核心职责：

- `types.ts` 定义题面、快照所需的数据形状，并维护 `PuzzleData` / `PuzzleExample` 联合类型。
- `registry.tsx` 为每个题型提供 `parsePuzzLink`、规则模板、主棋盘和规则区示例。
- `database.ts` 只保存 `{ puzzLink, difficulty }`，解析统一通过 `resolvePuzzleEntry()` 完成。
- `boardTheme.ts` 提供跨题型共用的棋盘外框、格线、字体和盘面外线索 gutter。
- `boardTheme.ts` 还集中维护所有棋盘视觉 token：`boardStrokeWidths`（边界/格线/交叉线宽度）、`boardLayoutMetrics`（棋盘间距与示例尺寸）、`boardControlMetrics`（数字面板等控件尺寸）、`getBoardCellStyle`（单元格语义色与选中态）、`getBoardTrialCellStyle`（试错色）、`getBoardBoundaryStrokeMetrics`（区域边界线）以及面板/徽章/控件样式 helper。
- `woodBoardTheme.darkCell` / `darkCellText` 是所有黑格、涂黑格和深色线索格的唯一颜色来源（与数墙 Nurikabe 一致）。
- `BoardCellOutline` 是所有灰色/带框格子的唯一描边组件；CSS 单元格与 SVG 回放都必须通过它或 `getBoardCellOutlineRect()` 绘制。
- `notes/` 与每日题页面都使用同一套题型注册和运行时数据校验。

## 如何添加题型

下面以 `example` 为占位符，描述当前项目的最小接入流程。

### 1. 定义数据类型

在 `src/puzzles/types.ts` 中新增：

1. 题面数据接口（必须包含字面量 `type`、`width`、`height`）。
2. 需要时单独定义 clue、边或区域类型。
3. 将题面加入 `PuzzleData`，将规则示例加入 `PuzzleExample`。

`PuzzleType` 会从 `PuzzleData['type']` 自动推导，无需重复维护。

### 2. 实现解析和校验

新建 `src/puzzles/<Type>/utils.ts`，实现：

```ts
export function parseExampleLink(link: string): ExamplePuzzleData | null;
export function validateExample(/* 当前快照 */, puzzle: ExamplePuzzleData): ValidationResult;
```

解析器应按 pzpr 官方编码实现，并拒绝越界尺寸、截断数据和非法字符。涉及边/线段时，统一使用 `src/puzzles/gridUtils.ts` 的 edge key 工具；不要在组件中重复拼接坐标字符串。

### 3. 实现主棋盘

在 `src/puzzles/<Type>/<Type>.tsx` 中：

- 接入 `usePuzzleHistory`，支持 `initialSnapshot`、`onSnapshotChange`、撤销/重做和试错。
- 完成判定只使用校验器的 `valid` 结果。
- 棋盘尺寸、颜色、线宽和盘面外线索优先复用 `boardTheme.ts`。
- 鼠标、触屏和键盘操作保持同一语义；固定线索不可被编辑。

若题型与已有交互模型相同，优先组合 `NumberPlacementBoard`、`ShadingBoard` 或 `SlitherlinkBoard`，将差异通过 renderer/validator 参数注入。

### 4. 注册规则和示例

在 `registry.tsx` 中为题型补齐：

```ts
{
  parsePuzzLink: parseExampleLink,
  template: {
    type: 'example',
    name: { 'zh-CN': '中文名', en: 'English name' },
    rulesTitle: { 'zh-CN': '游戏规则', en: 'Rules' },
    rules: { 'zh-CN': ['规则 1'], en: ['Rule 1'] },
    exampleTitle: { 'zh-CN': '例题（5×5）', en: 'Example (5×5)' },
    playableLabel: { 'zh-CN': '题面', en: 'Puzzle' },
    answerLabel: { 'zh-CN': '正确答案', en: 'Answer' },
    example: /* 与组件数据类型一致 */,
  },
  renderBoard: /* 主棋盘 */,
  renderExample: /* 规则区示例 */,
}
```

示例统一显示“题面 / Puzzle”和“正确答案 / Answer”，答案默认遮罩并要求确认后揭晓。示例应直接复用真实棋盘或同一套绘制工具，避免题面和答案的坐标系统漂移。

### 5. 加入每日题库

`PuzzleEntry` 当前只接受 PuzzLink 链接和难度：

```ts
{
  puzzLink: 'https://puzz.link/p?example/5/5/…',
  difficulty: '困难',
}
```

将条目加入 `src/puzzles/database.ts` 后，`resolvePuzzleEntry()` 会按链接中的题型 ID 调用注册中心解析器。项目目前不支持在 `PuzzleEntry` 中直接嵌入本地 `puzzle` 对象；规则示例的静态题面应放在注册中心或对应 example 组件中。

### 6. 同步文案和笔记入口

- 中文规则和英文规则都要补齐，术语与 `ruleQuickReference.ts` 保持一致。
- 题型加入注册中心后，笔记类型选择器、历史元数据和规则速查会自动出现；若使用别名链接，在 `getPuzzleTypeFromLink()` 中显式登记别名。
- 需要特殊快照绘制时，在 `NotePuzzleBoard.tsx` 增加只读回放分支，并复用统一的 `boardTheme`。

## 变更后的验证清单

```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
./node_modules/.bin/eslint .
node scripts/check-puzzle-styles.mjs
./node_modules/.bin/vite build
git diff --check
```

新增题型至少还应手测：链接解析、空题面与非法数据、数字/线段输入、撤销重做、试错存档、刷新恢复、完成弹窗、规则示例答案遮罩、历史回放和移动端窄屏布局。

## 题型实现约定

- 线段 key 使用 `h-row-col` / `v-row-col`，其中 `h` 表示水平边、`v` 表示垂直边。
- 点阵类题型（例如 Kurarin）的 clue 坐标按点阵坐标处理，不要当作格子坐标。
- Kakuro 黑格使用左上到右下对角线：右上三角显示横向和，左下三角显示纵向和；缺失 clue 用空白表示。
- `wolvesandsheepfences` 是官方 Wolves and Sheep Fences 的 PuzzLink ID，`shwolf` 属于另一种题型，不应混用解析器或规则。
- 所有固定线索、答案元素和试错颜色都应使用统一主题 token，避免同一题型在主棋盘、示例和笔记缩略图中出现不同颜色。
- 题型组件不得声明自己的颜色、边界线宽度、阴影或固定棋盘尺寸；需要新增视觉语义时先在 `boardTheme.ts` 增加 token/helper，再由题型调用。`trialStyles.ts` 只负责试错层级调色板。
- 新增题型必须通过 `pnpm lint:puzzle-styles` 的棋盘样式契约：不得引入旧的深色 token、独立的灰格 inset 阴影或自定义棋盘外框。
