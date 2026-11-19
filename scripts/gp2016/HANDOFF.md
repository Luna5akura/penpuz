# WPF GP 2016 转录任务交接文档

> 本文件是跨会话的完整工作交接。接力的助手请先通读全文，再按「下一步」继续。

## 任务目标
把 WPF Puzzle GP 2016（8 轮竞赛册）中、penpuz 已支持题型但尚未入库的题目转录进 `src/puzzles/database.ts`。
**硬性质量闸门：每道题必须通过 cspuz 求解器的唯一性验证（isUnique: true）才能入库。** 识别不出来的题目跳过（用户明确授权）。

## 数据源
- PDF 原件：`~/Projects/Puzzle/downloads/paper_puzzle_competitions/gp.worldpuzzle.org/sites/default/files/Puzzles/2016/`（55 个 PDF：每轮 IB=规则册、CB=题目册 Casual/Competitive、SB=解答册）
- 文本缓存：`~/Projects/Puzzle/build/typetext/paper_puzzle_competitions/gp.worldpuzzle.org/sites/default/files/Puzzles/2016/`（.pdf.txt，pdftotext -layout 输出）
- 本仓库：`/home/luna/Projects/VSCode/Webstorm/penpuz`，转录工具在 `scripts/gp2016/`

## 三条管线（全部可用）
1. **文本提取**：`nix-shell -p poppler-utils --run "pdftotext -bbox <pdf> out.html"` → bbox 逐词坐标（xMin/yMin/xMax/yMax）→ 行列聚类 → 重建网格
2. **矢量提取**：`scripts/gp2016/pdfvec.py`（纯 Python PDF 内容流解析器）：
   - 支持 m/l/c/re/cm/S/f/q/Q/Do + Form XObject 递归
   - 输出全部线段 `(x1,y1,x2,y2,线宽)`（PDF 坐标，原点左下）；另有 `interp.fills = [(填充色rgb, [(x,y)...])]` 记录 f/F/B 填充路径（re 矩形、贝塞尔已采样）
   - 用法见文件内注释；已修复的坑：仿射矩阵布局 `[a b c d e f]` 平移在 e/f、单位矩阵必须是 `[1,0,0,1,0,0]`、`cm` 是双字符操作符、S/f 描边操作符以独立 token 出现、`<</MCID` 无配对 `>` 死循环
3. **唯一性验证**（质量闸门）：pzprjs 的 WASM 求解器后端
   - WASM 文件：`~/Projects/VSCode/Webstorm/puzzle/pzprjs/dist/wasm/cspuz_solver_backend.{js,wasm}`
   - 调用方式：`import` js 胶水 → `_prepare_input_buffer(len)` + `HEAPU8.set(encoded, ptr)` + `_solve_problem(ptr, len)` → 结果 JSON `{status, description:{isUnique,...}}`
   - **URL 必须带 `https://puzz.link/p?` 前缀**
   - 辅助脚本模板在 `/tmp/gp2016/`（已清理；重建方法见下）
   - 注意：`inspect` 类脚本曾出现 `_malloc` 误判导致结果不稳定，统一用 `_prepare_input_buffer`

