# WPF GP 2016 转录管线

数据源：`~/Projects/Puzzle/downloads/paper_puzzle_competitions/gp.worldpuzzle.org/sites/default/files/Puzzles/2016/`
（CB=题目册 Casual/Competitive、IB=规则册、SB=解答册）

## 工具
1. **文本网格提取**（已完成 6 题）：`pdftotext -bbox <pdf> out.html`（nix-shell -p poppler-utils），
   逐词坐标 → 行列聚类 → 重建网格 → pzpr 编码 → 用站点解析器验证（node + vite ssrLoadModule）。
2. **矢量提取器**（`pdfvec.py`，已可用）：解析 PDF 内容流（cm/m/l/c/re/S/f/q/Q + Form XObject），
   输出全部线段 (x1,y1,x2,y2,线宽)。用于区域/图形类题型（星战区域、磁铁区域、箭头、船形、圆点等）。
   注意：部分页面 /Resources 是间接引用，get_resources 需要完善（嵌套字典解析）。

## 进度
- 已入库：R5 Fillomino 13、Slitherlink 19a/20a/20b/21a/21b（6 题，已验证）
- 文本类待转录：R1 Nurikabe 8-10 / Skyscrapers 11-13 / Slitherlink 14-16；R2 Kropki 37-41；
  R5 Skyscrapers 17-18 / Cave 25-27 / Fillomino 14a/b；R6 Tapa 24-26 / Akari(Lighthouses) 18-20；
  R7 EasyAs 19-21 / Domino Search 22-24；R8 EasyAs 30-32 / Arrows 33-35
- 矢量类：星战 R3 14-17、R4 21-23、R5 22-24；磁铁 R3 22-25；Yajilin R3 18-21、R6 15-17；
  Masyu R2 21-24、R4 24-26；Yin-Yang R2 29-32；Four Winds R1 19-22；Battleships R1 16-18；
  Place by Product R1 35-37；Domino Construction R4 27-29

## 关键格式
- 编码器：nurikabe/fillomino/cave 用 readNumber16 + g-z 跳格；slitherlink 用 '.' + 0-4；
  skyscrapers 用 decodeOutsideClues + decodeGivens；tapa 用 decodeTapaClue；akari '.'=黑格
- 校验：`node scripts/.tmp-validate.mjs`（ssrLoadModule 各题型 utils 的 parse 函数）
- 难度：Casual=简单、Competitive=困难（分≥60 的为极难）
