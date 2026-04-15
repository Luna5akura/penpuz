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