## 已验证入库的题目（16 题，isUnique: true）
| 题 | 链接 | 难度 | 作者 |
|---|---|---|---|
| R1 Nurikabe 8 (10×10) | `nurikabe/10/10/pi2pm5pi3pm2j6phej7pi` | 困难 | Swaroop Guggilam |
| R5 Cave 25 (10×10) | `cave/10/10/i3k6g3i8j8p5i5h4j7ph4j6h3i8p5j4i7g6k7i` | 困难 | Roger Barkan |
| R5 Cave 26 (10×10) | `cave/10/10/5m5i9g5g5pp95l7bh79h57l99pp5g7g5i5m5` | 困难 | Roger Barkan |
| R5 Cave 27 (11×11) | `cave/11/11/h5l5n5h55pg5ha98l5gak5ja98j5k7g5l667h5pg55h5n5l5h` | 极难 | Thomas Snyder |
| R1 Slitherlink 14 (10×10) | `slitherlink/10/10/2i2j0g22g2g02h20g222h02h00g2g0i2i22g0h0g22i2i2g2g22h02h022g22h20g2g02g0j0i2` | 困难 | Rajesh Kumar |
| R1 Slitherlink 15 (9×6) | `slitherlink/9/6/g31h1g1h13g3h31g111h11g13g3g1g1k3k1g1g1g31` | 困难 | Rajesh Kumar |
| R1 Slitherlink 16 (9×9) | `slitherlink/9/9/g3h2h3g21g1h2g2g1113h1i21g1h3g3h3h1g2h2g21i2h3122g2g1h2g3h3h3h2g` | 困难 | Rajesh Kumar |
| R5 Slitherlink 19a (9×10) | `slitherlink/9/10/p30111231g2l3g3g1111g3g1g1h1g3g3g1h1g1g1g1111g0g1l2g13213103o` | 困难 | Thomas Snyder |
| R5 Slitherlink 20b (11×5) | `slitherlink/11/5/g311n221g3222i022g2103i213g2232pi` | 困难 | Thomas Snyder |
| R7 Domino Search 22 (8×8) | `domino-search/8/8/g611651g2611033000325334005gg646613gg2553225015542264412g043446g` | 困难 | Bram de Laat |
| R7 Domino Search 23 (8×7) | `domino-search/8/7/51445253544002465012261356302115161046033320261404663325` | 困难 | Bram de Laat |
| R7 Domino Search 24 (11×10) | `domino-search/11/10/62292063566713342088514369859121080026644323518569887484055799725740311106641256357339422879493407817780091957` | 极难 | Bram de Laat |
| R1 Four Winds 1 (10×10) | `fourwinds/10/10/b03a05b03g05d03f04a02c05n05b08n06c02a08f08d09g02b02a02b` | 困难 | Swaroop Guggilam |
| R1 Four Winds 2 (9×9) | `fourwinds/9/9/02a08b02b02a02b04b02o04c04c04c04c04o02b02b02a04b02b06a02` | 困难 | Rajesh Kumar |
| R1 Four Winds 3 (9×9) | `fourwinds/9/9/b01c03f09d03a05e01c03f07b00b05f03c03e05a01d07f03c05b` | 困难 | Prasanna Seshadri |
| R1 Four Winds 4 (10×10) | `fourwinds/10/10/a01d03g05d05b03d05b03d03g05d03b05d05g05d05b03d05b03d03g03d07a` | 困难 | Prasanna Seshadri |

另有棋盘码牌 ×4（`fillomino-checkerboard/…`，此前会话按官方解答核对入库；cspuz 无该变体求解器，用普通 fillomino 做一致性检查）。

## 跳过清单（用户授权跳过，附原因）
- **R5 Slitherlink 20a/21a/21b**：线索级错误或官方 PDF 渲染损坏。20a 两解只差一格的局部歧义；SB 解答图区域出现两条独立回路（官方 PDF 版面错乱）。已穷举尺寸/偏移 180+ 组合。
- **R1 Nurikabe 9/10、R5 Fillomino 13**：SB 解答册渲染自相矛盾（线索与解答图比例不一致）。Nurikabe 9 已定位到 11×15 可满足但非唯一，两解差 (11,4)/(12,3) 两格。
- **R6 Tapa 24-26**：变体「Tapa (LITS rules)」，标准 tapa 求解器只能做松弛验证，无法确认唯一性。25 号线索已提取（8 个线索格含 [1,4] 双数线索）。
- **R6 Lighthouses/Akari 18-20**：黑格为矢量填充绘制，与白格网格线无法用线段区分；需要给 pdfvec.py 增加「填充路径（f 操作符）单独输出」能力。
- **R7 EasyAs 19-21**：字母集 {A,B,C,D}（4 字母），penpuz 的 abc-box 只支持 {A,B,C}。
- **R7 EasyAs 19-21 / R8 EasyAs 30-32（全部 Easy as... 题）**：**题型不匹配，必须跳过**。penpuz 的 abc-box 是「全填字母分组题」（每格必须 A/B/C，外侧线索=连续同字母组的字母/长度，无空格概念），而 GP2016 的 Easy as... 是「留空 + 每行恰好一次 + 首字母线索」题（SB 解答确认 30/31/32 每行均含空格）。两者规则完全不同，无法互相表达。且 cspuz 的 abcbox 求解器是松弛模型（全填、不校验每行恰好一次、`Uniqueness::NotApplicable` 不输出 isUnique），**无法作为唯一性闸门**。30-32 三题的线索与官方解答已完整提取（见下），若日后 penpuz 新增 Easy As ABC 题型可直接复用。
  - R8 30（5×5）：top c3=C,c4=A；bottom c1=B,c2=B；left r1=C,r2=B；right r2=A,r4=A。解：`XAXCB / CXABX`（30a=r3, 30b=r1）。
  - R8 31（6×6）：top c0=C,c1=B,c3=B；bottom c0=B,c2=C,c3=C,c5=C；left r1=C,r2=B,r4=A；right r1=A,r2=C,r3=B。解：r0=BAC..., r1=.CB..A., r2=.BA...C, r3=A..CB., r4=...ACB, r5=C..B.A（31a=r4, 31b=r1）。
  - R8 32（7×7）：top c0=A,c1=C,c3=C,c4=A,c5=B,c6=A；bottom c0=C,c1=A,c2=C,c3=B,c5=C,c6=B；left r1=B,r3=C,r4=A,r6=B；right r1=C,r2=C,r4=B,r6=A。解：`XXAXCXB / BXXAXCX`（32a=r4, 32b=r1）。
