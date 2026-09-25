# 種ごとの動き調査とアニメーション方針

確認日: 2026-09-24。初期5種（チンチラ、ゴールデンハムスター、ジャンガリアンハムスター、マカロニマウス、フクロモモンガ）の制作記録。2026-09-25に追加したモルモットの3毛色と4動作は[別の記録](guinea-pig.md)にまとめた。

## 観察と根拠

| 種 | 確認できた行動 | 根拠 | デスクトップ上の短い動き |
| --- | --- | --- | --- |
| チンチラ | 岩場を敏捷に登る・跳ぶ。飼育下では砂箱の中で体を横に倒して回る。 | [Animal Diversity Web](https://animaldiversity.org/accounts/Chinchilla_lanigera/) は登攀・跳躍を記載。[浜松市動物園のX動画](https://x.com/hamamatsuzoo/status/2101215064569303490)では砂箱の中で体を転がす姿を確認。砂浴び自体は[Merck Veterinary Manual](https://www.merckvetmanual.com/exotic-and-laboratory-animals/rodents/chinchillas)も記載。 | 主動作は少し高い位置へ軽く跳んで止まり、周りを見て降りる。砂浴びは容器と横倒しの別フレームを用意できた時だけ採用。 |
| ゴールデンハムスター | 巣穴と餌場を行き来し、夜に餌を集める。飼育下の動画では段差へ前足をかけ、体を引き上げる。 | [Animal Diversity Web](https://animaldiversity.org/accounts/Mesocricetus_auratus/) に採餌移動・巣への貯蔵・側面をこするマーキングの記載。[飼育者のX動画](https://x.com/hamkoyunikki/status/2102743904441561100)に段差を登る個体。 | 地面に沿って小走り→短い停止と鼻先の探索→もう一度移動。段差登りや頬袋は専用フレームができた時に追加。 |
| ジャンガリアンハムスター | 飼育動画では休息姿勢から急に走り出す個体を確認。食事中に両前足で餌を保持する個体も確認。 | [小動物店のX動画](https://x.com/littluce_info/status/2102978767635313104)に寝起きからの短い移動。[飼育者のX写真](https://x.com/tori_nekoze/status/2102598774191489085)に前足で餌を持つ姿。[RSPCAのハムスター行動資料](https://www.rspca.org.uk/adviceandwelfare/pets/rodents/hamsters/behaviour)はハムスター全般の夜間活動・走行・穴掘りを記載。 | 低い姿勢で一瞬静止→短く素早く移動→静止。ゴールデンより「常に速い」とは決めつけず、1投稿の観察を短い演出案として扱う。両手で食べる動きは別フレームが必要。 |
| マカロニマウス | 巣穴で過ごし、飼育下では短い活動を長い睡眠が挟む。飼育者は穴掘りを好む個体を報告し、写真には体を低くして休む姿がある。 | [Animal Diversity Web](https://animaldiversity.org/accounts/Pachyuromys_duprasi/) に穴居、薄暮・夜間活動、短い活動と長い睡眠の記載。[飼育者のX投稿](https://x.com/bloodbier/status/2098611257050022104)は穴掘り好きと記録。[別の飼育者のX写真](https://x.com/Kayo296/status/2100950698762580168)は低く休む個体。[飼育者のX動画](https://x.com/harusan_uta34/status/2101675109790650413)では2匹が床材の上で身を寄せる。 | 低い位置からゆっくり顔を出す→小さく位置を変える→胴を低く落ち着ける。速い連続ジャンプや激しい上下動は使わない。穴掘り表現は前足・床材のフレームができた時に追加。 |
| フクロモモンガ | 夜行性で樹上を移動し、跳ぶ前に構え、飛膜を広げて木から木へ滑空する。 | [San Diego Zoo](https://animals.sandiegozoo.org/animals/sugar-glider)は樹上生活、ジャンプ前の動き、飛膜による滑空を記載。[Australian Museum](https://australian.museum/learn/animals/mammals/sugar-glider/)は飛膜と尾の働きを説明。[飼育者のX動画](https://x.com/momofuku_88/status/2096797604898013364)では低く構えて跳ぼうとする個体を確認。 | 飛膜を広げて画面を横切る専用動画、姿を見せて一時停止、画面端からうかがう。 |

## 初期版に追加した3パターンずつ

`electron/main.js` は選ばれた種の3パターンからランダムに1つ選ぶ。毛色違いは同じ3パターンを共用する。

| 種 | パターン1 | パターン2 | パターン3 |
| --- | --- | --- | --- |
| チンチラ | `chinchilla-hop`: 小さく跳び、着地して止まる | `chinchilla-perch`: 少し高く出て周囲をうかがう | `chinchilla-peek`: 画面左から顔を出す |
| ゴールデンハムスター | `hamster-forage`: 小走りと停止を繰り返す | `hamster-explore`: 下から出て少し位置を変える | `hamster-peek`: 画面左からうかがう |
| ジャンガリアン | `djungarian-dash`: 一瞬止まり、短く走る | `djungarian-pause`: 下から出て短く移動、静止 | `djungarian-peek`: 左から素早く顔を出す |
| マカロニマウス | `macaroni-emerge`: ゆっくり低い位置から出る | `macaroni-shuffle`: 左から短く移動して休む | `macaroni-settle`: 出てから低い位置に落ち着く |
| フクロモモンガ | `sugar-glider-glide`: 飛膜を広げて横切る Flow 動画 | `sugar-glider-perch`: 下から姿を見せて静止 | `sugar-glider-peek`: 左端からうかがう |

通常の `electron/overlay.html` の出現演出は1枚の透明PNG全体を動かす方式なので、表現できるのは速さ、軌道、高さ、停止時間、体全体の小さな傾きまで。足運び、頬袋、砂浴び、穴掘り、目や鼻の動きは画像全体の変形では自然にならない。[Flowで制作した滑空動画](flow/README.md)と[追加の動作動画](flow/remaining-motions.md)が存在する毛色・動作では専用の透過WebMを再生し、ほかはPNG演出を使う。

15パターンの中間フレームを実際の Electron 描画から切り出し、[一覧画像](qa-motion-patterns.jpg)で顔・体の見切れを確認した。フクロモモンガの滑空は3毛色それぞれを[明暗背景で確認](qa-flow-sugar-glider.jpg)した。「のぞく」動作は、現行素材が右向きなので左端から出る向きに統一した。

## 調査上の限界

Xの短い動画・写真は飼育下の個体例であり、すべての個体の速さや頻度を示さない。マカロニマウスの穴掘りは投稿文による飼育者の報告で、該当投稿の写真から動作の手順は判定していない。各アニメーションの秒数や移動距離はUIの演出値であり、実物の速度測定値ではない。
