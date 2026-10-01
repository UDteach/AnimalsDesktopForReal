# ハシビロコウとアルプスマーモット：Flow動画

制作・確認日: 2026-10-01。Google Flowで2種×4動作、計8本を生成し、無音・透過VP9 WebMに変換した。
[再生プレビュー](../ready/preview.html)と[組み込み用のカタログ情報](../ready/catalog.json)を同梱している。
v0.6.0でアプリの採用カタログ、公開サイト、配布パッケージへ追加した。

## 動作と原本

[既存のFlowプロジェクト](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51)に、基準PNGを緑背景の開始フレームとしてアップロードした。
最初にハシビロコウの静止とマーモットの見回しを確認し、残りの動作も同じ開始画像から生成した。
設定は16:9・720p・4秒・1出力・フレーム動画・Omni 1.1 Flash。画面の表示では1生成7クレジット、8生成で計56クレジット。
再生成は行っていない。

| 動物 | 動作 | Flowの原本 | 緑背景MP4 | 透過後の明暗確認 |
| --- | --- | --- | --- | --- |
| ハシビロコウ | 立って待つ / perch | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/e1b4a7fb-d542-4204-8288-b27a84fd2ff1) | [MP4](shoebill-natural-perch/flow-source.mp4) | [確認画像](shoebill-natural-perch/alpha-contact.jpg) |
| ハシビロコウ | ゆっくり歩く / walk | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/16c15261-8f2a-4b63-a262-8be3aa23bf80) | [MP4](shoebill-natural-walk/flow-source.mp4) | [確認画像](shoebill-natural-walk/alpha-contact.jpg) |
| ハシビロコウ | くちばしを開閉する / clatter | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/23eb7161-26d6-4474-81fb-f6df727d2d18) | [MP4](shoebill-natural-clatter/flow-source.mp4) | [確認画像](shoebill-natural-clatter/alpha-contact.jpg) |
| ハシビロコウ | 下から顔を出す / bottom-pop | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/38767b08-4f8b-4fc9-9e71-0ad2f2a6061d) | [MP4](shoebill-natural-bottom-pop/flow-source.mp4) | [確認画像](shoebill-natural-bottom-pop/alpha-contact.jpg) |
| アルプスマーモット | 座って見回す / periscope | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/1d986e17-4e25-4e79-bc4c-02681bf8db99) | [MP4](marmot-alpine-natural-periscope/flow-source.mp4) | [確認画像](marmot-alpine-natural-periscope/alpha-contact.jpg) |
| アルプスマーモット | 毛づくろい / groom | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/5ffbf191-76d2-46e2-9feb-0801e304a75a) | [MP4](marmot-alpine-natural-groom/flow-source.mp4) | [確認画像](marmot-alpine-natural-groom/alpha-contact.jpg) |
| アルプスマーモット | 短く移動する / shuffle | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/fe8b23f2-3785-4ef5-b605-8637af24e3da) | [MP4](marmot-alpine-natural-shuffle/flow-source.mp4) | [確認画像](marmot-alpine-natural-shuffle/alpha-contact.jpg) |
| アルプスマーモット | 下から顔を出す / bottom-pop | [Flow](https://flow.google.com/project/641d619c-8f17-4700-a79e-8ade3cb00c51/edit/9e5378c8-13a5-4d7e-979a-ccc0358e6521) | [MP4](marmot-alpine-natural-bottom-pop/flow-source.mp4) | [確認画像](marmot-alpine-natural-bottom-pop/alpha-contact.jpg) |

各フォルダの `prompt.txt` が実際に入力した指示。生成設定、原本リンク、採用判定、加工内容、出力先は[manifest.json](manifest.json)にまとめた。
歩く動画は「一歩」の指示から、複数の小さな歩みに仕上がったため、プレビューでは「ゆっくり歩く」と表示する。

## 加工と確認

開始画像は元の透過PNGを576×576に縮小し、1280×720の一色の緑背景（#16e91b）へ配置した。
動物の形や模様は描き足していない。
元のMP4は1280×720・24fps・約4秒。音声は配布用から除去した。

透過には既存の `scripts/flow-green-to-webm.js` を使用した。
RGBキー `0x16e91b`、similarity 0.15、blend 0.05、despill mix 0.5 / expand 0、水平反転なし。
各動画の8時点を明暗背景で確認し、全身、くちばし・足・尾の見切れ、余分な手足、別個体、床や影の残りを確認した。
動画は生成による短い演出であり、実物の動作速度の測定や特定個体の実写ではない。

顔出し用の原本では全身を維持し、透過後に動画全体を画面下へ移動させて出入りを付けた。
既存の `scripts/flow-bottom-pop-edge.js` を[この制作フォルダ用に調整した版](bottom-pop-edge.js)で、0〜0.8秒に出現、3〜3.8秒に退出する。
初回の加工ではマーモットの最後のフレームに頭の縁が1行残ったため、退出を3.8秒で完了させた。
動物の生成画素を修正したものではない。

[全フレームの機械確認結果](audit.json)には、透過元の全フレームの輪郭余白、アルファ、最終WebMの形式・解像度・秒数を保存した。
顔出し用の2本は最初と最後のフレームが完全に透明になることも確認する。
確認と素材のコピー、MP4プレビューの生成は[prepare-ready.py](prepare-ready.py)で再実行できる。

## 組み込み用素材

`../ready/animals/` に透過PNG2枚、`../ready/motions/` に透過WebM8本。
`../ready/previews/` は確認用の淡い背景付きMP4、`../ready/posters/` はその静止フレーム。
下から顔を出す2本のWebMには、出入りの加工が済んでいる。

生成原本と自然な動作の透過版は本フォルダ内に保存したまま、組み込み用ファイルを別にコピーしている。
v0.6.0への組み込みでは採用数、日英サイト、WebおためしとOBSのカタログ、アプリの表示処理を更新した。