- **R8 Arrows 33-35**：已勘察页面；箭头为矢量图形，待提取器支持。

## 关键经验教训（重要！）
1. **CB 数字渲染比例异常**：R5 竞赛册第 2 页数字格距 22.5px vs 真实网格 27px（5/6）；R8 为 13.5 vs 27（1/2）。数字位置不能直接当格子坐标，必须先用**矢量网格线**确定真实几何。
2. **SB 解答册不可靠**：线索与解答图比例不一致（12.6 vs 16.8 = 3/4），部分区域版面错乱。SB 的布局 txt（非 bbox）完全不可用于位置核对。
3. **数字对齐**：CB 中数字通常**左对齐**在格左缘，或**居中**在格心——不同 PDF/题型不同，必须用网格线反推。
4. **网格比数字跨度大**：多道题的网格比线索数字的跨度宽（如 19a=9 宽但数字只占 8 列、20b=11 宽数字占 8 列）——穷举「宽度 × 高度 × 行列偏移」时要把范围放宽。
5. **编码兼容性**：nurikabe/cave/fillomino/slitherlink/domino-search 的 g-z 跳格、a-f 十六进制值与 cspuz 一致；tapa 的多数字线索用 base36 对（360+a*6+b）；abc-box 用 excell 流格式（penpuz 的 parsePzprPayload 与 Atol-Solver 一致）。**domino-search 的空格必须用 `g`（跳格）而不是 `.`**——cspuz 的 `.` 表示非法格（直接 error），penpuz 两者都当空格。**fourwinds/masyu 用 pzprv3 流**：fourwinds 每格 = 方向数码 0-4 + 数字十六进制（'a'-'z' 跳格）；masyu 用 MultiDigit(3,3) = 每 base36 字符编码 3 格（0=空、1=白圈、2=黑圈，值 0-26，无跳格）。
6. **isUnique 在 JSON 末尾**：`_solve_problem` 返回的 JSON 中 `isUnique` 字段位于 description 末尾（data 数组之后），且**必须传入完整 `https://puzz.link/p?` 前缀 URL**，否则后端走别的分派路径不输出 isUnique。
7. **pdfvec.py 已修复 `<` 死循环**：R8 内容流出现 `<</MCID` 字典开头且无配对的 `>`，旧代码 `j=content.find(b'>',i)+1` 得 0 导致死循环。现已把 `<<` 当作独立 token、无 `>` 时跳到流末尾。
8. **cspuz 唯一性检查**：`isUnique:false` 可能只是「枚举到 2 个解」——大网格/复杂题可能因为线索位置错一格导致。用 `_enumerate_answers_problem` 枚举 2 个解对比差异格，能快速定位错线索。

## 排期系统（勿破坏）
- `src/puzzles/rotationSchedule.ts`：冻结的每日排期（1500 天）。**历史日期（≤ 今天）永不改动**；未来日期可用 `node scripts/commit-rotation.mjs 1500` 重排（先排近 90 天未出现的题，去重）。
- `src/puzzles/database.ts` 的 `getAllDatabasePuzzles` 遍历完整实况轮换（全部题目页）；`buildBalancedRotation` 从难度桶两端交替取题分散新题。
- 新增题目后必须跑 `node scripts/commit-rotation.mjs 1500` 让新题进入未来排期。

