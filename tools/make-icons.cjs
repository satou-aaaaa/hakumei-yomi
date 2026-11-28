// アプリのアイコン（icon-192.png・icon-512.png）を作る。紺の地に、風に流れる3本の線と吹き流し（風の強さ）。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#123554"/>
      <circle cx="50" cy="72" r="20" fill="#f6d77a"/><rect y="70" width="100" height="30" fill="#0b1f33"/><path d="M8 70 H92" stroke="#fffdf7" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="24" r="3" fill="#fffdf7"/><circle cx="70" cy="18" r="2.5" fill="#fffdf7"/><circle cx="82" cy="40" r="2" fill="#7fc4ef"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
