// 薄明よみの問題を作る（ブラウザと node の両方で使う）。
// 中身は、国立天文台 暦計算室「暦Wiki/薄明」と「暦象年表 用語の解説」に書いてあることだけ
// （2026-11-27・11-28 に読んだ。要点は共有フォルダ games/hakumei-research.md）。
// 扱うのは「太陽の中心の伏角（地平線の下の角度）から、薄明のどれかを当てる」ことと、それぞれの明るさの目安・日の出入りの決まりだけ。
// 月の形よみ（tsuki-katachi）・うるう年よみ（#645）とは重ねない。
// 伏角は境目（6°・12°・18°）ちょうどを出さない（どちら側に入るか、出典に書いていないため）。地平線の下1°より浅い角度も出さない（日の出入りの前後で、太陽の一部が見えることがあるため）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回し・まちがいの選び肢は、足すだけでも過去の日の問題が変わる（選ぶ範囲が変わるため）。公開したあとは変えず、変えるときは qa/run.mjs の PINS を作り直して PR に理由を書く。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    wiki: ["国立天文台 暦計算室「暦Wiki 薄明」", "https://eco.mtk.nao.ac.jp/koyomi/wiki/C7F6CCC0.html"],
    yogo: ["国立天文台 暦計算室「暦象年表 用語の解説」", "https://eco.mtk.nao.ac.jp/koyomi/faq/glossary.html"],
  };

  // 太陽の中心の伏角（地平線の下の角度）の区切り：6°・12°・18°（国立天文台）。高度がプラス（地平線の上）は「太陽が出ている」
  const LEVELS = ["太陽が出ている", "常用薄明", "航海薄明", "天文薄明", "薄明の外（夜）"];
  // d は伏角（度）。マイナスは地平線の上（高度がプラス）
  const stageOf = (d) => (d < 0 ? 0 : d < 6 ? 1 : d < 12 ? 2 : d < 18 ? 3 : 4);
  const RANGE = ["太陽の中心が地平線の上", "伏角6°まで", "伏角6°から12°まで", "伏角12°から18°まで", "伏角18°より深い"];

  // 2段目「この時間帯の明るさの目安は？」の5つ。name に1段目の答え（薄明の名前）を書かない（書くと1段目の答えから2段目が分かる）
  const GROUPS = {
    hiru: { name: "日の出から日の入りまで", sub: "太陽の上辺が地平線より上" },
    jo: { name: "日常の作業ができるくらい", sub: "明かりがなくても動ける" },
    ko: { name: "六分儀で水平線が見えるくらい", sub: "星と水平線で船の位置を知る" },
    ten: { name: "6等星が見えるかどうかの境目まで", sub: "天体観測には、まだ少し明るい" },
    yoru: { name: "6等星まで肉眼で見える暗さ", sub: "天体観測に向いた時間" },
  };
  const GRP_WHY = {
    hiru: "国立天文台は、太陽の上辺が地平線に一致する時刻を、日の出・日の入りとしています。そのあいだは太陽が出ています。",
    jo: "常用薄明は、日常的な作業ができるくらいの明るさの目安です（国立天文台「暦Wiki 薄明」）。",
    ko: "航海薄明は、六分儀で水平線が確認できるくらいの明るさの目安です（国立天文台「暦Wiki 薄明」）。",
    ten: "伏角18°は、6等星が肉眼で見えるかどうかの限界です。天文薄明はその境目までです（国立天文台）。",
    yoru: "伏角18°より深いと薄明が終わり、6等星まで肉眼で見えます。天体観測に向いた時間です（国立天文台）。",
  };
  const GK = ["hiru", "jo", "ko", "ten", "yoru"];
  const grpOf = (s) => GK[s];

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  const MEDIA = { sora: "空のようす", koyomi: "暦の計算メモ", kimari: "薄明の決まり", hinode: "日の出入りの決まり" };
  const f1 = (x) => x.toFixed(1);
  // 角度の書き方。t：d＝伏角（小数）・u＝高度（地平線の上）・a＝高度をマイナスで書く・m＝伏角を度と分で書く
  function ang(d, t) {
    if (t === "u") return `${f1(d)}°`;
    if (t === "a") return `−${f1(d)}°`;
    if (t === "m") { const mm = Math.round(d * 60); return `${Math.floor(mm / 60)}°${mm % 60}′`; }
    return `${f1(d)}°`;
  }

  // 選び肢：やさしいは3つ（答えのとなりは入れない）、ふつう・むずかしいは4つ。むずかしいは答えのとなりを必ず入れる
  function distract(R, a, lv) {
    const all = LEVELS.map((_, i) => i).filter((i) => i !== a), nb = all.filter((i) => Math.abs(i - a) === 1), far = all.filter((i) => Math.abs(i - a) >= 2);
    if (lv === 0) return pickN(R, far, 2);
    if (lv === 2) { const n1 = pickN(R, nb, 1); return [...n1, ...pickN(R, all.filter((i) => !n1.includes(i)), 2)]; }
    return pickN(R, all, 3);
  }
  // 問いの言い方（v は角度の文字）。地平線の下は、朝と夕方の6つずつ（薄明は日の出前にも日の入り後にもある）
  const WHEN_D = ["日の入りのあと", "日が沈んだあと", "夕方の空", "夜明け前", "日の出前", "明け方の空"];
  const FORM_D = [
    (w, v) => `${w}、太陽の中心の伏角が${v}。いまは？`,
    (w, v) => `${w}。太陽の中心は地平線の下${v}。どの時間帯？`,
  ];
  const WHEN_U = ["朝", "午前", "昼前", "午後", "夕方", "日の入り前"];
  const FORM_U = [
    (w, v) => `${w}、太陽の中心の高度が${v}。いまは？`,
    (w, v) => `${w}。太陽の中心は地平線の上${v}。どの時間帯？`,
  ];
  const FORM_A = [
    (w, v) => `${w}、暦の計算メモに「太陽の高度${v}」。いまは？`,
    (w, v) => `${w}。太陽の中心の高度が${v}。どの時間帯？`,
  ];
  function lvl(d, t) {
    const st = stageOf(t === "u" ? -d : d), W = t === "u" ? WHEN_U : WHEN_D, FM = t === "u" ? FORM_U : t === "a" ? FORM_A : FORM_D;
    return (R, lv) => {
      const wi = ri(R, 0, W.length - 1), fi = ri(R, 0, FM.length - 1), ds = distract(R, st, lv);
      return { type: "act", media: t === "a" || t === "m" ? MEDIA.koyomi : MEDIA.sora, q: FM[fi](W[wi], ang(d, t)), opts: shuffle(R, [st, ...ds]).map((i) => LEVELS[i]), ans: LEVELS[st], rev: false, v: `${wi}.${fi}:${ds.join(".")}` };
    };
  }
  // 角度の問題。d は角度の大きさ（度）。id は 伏角 v<10倍>・高度 u<10倍>・高度マイナス a<10倍>・度と分 m<分>
  const T = (lv, d, look, t) => {
    t = t || "d";
    const dep = t === "u" ? -d : d, st = stageOf(dep), g = grpOf(st), id = t === "m" ? `m${Math.round(d * 60)}` : `${t === "d" ? "v" : t}${Math.round(d * 10)}`;
    const s = ang(d, t);
    const why = t === "u"
      ? `太陽の中心が地平線の上${s}にあるので、太陽は出ています。薄明は日の出前と日の入り後です。`
      : `薄明は太陽の中心の伏角6°・12°・18°で区切られます。${t === "a" ? `高度${s}は伏角${f1(d)}°で、` : `伏角${s}は`}${RANGE[st]}${st === 4 ? "ので" : "なので"}${LEVELS[st]}です。`;
    return { id, lv, a: st, ans: LEVELS[st], grp: g, col: "sora", name: `${t === "u" ? "高度" : t === "a" ? "高度" : "伏角"}${s}：${LEVELS[st]}`, look,
      key: st === 0 ? "太陽の中心が地平線の上なら、太陽は出ています。" : `${LEVELS[st]}は${RANGE[st]}です。区切りは6°・12°・18°。`,
      why, src: ["wiki", "yogo"], make: lvl(d, t), d: dep, t };
  };
  // 決まりの問題。ans：答え、ws：まちがいの選び肢の候補（やさしいは2つ、ほかは3つ使う）、sit：問いの言い方
  function fact(col, sit, ans, ws) {
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), ds = pickN(R, ws, lv === 0 ? 2 : 3);
      return { type: "fact", media: MEDIA[col], q: sit[si], opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${ds.map((d) => ws.indexOf(d)).join(".")}` };
    };
  }
  const F = (id, lv, col, src, name, look, key, why, sit, ans, ws) => ({ id, lv, a: -1, ans, grp: null, col, name, look, key, why, src: [src], make: fact(col, sit, ans, ws) });

  const KINDS = [
    // ---- やさしい ----
    T(0, 20, "太陽は地平線の上にあります。", "u"),
    T(0, 3, "区切りの6°より浅い所です。"),
    T(0, 9, "6°と12°のあいだです。"),
    T(0, 15, "12°と18°のあいだです。"),
    T(0, 25, "いちばん深い区切りの18°より深い所です。"),
    F("hakumei", 0, "kimari", "wiki", "日の出前・日の入り後の明るさは薄明", "日の出前や日の入り後の、空が明るい時間です。", "日の出前や日の入り後の明るい状態を薄明と呼びます。",
      "国立天文台「暦Wiki 薄明」は、日の出前や日の入り後の明るい状態を薄明と呼ぶとしています。",
      ["日の出前や日の入り後の、明るい状態を何という？", "太陽が沈んだあとも空が明るい。この状態の呼び名は？", "国立天文台の暦Wikiで、日の出前の明るい状態は？"], "薄明", ["白夜", "日食", "極夜", "蜃気楼", "月食"]),
    F("kugiri6", 0, "kimari", "wiki", "常用薄明の区切りは伏角6°", "3つの区切りのうち、いちばん浅い角度です。", "常用薄明の始めと終わりは、太陽の伏角6°です。",
      "国立天文台「暦Wiki 薄明」では、常用薄明の始めと終りは太陽の伏角6°で定義されます。",
      ["常用薄明の始めと終わりは、太陽の伏角何度？", "常用薄明を区切る太陽の伏角は？", "夕方、伏角何度で常用薄明が終わる？"], "6°", ["12°", "18°", "30°", "45°", "90°"]),
    F("sextant", 0, "kimari", "wiki", "航海薄明は六分儀で水平線が見えるくらい", "船で使う、角度をはかる道具です。", "航海薄明は、六分儀で水平線が確認できるくらいの明るさの目安です。",
      "国立天文台「暦Wiki 薄明」では、航海薄明は六分儀で水平線が確認できるくらいの明るさの目安です。",
      ["航海薄明の明るさの目安。何で水平線が確認できる？", "航海薄明は、どの道具で水平線が見えるくらいの明るさ？", "航海薄明の目安に出てくる、船の道具は？"], "六分儀", ["温度計", "雨量計", "地震計", "気圧計", "体重計"]),
    // ---- ふつう ----
    T(1, 5, "太陽は地平線の上にあります。", "u"),
    T(1, 2, "伏角の小さい、浅い所です。"),
    T(1, 4.5, "区切りの6°より浅い所です。"),
    T(1, 7, "6°を少しこえた所です。"),
    T(1, 11, "12°より少し浅い所です。"),
    T(1, 13, "12°を少しこえた所です。"),
    T(1, 17, "18°より少し浅い所です。"),
    T(1, 22, "18°より深い所です。"),
    F("kugiri12", 1, "kimari", "wiki", "航海薄明の区切りは伏角12°", "まん中の区切りです。", "航海薄明の始めと終わりは、太陽の伏角12°です。",
      "国立天文台「暦Wiki 薄明」では、航海薄明の始めと終りは太陽の伏角12°で定義されます。",
      ["航海薄明の始めと終わりは、太陽の伏角何度？", "航海薄明を区切る太陽の伏角は？", "夕方、伏角何度で航海薄明が終わる？"], "12°", ["6°", "18°", "24°", "3°", "36°"]),
    F("kugiri18", 1, "kimari", "wiki", "天文薄明の区切りは伏角18°", "いちばん深い区切りです。", "天文薄明の始めと終わりは、太陽の伏角18°です。",
      "国立天文台「暦Wiki 薄明」では、天文薄明の始めと終りは太陽の伏角18°で定義されます。",
      ["天文薄明の始めと終わりは、太陽の伏角何度？", "天文薄明を区切る太陽の伏角は？", "夕方、伏角何度で天文薄明が終わる？"], "18°", ["6°", "12°", "9°", "30°", "60°"]),
    F("shimin", 1, "kimari", "wiki", "常用薄明は市民薄明ともいう", "常用薄明のかっこの中に書かれる呼び名です。", "常用薄明は、市民薄明ともいいます。",
      "国立天文台「暦Wiki 薄明」は、常用薄明を「常用薄明（市民薄明）」と書いています。",
      ["常用薄明の、もう1つの呼び名は？", "国立天文台の暦Wikiで、常用薄明のかっこの中の呼び名は？", "市民薄明と同じものは？"], "市民薄明", ["航海薄明", "天文薄明", "白夜", "極夜", "黄金時間"]),
    F("teigi", 1, "kimari", "wiki", "薄明は太陽の高度（伏角）で決める", "空の明るさは、天気や月明かりで変わります。", "薄明は、太陽の高度（伏角）で定義・分類します。",
      "国立天文台「暦Wiki 薄明」は、明るさは地形・天気・月明かりで変わるので、薄明を太陽の高度（伏角）で定義・分類するとしています。",
      ["薄明は、何で定義・分類する？", "常用・航海・天文の3つの薄明。何で分ける？", "国立天文台の暦Wikiで、薄明を分けるときに使うのは？"], "太陽の高度（伏角）", ["空の明るさの測定", "時計の時刻", "雲の量", "月の形", "気温"]),
    // ---- むずかしい ----
    T(2, 5.8, "区切りの6°に近い所です。"),
    T(2, 6.2, "区切りの6°に近い所です。"),
    T(2, 11.9, "区切りの12°に近い所です。"),
    T(2, 12.1, "区切りの12°に近い所です。"),
    T(2, 17.8, "区切りの18°に近い所です。"),
    T(2, 18.2, "区切りの18°に近い所です。"),
    T(2, 8, "高度がマイナスなら、地平線の下です。", "a"),
    T(2, 37 / 6, "1°は60′です。6°をこえています。", "m"),
    F("akemutsu", 2, "kimari", "wiki", "常用薄明は明六つ・暮六つに相当", "昔の時刻の呼び方です。", "常用薄明は、夜明・日暮あるいは明六つ・暮六つに相当します。",
      "国立天文台「暦Wiki 薄明」は、常用薄明が夜明・日暮あるいは明六つ・暮六つに相当するとしています。",
      ["常用薄明は、昔の時刻の呼び方でいうと？", "国立天文台の暦Wikiで、常用薄明に相当するとある昔の呼び方は？", "明け方と夕方の常用薄明。昔の時刻では？"], "明六つ・暮六つ", ["昼九つ・夜九つ", "丑三つ", "昼八つ・夜八つ", "子の刻・午の刻", "暁七つ・夕七つ"]),
    F("eikoku", 2, "kimari", "wiki", "薄明の分類は1937年の英国暦から", "20世紀の前半です。", "薄明を3つに分けるのは、1937年の英国暦からです。",
      "国立天文台「暦Wiki 薄明」は、常用・航海・天文の分類が1937年の英国暦から使われたとしています。",
      ["常用・航海・天文に分ける薄明の分類は、何年の英国暦から？", "薄明の3つの分類が始まった英国暦は何年？", "国立天文台の暦Wikiで、薄明の分類のはじまりは？"], "1937年", ["1872年", "1800年", "1900年", "1964年", "2000年"]),
    F("mukashi", 2, "kimari", "wiki", "分類の前は、薄明といえば天文薄明", "いちばん長い薄明です。", "分類が始まる前は、薄明といえば天文薄明のことでした。",
      "国立天文台「暦Wiki 薄明」は、1937年の英国暦より前は、薄明といえば天文薄明を指したとしています。",
      ["1937年より前、薄明といえばどれのこと？", "3つに分ける前の「薄明」は、いまのどれ？", "国立天文台の暦Wikiで、昔の薄明が指したのは？"], "天文薄明", ["常用薄明", "航海薄明", "市民薄明", "白夜", "日食"]),
    F("uhen", 2, "hinode", "yogo", "日の出入りは太陽の上辺で決める", "太陽の中心ではありません。", "日の出・日の入りは、太陽の上辺が地平線に一致する時刻です。",
      "国立天文台「暦象年表 用語の解説」は、太陽の上辺が視地平線または水平線に一致する時刻を、日の出・日の入りとしています。",
      ["日の出・日の入りは、太陽のどこが地平線に一致する時刻？", "暦象年表の日の出の時刻。地平線に重なるのは太陽のどこ？", "国立天文台の日の入りの決め方で、使う太陽の所は？"], "太陽の上辺", ["太陽の中心", "太陽の下辺", "太陽の右はし", "太陽の左はし", "太陽の半分"]),
    F("taikisa", 2, "hinode", "yogo", "地平大気差は35′8″", "1°より小さい角度です。", "日の出入りの計算では、地平大気差を35′8″としています。",
      "国立天文台「暦象年表 用語の解説」は、日の出入りの計算で地平大気差を35′8″としています。",
      ["日の出入りの計算で、地平大気差はいくつとしている？", "暦象年表の日の出入りで使う地平大気差は？", "国立天文台が日の出入りに使う大気差の値は？"], "35′8″", ["0′0″", "6°0′", "18°0′", "2′30″", "12°30′"]),
    F("hyoko", 2, "hinode", "yogo", "日の出入りは標高0mで計算", "山の上ではなく、海の高さです。", "日の出入りは、ふつう標高0mとして計算しています。",
      "国立天文台「暦象年表 用語の解説」は、通常は標高0mとして日の出入りを算出しているとしています。",
      ["暦象年表の日の出入りは、ふつう標高何mとして計算？", "日の出入りの時刻を計算するときの標高は？", "国立天文台の日の出入りの計算。ふつうの標高は？"], "0m", ["100m", "1000m", "3776m", "10m", "500m"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "v45|2026-11-28:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: k.grp ? GRP_WHY[k.grp] : "", src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const HMY = { KINDS, BY, GROUPS, GRP_WHY, LV, SRC, LEVELS, RANGE, ORGS: LEVELS, MEDIA, stageOf, grpOf, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = HMY; else root.HMY = HMY;
})(typeof self !== "undefined" ? self : this);
