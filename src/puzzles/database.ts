import type { DailyPuzzleData, HistoryPuzzleData, PuzzleData, PuzzleEntry, PuzzleType } from './types';
import { getPuzzleTemplate, puzzleRegistry, resolvePuzzleEntry } from './registry';

export interface DatabasePuzzleSample {
  type: PuzzleType;
  entry: PuzzleEntry;
  puzzle: PuzzleData;
}

// ==================== 统一获取北京时间日期字符串 ====================
/**
 * 返回当前北京时间（Asia/Shanghai）的 YYYY-MM-DD 字符串
 * 严格以北京时间 00:00 为日期分界点
 */
export function getBeijingDateStr(): string {
  return formatBeijingDate(new Date());
}

function formatBeijingDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value.padStart(2, '0');
  const day = parts.find(p => p.type === 'day')!.value.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==================== 统一存储所有谜题 ====================
const allPuzzles: PuzzleEntry[] = [
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2l2u2l2n2m2m.k2g2i2q2l2s',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/n2n2u2k2g2l2r2k2n2s2n-16',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/8i1h2g5p2zi5j22k4zh1p6g1h2i7',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/5i1g1h2g1g3h6g1g1i36g1g1g3g1h1g6i3g52g6g11g5g34g4i5g1h1g4k54k1g5h4g1g3i1j4000000000100040000000200080000000000',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2j2h1zo2g2h1g.n.g2h1g1zo2h1j1',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/9/9/g3h1h5g4g1i1g2g6h1h2g3g1i1g4g5h1h2g3g1i1g4g6h1h4g3g1i1g3g5h1h3g',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/g5p5k5p5s5p5zo5k5g5m',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/q30k20d32i1141h3221i42d12k40q',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/00lhksmullfd75hm00u85lakb8442q5alk2f',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/04094i94i94i94i84g007s00007000000s00ca212',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/9h9h9h9g34i332h454i13g94g9h9g39j51n14j9g19h94g9g331i23h32i323g9h9h9h9000000000000000000000000000000000008',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/bjbjbg.icqb6acvacgan.ldhbj',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?aqre/10/10/bbdr0i1k2o4gf0ln5lcinv81o283o281nvci12321003g23011102012113',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nikoji/8/8/1g2h1g2j3i3g4h3g4j4l2j3g2h4g5i4j6g7h4g5',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?mintonette/10/10/.h4i4m3p4h42h2i4m3k4h1q2h4h14zh2h./',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/95u69hu893vvm8pui8i25qcjdef4aa4kek16',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/.i.n.g.k.n.h.g.g.l.i.h.g.g.j.k.n.g.i.g.l.o',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/204h92i14284h52a4k1vu700u0vo07vo000032210142134242',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/g1j1m124h1h1h651h146h1k25125h1h1h46124k1h651h146h1h1h251m1j1g',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/kbibjcs2bhbbbjcbbh1bscjbici',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/2h2h2h2j34n56j2h2h2h2g46g64g53h53g35g46g2h2h2h2j35n64j2h2h2h2',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/j1i1g1j.g.i.m.n1h.p1h1h.k.j11p.h.i.l1i1',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?aqre/10/10/69dmr9ibdmqkirdml4dmg9dmvv00dmvv00dm433033301423134300343133',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/022ecspp3ojj76e8010sf0000see70000unu44444444',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/g01u3o3v7svo3ofg81ftfgvgdo1g3n1u1u7u',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/41h22m21i31a311121e21l11e112141a41i41m12h33',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/ibbhcjcgbhbblbxblbbhbgcjbhbcg',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/sfovhpu3s7ofgv1u043o3ovvs707s007s7vozi',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/41h44h14h7j5i613h713i5j6h4i441h44i44i4h5j3i617h716g1g3j5g14i44i4',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/o.s1n1k2p2l5j3i5j3u4n4j',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/sbcrbcgckbjbkbgbbrccq',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?kurarin/10/10/p8i8i8h2i3zh3g888882s8i8r8g8g4g8g8r8i8r2g888882zh2i3i8i4i8p',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/58agl1c0o18agl1a2k0000sf30vv30vv00001121222g2g1021',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/gocnvvvvvvvvspc711dmla00000000ladifq',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?aqre/10/10/lbaml80000002ldaql0000vv000000vv0000205053g061502',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/akl9ail5aakl9ail5a6cpj6cpj6cpj6cpj6c0g0i2h0h00k0h002h',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/1h1h1h1g14g34g32h3l3g1h1h1h1g3h43h4h4h54h2g1h1h1h1g2l2h54g15g13g1h1h1h1',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/h33a21k22d32p1142h3121p42d12k11a41h',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?walkwalk/10/10/8gh14i94ia4l1a244800vv000s70of007g003q1h1g3i4g2j4i3j6l3g3j3l1k2l3g1k4h3h3q5h',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?kurarin/10/10/p4m4qcg4g4gcucucgcgcg4qcg4i4g4q8g4g8gcucu8g4g8g4q4mcp',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/akl9ail5aakl9ail5a6c1jpg6cpj6c63pj0c101g111111111111g11g1g10',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?walkwalk/10/10/58agl1224488gl1a2k0000vv00s700vv00005h5h2h7r1j2h2i4j3l4l4l6j4i5h2j2r5h2h3h5',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/m42b22n11f31f31h31f21f12n42b31m',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/h2j2g11j2m2j1h2j2m1j2h2j2h2j1m2j1h2j2m2j2',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/0060a0qg35fdesmep6100g0n143ota1hem7d0s',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/i5g4h2g5g4g3g3j2g1g1g5g3h2g5i3h5j3h12h3j5h4i5g3h3g5g3g1g1j1g2g4g5g3h2g5i',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/8g4vq4pgkg1k4973go6aka4ie5go6186a2ba527h64h',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/.hbp.g.i.g.hbcb.g.i.g.p.g.i.g.hccc.g.i.g.rb./',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?kurarin/10/10/x8q8h8g88q8i888r8i88t8888g88r8g8w88v88g8g888p8x',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/i3k112g4q7l56g8l3jbl9agczh1n1i1i1h',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/s2m2t2m2t2j2r.h2x2',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/k21f32c22d31f21k41f11k31f42d11c42f11k',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/zk4n2i3i3i2l1i5i.i3n3zk',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/0060a0o45a7avqnbrc100g0gp664tp7a1p9e0s',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/a10p30c40j40a20f20n10f30a10d40e40t10a',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?kurarin/10/10/r8i8gcq8g44h8t4g8g4q4h8w4h448r444j4q4h8t8g8h444qcj8s',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/hbbhbqchbnbjbhcjbnbhbqahbb',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/4g90i1224488g90i1400003vs00007vo0000534523551',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/h6y6j3n3m2p2m4n4j5y5h',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/00c0k1kgdob5llim6o20101e26o87melrj2v0s',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/g1o7gv3u7sfov1s8g17u3u3o003o01bo7sfu',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/gaoaaoaapag5aiaiazlaia',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/picdj4rcpc16cpmc9jaj6alcplchl2j6akpi.000000000000000000000000',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/picdj4rfpcp6cpuc9jaj6alcrleplaj7alpi.111111111111111111111111111',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/a43zl45zl34t',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/9g8g7g6zr1y4y6y8',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/g.j.k6..g6.g7ch6.i.6bg.gb.g.h.g.h6.i61.i.gch67.g6..gbi.j.g',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?mintonette/10/10/h.i.g.j1k.g.i.l.g1j..h.i.i.h.g.l4g.h1m.h..i.h1h.j.j',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/1/g0300u01g0004o0660gg0i82901001212848',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?aqre/10/10/dm07e4c2gphj1g30h9rcmh60jgbg00cg015g0g000000000000',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/9/9/524242323p1g1g1g1p1g1g1g1g1p1g1g1g1p425232325',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/...g...g.......................g............g..................g.....g.g.......................g..../',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nikoji/8/8/12345678t7n8h3g5j2g4z',
    difficulty: '困难'
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/80m10i15aakg90g102106v001g001g00vs0066g606',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?kurarin/10/10/ch2i2gck2j2h2w2h2h2g2h2i2i2i2h2r2h2j2h2h2m2h2h22q2i2i2l2j2g2k2j2g2p2ich2kc',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?domino-search/8/8/14541112340g634523g0g1605511g223566g546326i3432000040261352456',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lakes/8/8/3j3k2k3j3k3k2j33j1k3k3j3g',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://puzz.link/p?tapa/6/6/1ia71a86gaaajjafhad6g7g42j22g4321',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?slither/8/8/55a5agaaaaga555aj555ahag5aga',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lits/9/9/4af3r7mej4bg000ego9glg37es3bvo00000000000080000',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lits/9/9/4esnofk136fvnh8dogr0rnfee890d0',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?domino-search/8/8/16223121140h40013g5105065g35g4641426g66540h6262221355333440503',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?domino-search/8/8/201520154544g016065h0145641g6332233g235343i646642036015520112',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?domino-search/8/8/33422546266h26124g11350531h02054600g26130h1361053325144554406',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lakes/8/8/3j3k2k3j3k3k2j33j1k3k3j3g',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?slither/8/8/77c222772c222272727722c27c7c2c7227277c',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?slither/8/8/d38ddhdh3dmd8di8d3dl8833d',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?magic-snail/8/8/4/zri2m4x3113x4m3i',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?magic-snail/8/8/4/zr.g.l.j.g.g1h.k.g.j.g.k.h1g.g.j.l.g./',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?magic-snail/8/8/4/zr.i3j.g1l.n.n.n.l4g.j2i./',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?slovak-sums/8/8/4/g-16o-11o-30o-35-3ao-4fo-3bo-16g',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://127.0.0.1:8080/p.html?slovak-sums/8/8/4/h-25h-1ah-25l-16-1bl-1aj-15l-10jbl-25-20l-10hbh-20h',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://127.0.0.1:8080/p.html?slovak-sums/8/8/4/i-20l-2bh-30i-16j-2bn-25-2an-2aj-20i-15h-10l-1bi',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?tapa/9/9/za72hbmnbllallaanbmhafbqz',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?slovak-sums/8/8/4/l-25g-20h-35l-2bh-26n-35h-35n-21h-30l-3fh-20g-2al',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?tapa/10/10/q6h7h7qa9gaer5haajbnh6rafga9qaah5hafq',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?tapa/11/11/la8h3iaazgafg6galg4ta7malta8gaegbngbnzgbni3h3l',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?tapa/12/12/xagmbng6kaeoaelalgafj4nalnaan5j6gbnlbnoabkaggafmafx',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://puzz.link/p?skyscrapers/4/4/k13h4j3g',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?skyscrapers/5/5/g3g1h3g5h4l2g',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?skyscrapers/6/6/j422o5336j',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?skyscrapers/6/6/g35g3253g5i3g33i3g3g',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?skyscrapers/7/7/i3g5224g3i5g34g6h2g25g2',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://luna5akura.github.io/atol-solver/p.html?magic-summer/6/6/4/l-f4-49g-37-1cm-91-2eh-13g',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?magic-summer/7/7/5/m+177g-45+1da-57o-33+22bi+141+165',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?battleship/9/9/234223211141152114zzg6zy//d',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?battleship/9/9/111622223141114161zg5zzy//d',
    difficulty: '困难',
  },
  {
    // Neighbors 19, from WPF Puzzle GP 2015 Round 4.
    puzzLink: 'neighbor/9/9/............3.......2.......1...3.......2.......1...3.......2.......1............/111111101001110001011110001110111111110000101101111001100001111110101001000110000',
    difficulty: '简单',
  },
  {
    // Neighbors 20, from WPF Puzzle GP 2015 Round 4.
    puzzLink: 'http://localhost:8080/p.html?neighbors/9/9/..........1.....1.............3.1...............3.2.............2.....2........../111101111001101111001111111000000000011100000010010001011111010101010110100000011',
    difficulty: '困难',
  },
    {
    // Neighbors 21, from WPF Puzzle GP 2015 Round 4.
    puzzLink: 'http://localhost:8080/p.html?neighbors/9/9/..........1.1...........2...1...........2...........3...2...........3.3........../110100100110111101001001100110000101110001100111101110110011001000111010100011100',
    difficulty: '困难',
  },
  {
    // Sky-neighbors 22, from WPF Puzzle GP 2015 Round 4.
    puzzLink: 'sky-neighbor/9/9/..........1.............................2.............................3........../.G..GG.GG;GGGG.G...;.G.G...GG;.G..G..G.;.GG....G.;.G.G....G;.G.GGGG.G;GGG....GG;.G.G.GGGG/........./........./........./........./010001111/010001111/011100010/001001111',
    difficulty: '困难',
  },
  {
    // Sky-neighbors 23, from WPF Puzzle GP 2015 Round 4.
    puzzLink: 'http://localhost:8080/p.html?skyneighbors/9/9/................................................................................./GG.GG.G.G;GGG....G.;GGGGG..GG;.G..GGG.G;......G..;G...G.GG.;.....G...;G........;GGGGG..G./........./........./........./........./100110001/111110000/111001011/100110010',
    difficulty: '困难',
  },
  {
    // Sky-neighbors 24, from WPF Puzzle GP 2015 Round 4.
    puzzLink: 'http://localhost:8080/p.html?skyneighbors/9/9/................................................................................./G.G.G.G.G;...GGG...;G......G.;GG.G.....;GG.GGG.GG;GGG..G.GG;.....GGGG;.GG....G.;G.GGG.G../........./........./........./........./100000111/101111100/101111001/100111100',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?kakuro/10/10/.-7m..6-..9-.-hl7-B-k.3-kc-.-Or.bcm..pf-k.4-d-3-..k4gp.4-m.-are-..k..k.-8l.......-Bm..-bE-7N-E',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?kakuro/7/7/nDcob8n-6m.kf--Bm.A-kedm8-n-9o-HndbC-aaH9--Ca',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?kakuro/9/9/v-Gq.Q5l9-.mabnL-.sh--dn-fm5-ehl.gcq-hv-M4--T4ea-dfa--A-/',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?wolvesandsheepfences/10/10/0a53b0a2b6b6b6a31a0b2b0b1a5c2a5a3a6a13b3c61a2a6a0a6c0a2b6b6b6a36a0b2b0b1a5b35a5',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?wolvesandsheepfences/10/10/6b1d6b05b6a5a11b213b23a0a15a63d62a6b6136b6a23d21a25a2a22b122b02a6a3b35b3d1b3',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?wolvesandsheepfences/10/10/b1a1233b3b5d13a0a31a61a2b6a5a2a523a1a3a5a1b2a5a2a3a135a1a5a6b2a26a13a1a22d5b3b3222a3b',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lits/12/12/916cdhlj78dpuhvg9jkjtn4ll203niegjq5qouoe1fi79r1lh6o5gg',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?shapeminesweeper/10/10/i1h2v1h2u1g12g2j3g34g4u3344z4h//t',
    difficulty: '简单',
  },
  {
    // PuzzLink's canonical Cave example (the same 6×6 instance used by
    // pzprjs), encoded with number16 clues.
    puzzLink: 'http://localhost:8080/p.html?cave/6/6/g3q2h3jbj3i3i2g',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?shapeminesweeper/11/11/j3i4i2i3m3i4i3i2i1i3i4i2i1i2i1i2i2i1i2i4i2i1i2m3i3i2i2j/10/14u/23n/23f/22u/23lg/14u/23n/23f/22u/23lg',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?shapeminesweeper/14/14/i1i0i2v2v6g6h2g4h2w6g5h4g5i0zl3i2g4h4g1w1h3g2h4g1v3v1i3i1i//p',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?cave/10/10/g3h43h2g7n55n48n7g9l6i6g79g6zi8l3g5g4j5g4',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?cave/10/10/h3l3i5h7g5g3j5k7lbn5j7nbl9kbj9g3gbh9i7l9h',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?cave/10/10/i4h4k3j7i6l5g5j6i6j5p4j5i7j6g8l9i6j8k7h7i',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?japanesesumswithzeroes/5/5/6/55g56gah89g99g-14hfh2h-13hah',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?japanesesumswithzeroes/6/6/6/246-11hdh99g-12h335b4g-13h47gch-14h66g',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?japanesesumswithzeroes/7/7/6/abh-11i46h-12i56h-13iabh555g666g7iaah4ch-15i659g',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?japanesesumswithzeroes/8/8/6/a6hfi53bgc5h1-14h28bg-14ifi44h-13i9ch666g-14ic9h777g88h',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?abcbox/5/5/3/.A.xx.B.xx.C.xx.A.xx.B.xx.A..x.1.xx.2Axx...xx.1C.x',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?abcbox/6/6/3/..........xx.B.xxxA3.xxx.C..xx.A..Bx2.2.xx3.Bxxx.3.xxx....xx.A..xx.B.xxx',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?abcbox/6/6/3/...Axx.A1.xx.2.Bxx.B2.xx.1.Cxx.C3.xx.2C.xx..3.xx.2B.xx..2.xx.2A.xx.C1.xx',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?abcbox/7/7/3/..A.xxx.A..B.x..B.C.x.2..xxx.C.A..x.A..B.x..B..xx.C..xxx.B..C.x..B.A.x.3.xxxx.C.B..x.B....x..B.xxx',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?battleship/10/10/12323241111141323212zh5zg5zg5zs//d',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://luna5akura.github.io/Atol-Solver/p.html?skyscrapers/7/7/4g4g4g4h44g4i4g3h4g4h4g',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?fourwindswithparks/8/8/1l3h2h4i1j1x3j1i1h1h9l1',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?fourwindswithparks/10/10/4j8l1j6l2j3g2j1l6j1g8j8l3j3l3j2g1j1l3j4g',
    difficulty: '极难',
  },
  {
    // Atol-Solver pzpr links: standard Kakuro cell encoding plus a number16
    // grid packing the white-bar bits (2 = right, 1 = bottom) per cell.
    puzzLink: 'http://localhost:8080/p.html?consecutivekakuro/10/10/iCn-hsICqdimehpIjmS-O-l9Bm6jpDhmEclf-CCmgGp8im9Dq-Ds-Bn.JidbA8ADI8Ae7aAD0011000000002000021011000210202000002000000031000000002000000000100210010300020030000021000000002000',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?consecutivekakuro/10/10/oi--8sGhpDBrFPq-fm.-flL-.E-Eal9-Fgma-qjarcep-Os.-Hohib8iQhdiGdcLDBi0030000031030000002030000031200000002000000000200000100000000230100000010230000023000021300000000200',
    difficulty: '极难',
  },
  {
    // WPF Puzzle GP 2015 Round 7, puzzle 22 (8×8, pill values 1-8).
    puzzLink: 'http://localhost:8080/p.html?pills/8/8/120222112101230321112120001332223232311111221211100101111010101032499333233ad311',
    difficulty: '困难',
  },
  {
    // WPF Puzzle GP 2015 Round 7, puzzle 21b (10×10, pill values 1-12).
    puzzLink: 'http://localhost:8080/p.html?pills/10/10/111222122212212322211200140021210014001122111444321122233322210023002412002300142112121122122112121142222-1a77dd2675-10b9a66',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?skyscrapers/5/5/j34h3h4h3h4h',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?skyscrapers/6/6/2l5h4i2l5g4',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?skyscrapers/6/6/g1h2g43l3h2g5h4g',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?skyscrapers/7/7/i2h2362k2i624h6i',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?fillomino/10/10/g3o1h3ah1j2h2k21h12i7h-14i4h6l9i21h12k2h2j1h85h1g6m5g',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?fillomino/10/10/g3o1h3ah1j2h2k21h12i7h-14i4h6l9i21h12k2h2j1h85h1g6m5g',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?fillomino/10/10/o98g7m472g8525j7g5g1j2h3j4g5i15h82h1g579h3h4g4k2k87h3j4i',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?fillomino/12/12/c91k1848i1291zv1291g1291c91p8s1291i1848zh1815j1291j1848',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?tapa/12/12/i3l2g3jafiaeva8ha8iafg3s3ibloa8j44mafl4na8k6waeh2ga8ga8ha8i2',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lits/10/10/5gqnd5trdp858rc9144ea14e14lhfcsafler',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lits/10/10/ikq5q5ks3o65cr4jikai1uke6c00ecubdld2',
    difficulty: '简单',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lits/9/9/18evmj242grum9guaoiaho3025ah28',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?lits/12/12/4m2f1bgqhqub6pouu4k4dk5m25008041qjlauf2mf1hokvfns4g0k0s1v0fo3g00000000000003g7s1v0e',
    difficulty: '极难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?pills/10/10/444222244442411114244441001444211100111221000000122100000012211100111244410014444241111424444222244448-1111275828541314ed2',
    difficulty: '困难',
  },
  {
    puzzLink: 'http://localhost:8080/p.html?magnets/10/10/2452233014223522424444222442233223322244ldlrrnrtrlqvvvvemqfrnn9rmsffvmo97mrf',
    difficulty: '困难',
  },








];

