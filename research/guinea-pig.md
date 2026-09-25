# モルモット追加の根拠と素材記録

制作・確認日: 2026-09-25。対象は飼育下の短毛モルモット（*Cavia porcellus*）。実在する外見と行動の資料を確認し、ImageGen の透明画像3枚と Google Flow の4秒動画12本を制作した。

## 見た目

| 素材ID | 表示名 | 資料との対応 |
| --- | --- | --- |
| `guinea-pig-tricolor` | 三毛 / Tricolor | 黒・赤茶・白のパッチ。[British Cavy Council の Tort & White 基準](https://www.britishcavycouncil.org.uk/Breeds/NTWCC/TortandWhite-Std.shtml)を外見の参考にした。展示品種の認定を表すラベルではない。 |
| `guinea-pig-self-cream` | クリーム / Self cream | 白斑を含まない淡いクリーム色と黒目。[National Cavy Club の2024年ショー分類](https://nationalcavyclub.com/wp-content/uploads/2024/06/2024-NCC-SCHEDULE-CHAMPIONSHIP-SHOW-use.pdf)の dark-eyed cream を参照。 |
| `guinea-pig-golden-agouti` | ゴールデンアグーチ / Golden agouti | 暖かい茶色に暗い毛先のティッキング。[同じショー分類](https://nationalcavyclub.com/wp-content/uploads/2024/06/2024-NCC-SCHEDULE-CHAMPIONSHIP-SHOW-use.pdf)の golden agouti を参照。 |

短い四肢、丸く幅広い鼻先、垂れ気味の耳、尾の見えない低い胴体を共通の形とした。[東武動物公園の紹介](https://www.tobuzoo.com/zoo/list/2458.html)では前足4本指、後足3本指と説明されている。`research/raw/guinea-pig-*-imagegen.png` が画像生成原本の保存コピー、`assets/animals/` がアプリ採用版。

## 動き

| 動作ID | 動画の内容 | 行動資料 |
| --- | --- | --- |
| `trot` | 左から右へ、体を低く保って短い歩幅で移動する | [市川市動植物園のX動画](https://x.com/ichikawa_zoo/status/1429663054870896646)の歩行例 |
| `forage` | 小さく歩き、鼻先で探り、口を動かす | [RSPCAの飼育環境案内](https://www.rspca.org.uk/adviceandwelfare/pets/rodents/guineapigs/environment)の採食・探索行動、[熊本市動植物園のX投稿](https://x.com/kumamotocityzoo/status/1257607679356186626) |
| `popcorn` | その場で短く跳ね、着地する | [RSPCAのモルモット紹介](https://www.rspca.org.uk/whatwedo/latest/blogs/tenfactsaboutguineapigs)、[徳山動物園のX動画](https://x.com/TOKUYAMA_ZOO/status/1483763716856287234) |
| `bottom-pop` | 下端の隠れ場所から鼻、顔、前足を見せて戻る | [RSPCAの行動案内](https://www.rspca.org.uk/en/adviceandwelfare/pets/rodents/guineapigs/behaviour)の隠れ場所を使う行動。画面下端の出入り方はデスクトップ向けの演出。 |

各毛色の4動作は[既存のFlowプロジェクト](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51)で基準画像を参照させ、16:9・720p・4秒で生成した。`research/flow/guinea-pig-<毛色>-<動作>/flow-source.mp4` が緑背景の原本、同じフォルダの `alpha-contact.jpg` は透過 WebM の8時点を明暗背景に載せた確認画像。アプリには無音の透過 VP9 WebM、Webサイトには同じ WebM と Safari 向けのベージュ背景 MP4 を収録した。変換は `scripts/flow-green-to-webm.js` を使用し、淡いクリームやアグーチの毛を消さないよう動画ごとにキー色と similarity を調整した。

Xの短い映像は飼育下の個体例であり、すべてのモルモットの行動頻度や速度を示さない。「ポップコーン」を常に喜びの表現とは断定しない。動画の秒数と画面内の移動距離は実物の速度測定値ではない。