## 下一步（按顺序）
1. ~~R8 EasyAs 30-32~~ → **已定论跳过**（penpuz 无 Easy As ABC 题型；abc-box 规则不匹配），详见跳过清单。
2. ~~R7 Domino Search 22-24~~ → **已完成**（isUnique: true ×3，已入库）。
3. ~~R1 Four Winds 19-22~~ → **已完成**（isUnique: true ×4；1-4 号题此前已全部在库，本次补验证并修正元数据：1/2/3 难度简单→困难、补作者）。
4. ~~pdfvec.py 填充路径~~ → **已完成**：Interp 新增 fills 列表（f/F/f*/B/b* + rg/RG/k/K/g/G 颜色追踪，re 改为入 path、n/W 改为丢弃，贝塞尔采样入路径）。主程序打印每页 segments/fills 数。
5. **Masyu 全部完成**：R2 21-24、R4 24-26 共 7 题此前已全部入库，本次 cspuz 逐题验证 isUnique:true ×7，并修正难度（简单→困难）与作者（Matus Demiger / Zoltán Horváth）。
6. **库内已转录且 cspuz 验证通过**（带 PGP2016R3/R4 标签，20 条）：星战 R3×3、R4×3；Yajilin R3×4；Cave R4×3；Masyu R4×3；磁铁 R3×4（cspuz 无求解器，无法验证）。
7. **待补齐缺口（逐题详录，含勘察结论）**：
   - **R3 星战 14**（12分，9×9）：R3 页 1-2（pdf index 0-1）。星战渲染=白色 22pt 单元方块+黑色粗边框矩形+小方块星点，网格无细线（点阵式），需从 fills 位置重建。库中 R3 标签 3 条（10×10/11×11/12×12 = 15/16/17 号），缺 14 号。
   - **R5 星战 22-24**（22/70/21 分，注意 CB 与 IB 分值不同）：R5 CB Competitive 页 3-4（无 a/b 标签）。
   - **R6 Yajilin 15-17**（3/17/30 分）：R6 CB Competitive 页 1-2。
   - **R1 Battleships 16-18**（47/21/20 分）：在 **Casual 册**（16-18 号）。库中 battleship 条目未打标签需核对。
   - **R1 Skyscrapers 11-13**（20/60/47）：CB Competitive 页 5（pdf index 4）。网格=白色 27pt 单元方块填充（无矢量线），线索为文字数字，可用 fills 位置+bbox 重建。库中 13 条 skyscrapers 未打标签。
   - **R5 Skyscrapers 17-18**（41/46 分）：在 **Casual 册** 页 10。
   - **R2 Kropki 37-41**（44/48/49/51/103）：CB Competitive 页 6-8。37/38 = 4×4 全给定+点标记（O=白点、X=黑点、XO=1-2 对、.=无），但 44/48 分与 4×4 不符，SB 显示 8 位行——网格间距 38.25pt 与 19.13pt 的关系待核实（疑为 8×8 每两格一给定）。库中 5 条 kropki（6×6×2、7×7×2、10×10）未打标签。
   - **R1 Place by Product 17-19**（40/36/148）与 **R1 Full Tapa 20-22**（24/27/38）：CB Competitive 页 7-10。库中 placebyproduct 3 条（9×9×2、12×12）、tapa 6 条未打标签，需逐题核对。
   - **R5 Fillomino 14**（38 分，Casual 册页 8，10×10）：已提取 givens（16 个）+ 发现字母 K/R/E/Q/P 是答案输入点标记（非给定数）。10×10/10×9/9×10 编码均 isUnique:false，疑个别数字误读或行列偏移——需用 SB 解答逐格核对（SB 页 2 中部，13 解在 text y 427-571、14 解在 y 618-762，14.4pt 半比例）。13 号已定论跳过。
6. **R6 Lighthouses 18-20**：penpuz 无 lighthouses 题型、cspuz 也无该求解器 → **跳过**（黑格填充提取能力已就绪，但无对应题型可入库）。
7. **磁铁 R3 22-25**：penpuz 有 magnets 题型但 cspuz 无 magnets 求解器，无法过唯一性闸门 → 待定。

## 每道新题的验证流程（模板）
1. `pdftotext -bbox` 提取数字/字母 + `pdfvec.py` 提取网格线
2. 网格线确定几何 → 数字按对齐规则映射到格子（注意渲染比例）
3. 按题型编码成 `https://puzz.link/p?` 格式 URL（类型名与 cspuz 一致：nurikabe/cave/slither(link)/fillomino/tapa/abc-box 等）
4. WASM 求解器验证 `isUnique: true`；若 `no answer`/`false`，枚举两解对比差异格定位错误
5. 入库 `database.ts`（难度：Casual=简单、Competitive=困难、分≥60=极难；作者从 CB 标题取）
6. 跑 `node scripts/commit-rotation.mjs 1500` + `pnpm test` + `pnpm build`
7. `git commit && git push origin main`（GitHub Pages 自动部署）

## 环境速查
- 包管理：pnpm；无 npx（用 `./node_modules/.bin/tsc`）
- poppler 工具：`nix-shell -p poppler-utils --run "pdftotext -bbox ..."`
- cspuz WASM：`~/Projects/VSCode/Webstorm/puzzle/pzprjs/dist/wasm/`
- cspuz 求解器类型清单：`~/Projects/VSCode/Webstorm/puzzle/cspuz_core/cspuz_rs_puzzles/src/puzzles/`（各题型 solver）