/**
 * Return the first parseable database entry for every registered puzzle type.
 * Keeping this derived from the database and registry means a newly added
 * type appears on the test page without another hard-coded list.
 */
export function getDatabasePuzzleSamples(): DatabasePuzzleSample[] {
  const samples = new Map<PuzzleType, DatabasePuzzleSample>();
  for (const entry of allPuzzles) {
    const puzzle = resolvePuzzleEntry(entry);
    if (!puzzle || samples.has(puzzle.type)) continue;
    samples.set(puzzle.type, { type: puzzle.type, entry, puzzle });
  }

  // Preserve registry order for a stable page while still deriving which
  // types are present from the actual database entries.
  return (Object.keys(puzzleRegistry) as PuzzleType[])
    .map((type) => samples.get(type))
    .filter((sample): sample is DatabasePuzzleSample => sample !== undefined);
}



const START_DATE = '2026-04-09';
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const parsedPuzzleCache = new Map<number, PuzzleData | null>();

function getPuzzleForDatabaseIndex(index: number): PuzzleData | null {
  const cached = parsedPuzzleCache.get(index);
  if (cached !== undefined || parsedPuzzleCache.has(index)) return cached ?? null;

  const puzzle = resolvePuzzleEntry(allPuzzles[index]) ?? null;
  parsedPuzzleCache.set(index, puzzle);
  return puzzle;
}

