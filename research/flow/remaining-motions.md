# Flow 動作動画の制作記録

制作日: 2026-09-25。[種ごとの動き調査](../species-motion.md)に沿い、[Animals Desktop - for Real — Remaining Motions](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51)で各毛色の開始画像から 16:9・720p・4秒の動画を制作した。滑空3本を含め、10毛色 × 3動作の30本をアプリに採用した。Flow の緑背景付き MP4 原本は各 `research/flow/<毛色と動作>/flow-source.mp4` に保存し、`scripts/flow-green-to-webm.js` で無音・透明 VP9 WebM に変換した。

| 種・毛色 | 採用した動作 |
| --- | --- |
| チンチラ・標準グレー | hop, perch, peek |
| チンチラ・ベージュ | hop, perch, peek |
| チンチラ・ホワイトモザイク | hop, perch, peek |
| ゴールデンハムスター・ゴールデン | forage, explore, peek |
| ゴールデンハムスター・黒目クリーム | forage, explore, peek |
| ジャンガリアン・ノーマル | dash, pause, peek |
| マカロニマウス・自然色 | emerge, shuffle, settle |
| フクロモモンガ・標準グレー | glide, perch, peek |
| フクロモモンガ・リューシスティック | glide, perch, peek |
| フクロモモンガ・グレーモザイク | glide, perch, peek |

各フォルダの `alpha-contact.jpg` は WebM の8時点を白・濃灰背景で確認した画像。[滑空以外27本の一覧](../qa-flow-all-motions.jpg)でも全身、毛色、尾、足、輪郭を確認した。緑抜きは動画ごとの背景色を採り、`similarity=0.12〜0.14`、`blend=0.05` を目安に調整した。フクロモモンガの止まり・顔出しは緑の色味が他と違ったため、各 MP4 の背景色を基準に透過した。[滑空3本の制作記録](README.md)には飛膜と向きの検証を記した。

グレーモザイクの止まり・顔出しは Flow 内で標準グレー画像を編集し、灰色地に不規則な白斑と白い尾先を加えた[基準画像](references/sugar-glider-gray-mosaic-flow.jpg)から作った。リューシスティックの止まり動画の初回生成は後半で尾が切れたため不採用とし、原本・透過版・確認画像を `sugar-glider-leucistic-perch/rejected-clipped-tail/` に保存した。採用版は全身が収まるよう再生成した。チンチラの初期試作も緑の床と影が残ったため不採用にした。

アプリは `assets/motions/<毛色ID>-<動作>.webm` を優先再生し、ファイルがない場合や再生に失敗した場合は透明 PNG 演出へ戻る。`npm run check` と Electron の実描画確認を実施した。macOS arm64・x64、Windows x64 の配布パッケージには30本すべてを同梱した。
