# AGENTS.md

薄明よみ：太陽の中心の伏角（地平線の下の角度）を見て、いまが太陽が出ている・常用薄明・航海薄明・天文薄明・薄明の外（夜）のどれかを当てる1日5問の学習ゲーム。正解したら、その時間帯の明るさの目安（5つ）も選ぶ。薄明の区切りや日の出・日の入りの決まりの問題も出る。`index.html` と `data.js`（問題の種類）を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node qa/run.mjs   # 問題（34種類×3000問：選び肢・答えは1つ・答えと2段目が国立天文台の区切りどおり・出典）・今日の5問と上級（3年分）・とことん・通しで遊ぶ・続きから・2段目・復習・幅320px・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- 中身は国立天文台 暦計算室「暦Wiki 薄明」<https://eco.mtk.nao.ac.jp/koyomi/wiki/C7F6CCC0.html> と「暦象年表 用語の解説」<https://eco.mtk.nao.ac.jp/koyomi/faq/glossary.html> に書いてあることだけ（2026-11-27・28 に読んだ。要点は共有フォルダ games/hakumei-research.md）。種類を足すときもページを読み、`qa/run.mjs` の表（`UP`・`NOTE`・`FACT`）にも足す。
- 扱うのは、太陽の中心の伏角から薄明を読むことと、それぞれの明るさの目安・日の出入りの決まりだけ。月の満ち欠け（月の形よみ tsuki-katachi）・うるう年（うるう年よみ）と重ねない。ページに無い例（「新聞が読める」など）は使わない。問題の角度は練習の例で、本物の観測ではない。
- 言い方：遊び方と「このゲームについて」と README に、問題の角度は練習のための例で本物の観測の記録ではないことを置く（QA が見る）。区切り（6°・12°・18°）ちょうどの角度は、どちら側に入るか出典に無いので出さない。地平線の下1°より浅い角度も出さない（日の出入りは太陽の上辺で決まり、その前後は太陽の一部が見えるため）。
- 問題は2つの形。角度の問題（伏角 `v<10倍の数>`・地平線の上の高度 `u<10倍>`・高度をマイナスで書く `a<10倍>`・度と分 `m<分>`）は5つの時間帯から選び、正解したら2段目で明るさの目安（日の出から日の入りまで・日常の作業ができる・六分儀で水平線が見える・6等星が見えるかどうかの境目まで・6等星まで見える暗さ）を選ぶ。やさしいは選び肢3つ（答えのとなりは入れない）、ふつう・むずかしいは4つ（むずかしいは答えのとなりを必ず入れる）。むずかしいには区切りのすぐ手前・すぐ先の角度と、高度のマイナス・度と分の書き方を入れる。決まりの問題は答え1つとまちがい2〜3つで、2段目は無い。2回目のヒントはまちがいを消して2つにしぼり、要点（`key`）も見せる。
- 今日の5問（やさしい2・ふつう2・むずかしい1、種類は重ねない）・上級（むずかしい3、今日のむずかしいと別）は日本時間の日付の種で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ。乱数は `sort` の比較の中で引かない。`KINDS`・言い回し・まちがいの選び肢は、足すだけでも過去の日の問題が変わる。公開後は変えず、変えるときは QA の `PINS`（3日分の5問と上級）を作り直して理由を PR に書く。`data.js` を変える PR は自動ではマージされない（`hold_paths`）。
- ★はまちがい＋ヒントの数（0で★3・1で★2・2以上で★1）。上級はヒントなし。時間制限なし。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（shared-workflows `routines/game-dev.md` F1〜F7。QA が見る）。とことん（`runs.e`）はまちがえても続き、「ここで降りる」で終わる。
- 1問を深くする：`depth.js` と `qa/depth-check.mjs` は shared-workflows `template/` の写しで、ここでは直さない。自信あり・2段目「この時間帯の明るさの目安は？」・復習（1→3→7日後）。記録 `hmy-v1`・文字 `hmy-fs`・復習 `hmy-depth`。
- 共有は遊ぶ人が押したときに開くリンクだけ。シェアの文に問題・答えを出さない。感想は Issue フォーム（`.github/ISSUE_TEMPLATE/feedback.yml`）を開くだけ。応援は Ko-fi へのただのリンクだけ。
- 外へ通信しない（CSP の `connect-src 'self'` を広げない）。見やすさ（`<!-- a11y:begin -->`〜`end`・`qa/a11y.mjs`）と引き継ぎ（`transfer.js`・`qa/transfer-check.mjs`）は shared-workflows `template/` の写しで、ここでは直さない。
- 画面の土台は風力階級よみ（fuuryoku-yomi）から写した（ひな形の部品は `node scripts/new-game.mjs` で入れた）。写し元の言葉が残っていないかを QA が見る。保存の読み直しは共通部品 GameStore（`<!-- store:begin -->`〜`end`。shared-workflows `template/store/store.js` の写しで、ここでは直さない）。
- PWA：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、`og.png` は `node tools/make-og.cjs`。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest`・`data.js` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを読み、手でマージする直前に今の head へのレビューを読み直す。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