export function getPuzzleDateStr(daysSinceStart: number): string {
  const start = new Date(`${START_DATE}T00:00:00+08:00`);
  const targetDate = new Date(start.getTime() + daysSinceStart * MILLISECONDS_PER_DAY);
  return formatBeijingDate(targetDate);
}

function getDaysSinceStartFromDateStr(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const start = new Date(`${START_DATE}T00:00:00+08:00`);
  const target = new Date(`${dateStr}T00:00:00+08:00`);
  if (Number.isNaN(target.getTime())) return null;

  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / MILLISECONDS_PER_DAY);
  return daysSinceStart >= 0 ? daysSinceStart : null;
}

/**
 * Return the continuous public number for a day, counting only entries that
 * can actually be parsed and displayed.  The database is rotated when the
 * number of days exceeds its length, so the raw database position cannot be
 * used as a user-facing number.  Unparseable entries are omitted from the
 * history list; excluding them from the count keeps the numbers visible to
 * users gap-free as well.
 */
function getPublicPuzzleIndex(daysSinceStart: number): number | null {
  const databaseIndex = daysSinceStart % allPuzzles.length;
  let parseablePerCycle = 0;
  for (let index = 0; index < allPuzzles.length; index += 1) {
    if (getPuzzleForDatabaseIndex(index)) parseablePerCycle += 1;
  }

  let publicIndex = Math.floor(daysSinceStart / allPuzzles.length) * parseablePerCycle;
  for (let index = 0; index <= databaseIndex; index += 1) {
    const puzzle = getPuzzleForDatabaseIndex(index);
    if (!puzzle) continue;
    if (index === databaseIndex) return publicIndex;
    publicIndex += 1;
  }
  return null;
}

