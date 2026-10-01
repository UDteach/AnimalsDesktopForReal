# 動物園の動物：基準画像

制作・確認日: 2026-10-01。ユーザーが指定したハシビロコウとマーモットの、リアルな透過基準画像を内蔵 ImageGen で1種ずつ新規生成した。
マーモットには複数種があるため、今回の画像はアルプスマーモット（*Marmota marmota*）を制作上の基準としている。

| 素材ID | 動物 | 基準画像 | プロンプト |
| --- | --- | --- | --- |
| `shoebill-natural` | ハシビロコウ / Shoebill（*Balaeniceps rex*） | [透過PNG](source/shoebill-natural-imagegen.png) | [生成指示](prompts/shoebill-natural.txt) |
| `marmot-alpine-natural` | アルプスマーモット / Alpine marmot（*Marmota marmota*） | [透過PNG](source/marmot-alpine-natural-imagegen.png) | [生成指示](prompts/marmot-alpine-natural.txt) |

画像は各1254×1254、RGBA、1匹の全身、右向きの斜め前。生成されたアルファをそのまま保存し、動物の画素を手描き・補間生成・色補正していない。
生成原本の保存コピーをこのフォルダ内で管理する。

## 外見と動作の根拠

ハシビロコウの大きなくちばしと頭、採餌時に待つ行動は[上野動物園の生き物図鑑](https://www.tokyo-zoo.net/ueno/encyclopedia/shoebill/index.html)を確認した。
[上野動物園の解説](https://www.tokyo-zoo.net/ueno/shoebill-quiz/index.html)には、くちばしを打ち鳴らすクラッタリングや、翼を広げる・歩く・飛ぶ行動も記載されている。
「常に動かない」とは扱わない。

アルプスマーモットの頑丈で丸い体、灰色と茶色が混じる毛、座って周囲を見張る行動は[ミシガン大学 Animal Diversity Web](https://animaldiversity.org/accounts/Marmota_marmota/)を確認した。
生成画像は種の特徴を基にした素材であり、特定の動物園の個体や実写写真の複製ではない。

## 確認結果

[明暗背景と90px縮小の一覧](qa/light-dark-small.jpg)で、全身、右向き、足・尾の見切れ、透過の縁を目視確認した。
ハシビロコウはくちばし、冠羽、畳んだ翼、長い脚と足先が確認できる。
マーモットは小さな耳、幅広い鼻先、前足、後足、短い毛尾が確認できる。
明暗どちらの背景でも、別個体、床、影、文字、目立つ背景の残りは見られない。
[アルファ確認の数値](qa/alpha.json)も保存した。低アルファの微小画素で測定領域が広がるため、可視輪郭はアルファ80以上と8以上の領域を併記している。

## 動作動画

同日、ユーザーの指定によりGoogle Flowで各4動作・計8本を制作し、透過WebMへ変換した。
[再生プレビュー](ready/preview.html)と[Flowの制作・確認記録](flow/README.md)を参照。
組み込み用素材は `ready/` に保存した。v0.6.0で採用カタログ、アプリの表示、日英サイト、Webおためし、OBSへ追加した。配布素材は `assets/animals/` と `assets/motions/`、公開用素材は `docs/assets/` にコピーしている。
