# Flow 滑空動画の制作記録

滑空以外の制作状況は [動作動画の制作記録](remaining-motions.md) を参照。

制作日: 2026-09-24〜25。対象はフクロモモンガ3毛色の `sugar-glider-glide`。現行アプリの静止PNGとは別の、飛膜を開いた4秒の短い動画である。

[Google Flow の専用プロジェクト](https://flow.google.com/project/88a263f6-17d7-4e59-8947-3d69f7ad1e73)で基準画像を作り、標準グレー、リューシスティック、グレーモザイクの順に開始フレーム付き動画を生成した。設定は16:9、720p、4秒、各1出力。採用候補ごとの指示文と元のMP4・画像を各ディレクトリに保存した。

| 毛色 | Flow の動画 | 元動画 | アプリ用の透明動画 | 確認画像 |
| --- | --- | --- | --- | --- |
| 標準グレー | [Flow](https://flow.google.com/project/88a263f6-17d7-4e59-8947-3d69f7ad1e73/edit/864c415d-d15b-400c-a045-12367e1875ca) | [MP4](sugar-glider-standard-gray-glide/flow-source.mp4) | `assets/motions/sugar-glider-standard-gray-glide.webm` | [明暗比較](sugar-glider-standard-gray-glide/qa-matte-contact.jpg) |
| リューシスティック | [Flow](https://flow.google.com/project/88a263f6-17d7-4e59-8947-3d69f7ad1e73/edit/d2884cf3-ec48-4b99-8035-b86fead70eef) | [MP4](sugar-glider-leucistic-glide/flow-source.mp4) | `assets/motions/sugar-glider-leucistic-glide.webm` | [明暗比較](sugar-glider-leucistic-glide/qa-matte-contact.jpg) |
| グレーモザイク | [Flow](https://flow.google.com/project/88a263f6-17d7-4e59-8947-3d69f7ad1e73/edit/1f1f2feb-e4c7-49f8-8bc2-51ae2119a9fc) | [MP4](sugar-glider-gray-mosaic-glide/flow-source.mp4) | `assets/motions/sugar-glider-gray-mosaic-glide.webm` | [明暗比較](sugar-glider-gray-mosaic-glide/qa-matte-contact.jpg) |

標準グレーのテキストのみの最初の2試作は不採用。1本目は尾がフレーム外に出て床と影が生じ、飛膜を開かなかった。2本目は全身と背景を改善したが、腕と脚の間の膜が十分に見えなかった。2本の原本は `sugar-glider-standard-gray-glide/rejected/` に残した。採用動画は Flow 内で飛膜を広げた画像を作り、その画像を開始フレームに指定した。白毛とモザイクは同じ基準画像の色・模様を編集し、体型と飛膜の幅を揃えた。

MP4 の緑背景を FFmpeg の `chromakey` と `despill` で透明化し、VP9 alpha WebM に変換した。標準グレーのキー色は `0x16d81c`、白毛は `0x1acb1d`、モザイクは `0x1ed020`。3本とも `similarity=0.14`、`blend=0.05`。白毛・モザイクは `despill mix=0.6, expand=0`、標準グレーは `mix=0.8, expand=0.2`。Flow の元画像がやや左向きに見えるため、アプリ用動画だけ水平反転し、画面内の進行方向と揃えた。音声は除去した。加工は背景・向きの正規化であり、動物の形や模様を描き足していない。

各動画の0.5秒刻み8フレームで全身、4本の脚、飛膜、毛色、白斑、耳、尾を確認した。[実際のElectron表示](../qa-flow-sugar-glider.jpg)でも3毛色を明暗背景に合成して確認した。Flowの動きは短い演出であり、移動距離や滑空速度の実測値ではない。