export function getPuzzleByDateStr(dateStr: string): DailyPuzzleData | null {
  const daysSinceStart = getDaysSinceStartFromDateStr(dateStr);
  if (daysSinceStart === null) return null;

  const databaseIndex = daysSinceStart % allPuzzles.length;
  const entry = allPuzzles[databaseIndex];
  const puzzle = getPuzzleForDatabaseIndex(databaseIndex);
  if (!puzzle) return null;

  const publicIndex = getPublicPuzzleIndex(daysSinceStart);
  if (publicIndex === null) return null;

  return {
    puzzle,
    template: getPuzzleTemplate(puzzle.type),
    difficulty: entry.difficulty,
    index: publicIndex,
    daysSinceStart,
    dateStr,
  };
}

export function getDailyPuzzle(): DailyPuzzleData | null {
  const todayStr = getBeijingDateStr(); // ← 使用统一北京时间函数
  return getPuzzleByDateStr(todayStr);
}

export function getHistoryPuzzles(daysSinceStart: number): HistoryPuzzleData[] {
  if (daysSinceStart <= 0) return [];

  const history: HistoryPuzzleData[] = [];
  let publicIndex = 0;

  for (let d = 0; d < daysSinceStart; d++) {
    const databaseIndex = d % allPuzzles.length;
    const entry = allPuzzles[databaseIndex];
    const puzzle = getPuzzleForDatabaseIndex(databaseIndex);
    if (!puzzle) continue;

    history.push({
      puzzle,
      template: getPuzzleTemplate(puzzle.type),
      difficulty: entry.difficulty,
      // Keep history numbers continuous.  The database index above is only an
      // implementation detail used to select the rotating entry.
      index: publicIndex,
      dateStr: getPuzzleDateStr(d),
      daysSinceStart: d,
    });
    publicIndex += 1;
  }
  return history;
}
