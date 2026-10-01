# ハシビロコウ・アルプスマーモットの組み込み用素材

各4動作、計8本。動画は無音の透過VP9 WebM、画像は透明RGBA PNG。
プロンプト、Flow原本リンク、確認結果は [provenance/manifest.json](provenance/manifest.json) に保存した。
生成原本のMP4と加工記録は、プロジェクト内の research/zoo-expansion/flow/ に保管している。

- `animals/`: 基準画像2枚
- `motions/`: アプリ向け透過動画8本
- `previews/`: 淡い背景付きの確認用MP4 8本
- `posters/`: 再生プレビューの静止画像8枚
- `preview.html`: 8本を再生する確認ページ
- `catalog.json`: 種名、素材ID、動作ID
- `provenance/`: 生成設定、原本リンク、プロンプト、確認結果

顔出し用の `*-bottom-pop.webm` は画面下端への出入りを加工済み。
ほかの6本は生成された動作を透過化したもの。

v0.6.0でアプリの種一覧、動作一覧、描画設定、公開サイト、Webおためし、OBSへ追加した。
全体の採用カタログはプロジェクトの research/variants.json と shared/motions.cjs に保存している。
