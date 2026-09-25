# ネザーランドドワーフ：3毛色と4動作

2026-09-25に、ネザーランドドワーフの3毛色を既存のアプリと紹介ページに追加した。画像と動画は生成素材であり、実写ではない。

## 毛色

| 表示名 | 資料上の呼称 | 制作で確認した特徴 |
| --- | --- | --- |
| チェスナット | Chestnut | 茶色のアグーチ系。耳・背中の濃淡、淡い腹側 |
| フォーン（小麦色） | Fawn | あたたかい淡い黄褐色。ユーザーの「小麦色」に対応する表示名 |
| ブラック・ヒマラヤン | Himalayan (Black) | 白地に黒い短い耳、鼻先、足先、尾のポイント。赤みのある目 |

米国の [ARBA Breed ID Guide](https://arba.net/wp-content/uploads/2023/03/Breed-ID-Guide-Updated-March-2023.pdf) にはネザーランドドワーフの Chestnut、Fawn、Black Himalayan が掲載されている。毛色の見え方は [Midland Area Netherland Dwarf Rabbit Club の品種標準](https://mandrc.weebly.com/breed-standard.html)とも照合した。白地の子を「耳だけ黒い架空の模様」とせず、実在するブラック・ヒマラヤンとして鼻・足・尾のポイントも入れた。

## 動作

| 動作ID | 映像 | 根拠と演出 |
| --- | --- | --- |
| `hop` | 小さく連続して跳ねる | Rabbit Welfare Association は走る・跳ぶ行動をうさぎの自然な活動として挙げている |
| `sniff` | 鼻先を動かして周囲を探る | 探索・採食行動を短い動きにした |
| `periscope` | 後脚で立ち、周囲を見回す | Rabbit Welfare Association が立ち上がって周囲を見る行動を挙げている |
| `bottom-pop` | 画面下端から顔と前足を出し、再び下へ戻る | 実際の跳躍・立ち上がりを、アプリの画面端の登場方法に合わせた演出 |

行動の確認資料：[Rabbit Welfare Association & Fund — Outdoor housing](https://rabbitwelfare.co.uk/welfare-need/outdoor-housing/)、[House Rabbit Society — Reading Your Rabbit's Behavior](https://rabbit.org/behavior/reading-your-rabbits-behavior/) 。「下からぴょこ」は生態上の名称ではなく画面用の演出名。

## 素材と確認

- 各毛色の透明PNGを `assets/animals/rabbit-netherland-*.png` に採用。ImageGenの元画像は `research/raw/` に保存。
- Google Flowで4秒の動画を各毛色4本、計12本生成。緑背景の原本は `research/flow/rabbit-netherland-*/flow-source.mp4` に保存。
- `scripts/flow-green-to-webm.js` で背景を透過。白毛に緑の逆補正でピンクが出るため、ブラック・ヒマラヤンでは despill を省略した。
- `bottom-pop` は `scripts/flow-bottom-pop-edge.js` で動画自体を画面下端の外から出入りさせ、開始・終了を透明にした。フェードではない。
- ブラック・ヒマラヤンの `bottom-pop` は耳の短さを優先し、Flowの再生成版を採用。初稿と再生成版は同じフォルダに残した。
- 各動画の明暗背景でのサンプルは `research/flow/rabbit-netherland-*/alpha-contact.jpg` と `entry-contact.jpg`、一覧は `research/flow/rabbit-alpha-overview.jpg`。採用した透過WebMは `assets/motions/`、Web用のWebMとMP4は `docs/assets/motions/`。

一覧は上からチェスナット、フォーン、ブラック・ヒマラヤン、各行は左から `hop`、`sniff`、`periscope`、`bottom-pop` の順。下から出る動画の欄には、出入りを加工した後の確認画像を使用した。

生成動画には毛や輪郭のわずかな揺れがあり、実写の同一個体を忠実に撮影したものではない。毛色と形が動作中に大きく変わらないものを選んだ。
