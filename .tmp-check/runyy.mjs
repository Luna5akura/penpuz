import { parseYinYangLink } from './yutils.ts';
for (const url of [
  'https://pzprxs.vercel.app/p?yinyang/9/9/00016009b6090p720020i069230',
  'https://pzprxs.vercel.app/p?yinyang/9/9/000630k036300a0003399030000',
]) {
  const p = parseYinYangLink(url);
  console.log('parsed:', p.width + 'x' + p.height, 'givens:', p.givens.flat().filter((v) => v !== null).length);
}
