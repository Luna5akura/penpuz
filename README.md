# penpuz


一个按天轮换的纸笔谜题站点，当前已接入：

- `Nurikabe`
- `Fillomino`
- `Yajilin`

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

## 当前项目结构

和新增题型最相关的目录如下：

```text
src/
  App.tsx
  hooks/
    useDailyPuzzleSession.ts
  components/
    RulesSection.tsx
    examples/
      NurikabeExample.tsx
      FillominoExample.tsx
      YajilinExample.tsx
  puzzles/
    database.ts
    registry.tsx
    types.ts
    Nurikabe/
    Fillomino/
    Yajilin/
```

关键职责：

- `src/puzzles/types.ts`
  维护题型的数据结构定义。
- `src/puzzles/registry.tsx`
  维护题型注册中心：`parsePuzzLink`、`template`、`renderBoard`、`renderExample`。
- `src/puzzles/database.ts`
  维护每日题列表 `allPuzzles`，并通过注册中心解析题目。
- `src/components/RulesSection.tsx`
  渲染规则区；具体 example 内容由注册中心提供。
- `src/hooks/useDailyPuzzleSession.ts`
  管理每日题会话，不需要为新增题型单独修改。

## 现在如何添加一个新题型

下面以假设新增题型 `Slitherlink` 为例。

### 1. 在 `types.ts` 中补齐数据类型

你至少需要补这几类：

- 题面数据类型
- 规则区 example 数据类型
- `PuzzleData` 联合类型
- `PuzzleType`
- `PuzzleEntry` 如果这个题型有特殊来源格式，也要补进去

示意：

```ts
export interface SlitherlinkPuzzleData {
  type: 'slitherlink';
  width: number;
  height: number;
  clues: (number | null)[][];
}

export type PuzzleData =
  | NurikabePuzzleData
  | FillominoPuzzleData
  | YajilinPuzzleData
  | SlitherlinkPuzzleData;
```

如果规则示例的答案展示方式和现有题型都不一样，也要给 `PuzzleExample` 新增一个分支。

### 2. 新建题型目录并实现核心逻辑

建议目录：

```text
src/puzzles/Slitherlink/
  Slitherlink.tsx
  utils.ts
```

最低要求通常有两部分：

- `Slitherlink.tsx`
  主棋盘组件，接收：
  - `puzzle`
  - `startTime`
  - `onComplete`
- `utils.ts`
  解析、判题、辅助函数

当前项目中可以直接参考：

- `src/puzzles/Nurikabe/`
- `src/puzzles/Fillomino/`
- `src/puzzles/Yajilin/`

### 3. 提供题目链接解析函数

如果你的题目来源是 `pzprxs` 链接或其他编码字符串，需要在该题型的 `utils.ts` 中提供：

```ts
export function parseSlitherlinkLink(link: string): SlitherlinkPuzzleData | null
```

然后在注册中心中接入它。

如果你的题型不走链接，而是只写本地静态题面，也可以先不写 parser，但一般还是建议补上，这样题库维护会轻松很多。

### 4. 在 `registry.tsx` 注册题型

这是现在接入新题型最核心的一步。

你需要做四件事：

1. 引入主棋盘和 example 组件
2. 引入 `parsePuzzLink`
3. 提供 `template`
4. 在 entry 上实现 `renderBoard` 和 `renderExample`

示意：

```ts
slitherlink: {
  parsePuzzLink: parseSlitherlinkLink,
  template: {
    type: 'slitherlink',
    name: 'Slitherlink',
    nameCn: '数回',
    rulesTitle: '游戏规则',
    rules: [...],
    exampleTitle: '例题（5×5）',
    playableLabel: '可游玩例题',
    answerLabel: '正确答案',
    example: ...
  },
  renderBoard: ({ puzzle, startTime, onComplete, key }) => (
    <SlitherlinkBoard key={key} puzzle={puzzle} startTime={startTime} onComplete={onComplete} />
  ),
  renderExample: (template) => (
    <SlitherlinkExample ... />
  ),
}
```

注册完成后，这几个能力会自动生效：

- `database.ts` 可以通过 `resolvePuzzleEntry()` 解析题目
- `App.tsx` 可以通过 `renderPuzzleBoard()` 渲染棋盘
- 规则文案和题型名称可以通过 `template` 获取
- `RulesSection.tsx` 可以通过注册中心渲染 example

## 5. 在 `database.ts` 中加入题库条目

把题目加入 `allPuzzles`。

当前支持两种写法：

### 写法 A：链接题面

```ts
{
  type: 'slitherlink',
  puzzLink: 'https://...'
}
```

### 写法 B：直接写本地题面对象

```ts
{
  type: 'slitherlink',
  puzzle: {
    type: 'slitherlink',
    width: 5,
    height: 5,
    clues: [...]
  }
}
```

如果你想让新题型进入每日轮换，只需要把条目加入 `allPuzzles`。

## 6. 补规则区 example 组件

你仍然需要新建 example 组件，例如：

`src/components/examples/SlitherlinkExample.tsx`

但现在不需要再去改 `RulesSection.tsx`，只需要在 `registry.tsx` 中把它接进去即可。

## 7. 完成后建议检查

至少跑这两个命令：

```bash
pnpm build
pnpm exec eslint src/puzzles/registry.tsx src/puzzles/database.ts src/puzzles/types.ts
```

如果你刚新增了题型组件，也建议一起检查：

```bash
pnpm exec eslint src/puzzles/Slitherlink/ src/components/examples/SlitherlinkExample.tsx
```

## 新增题型的最小清单

如果你只想快速照着做，可以按这个 checklist：

