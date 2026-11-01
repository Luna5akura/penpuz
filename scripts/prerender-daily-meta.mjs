// 构建期把“今日题”的 og/title 元数据写入 dist/index.html，
// 让搜索引擎抓取首页时能看到当日题面信息（客户端运行后仍会刷新）。
import { createServer } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { getBeijingDateStr, getPuzzleByDateStr } = await server.ssrLoadModule('/src/puzzles/database.ts');
  const { getPuzzleMetadata } = await server.ssrLoadModule('/src/puzzles/puzzleMetadata.ts');
  const { puzzleDifficultyLabels } = await server.ssrLoadModule('/src/puzzles/types.ts');

  const daily = getPuzzleByDateStr(getBeijingDateStr());
  const metadata = daily ? getPuzzleMetadata(daily.puzzle, 'zh-CN') : null;

  if (daily && metadata) {
    const difficultyText = puzzleDifficultyLabels[daily.difficulty]['zh-CN'];
    const title = `${daily.dateStr} ${metadata.title} | 每日纸笔谜题`;
    const description = `${daily.dateStr} 第 ${daily.index + 1} 题，难度 ${difficultyText}。${metadata.description}`;

    let html = readFileSync('dist/index.html', 'utf8');
    html = html
      .replace('<title>每日纸笔谜题 | PenPuz Today</title>', `<title>${title}</title>`)
      .replace('<meta property="og:title" content="每日纸笔谜题 | PenPuz Today" />', `<meta property="og:title" content="${title}" />`)
      .replace('<meta name="twitter:title" content="每日纸笔谜题 | PenPuz Today" />', `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`)
      .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${description}" />`);
    writeFileSync('dist/index.html', html);
    console.log(`[prerender-daily-meta] 已注入今日题元数据: ${title}`);
  } else {
    console.warn('[prerender-daily-meta] 未找到今日题，跳过注入');
  }
} finally {
  await server.close();
}