1. 在 `src/puzzles/types.ts` 加类型
2. 新建 `src/puzzles/<Type>/` 目录和主棋盘组件
3. 补 `parse<Type>Link()`
4. 新建 `src/components/examples/<Type>Example.tsx`
5. 在 `src/puzzles/registry.tsx` 注册 `parser + template + renderBoard + renderExample`
6. 在 `src/puzzles/database.ts` 的 `allPuzzles` 里加题目
7. 运行 `pnpm build`

## 当前还存在、但不影响新增题型的改进空间

如果以后还想继续整理结构，优先级大概是：

- 把各题型的 example 渲染抽成统一接口
- 拆分较大的交互文件，例如 `Fillomino.tsx`、`Yajilin/utils.ts`
- 补一层题型接入自检文档或测试样例

这些都不是新增题型的硬前置，所以如果题型集合已经稳定，可以先不动。
---

## 新增题型详细流程（以 Kurarin / 黑暗回路为例）

下面是目前仓库里“从 0 到可上线”新增一个题型的完整执行顺序。  
建议严格按顺序做，避免出现“能渲染但不能入库”或“能玩但不能保存进度”这类断层。

### 1. 先定义类型（`src/puzzles/types.ts`）

必须补齐三类类型：

1. 题面数据类型（例如 `KurarinPuzzleData`）
2. 题目元素类型（例如 `KurarinClue`、`KurarinClueColor`）
3. 规则示例联合类型（`PuzzleExample` 新增 `kurarin` 分支）

同时把新题型加入：

1. `PuzzleData` 联合类型
2. `PuzzleType`（自动来自 `PuzzleData['type']`）
3. 所有依赖题型联合的地方（例如 `CompletionModal` 的 `puzzleType`）

### 2. 实现 parser + 核心工具（`src/puzzles/Kurarin/utils.ts`）

这一步至少要有：

1. `parseKurarinLink(link)`：把 `p?kurarin/...` 链接转成 `KurarinPuzzleData`
2. 网格状态初始化（如 `createEmptyKurarinGrid`）
3. 边 key 工具（`getEdgeKey` / `parseEdgeKey` / `createEdgeSet`）
4. 命中检测（`detectKurarinHitTarget`，用于区分点到的是格子还是边）
5. 校验函数（`validateKurarin`）

Kurarin 的校验建议拆成三层：

1. 回路合法性：不分叉、不自交、所有未涂黑格都在同一回路中
2. 黑格与边冲突：黑格不能带线段
3. 圆圈约束：黑/白/灰三色分别满足“黑多/白多/相等”

### 3. 实现交互棋盘（`src/puzzles/Kurarin/Kurarin.tsx`）

推荐直接复用现有题型（如 Yajilin）的历史与试填框架：

1. `usePuzzleHistory` 快照（含 `grid`、`loopEdges`、`crossedEdges`、trial level）
2. `startBatch` / `finishBatch` 保证拖动过程合并历史
3. 统一 `onSnapshotChange` 让每日进度可持久化

Kurarin 交互规范（本项目约定）：

1. 桌面端
2. 左键拖动格子：连续涂黑或取消涂黑
3. 右键拖动/点击格子：放置或取消叉格
4. 右键点击边：在边上放置或取消叉号
5. 手机端
6. 空白格点击/拖动 -> 涂黑
7. 涂黑格点击/拖动 -> 叉格
8. 叉格点击/拖动 -> 空白

### 4. 统一样式与绘制规则

不要在题型文件里硬编码重复样式，优先使用 `src/puzzles/boardTheme.ts`：

1. 棋盘外框：`getBoardFrameStyle`
2. 格子底色：`getBoardCellColors`
3. 叉号字号/样式：`getBoardCrossFontSize` + `getCrossMarkStyle`
4. 响应式格宽：`getResponsiveCellSize`

Kurarin 的三色圆圈建议用 SVG 叠加绘制（便于后续高亮、动画、invalid 态扩展）。

### 5. 接示例组件（`src/components/examples/KurarinExample.tsx`）

示例区需要两块：

1. 左侧可游玩示例（直接复用真实 `KurarinBoard`）
2. 右侧答案展示（带遮罩、点击确认后揭晓）

并确保示例答案里可同时显示：

1. 黑格
2. 回路线
3. 边叉
4. 三色圆圈

### 6. 在注册中心接入（`src/puzzles/registry.tsx`）

这是最关键的接线步骤，必须一次接全：

1. import 新题型 Board / Example / parser
2. `PuzzleRegistry` 类型新增 `kurarin`
3. `puzzleRegistry.kurarin` 新增完整 entry
4. `template` 填题型名、规则、示例题面
5. `renderBoard` / `renderExample` 正确返回组件

只要这里接通，`RulesSection`、首页渲染、历史回放都会自动走通。

### 7. 加入题库轮换（`src/puzzles/database.ts`）

在 `allPuzzles` 里加一条 `p?kurarin/...` 即可参与每日轮换。  
若 parser 返回 `null`，这一天会无法出题，所以加库前要先本地验证 parser。

### 8. 回归检查（必须执行）

至少跑：

```bash
pnpm build
pnpm exec eslint src/puzzles/Kurarin src/components/examples/KurarinExample.tsx src/puzzles/registry.tsx src/puzzles/types.ts src/puzzles/database.ts
```

并手测以下场景：

1. 新题型当天题面是否可正常打开
2. Undo / Redo / 试填存档是否正常
3. 刷新页面后进度是否恢复
4. 完成后是否正确触发计时结束与完成弹窗
5. 历史记录中加载该题型是否正常
