# Animals Desktop - for Real

チンチラ、ゴールデンハムスター、ジャンガリアンハムスター、マカロニマウス、フクロモモンガ、モルモット、ネザーランドドワーフが、ときどきデスクトップに現れる Mac / Windows 向けアプリです。壁紙は変更せず、クリックを通す透明ウィンドウに動物を表示します。

現在はチンチラ3毛色、ゴールデンハムスター2毛色、ジャンガリアンハムスターのノーマル1種類、マカロニマウスの自然色1種類、フクロモモンガ3毛色・模様、モルモット3毛色・模様、ネザーランドドワーフ3毛色の計16種類を収録しています。静止画像は実在する種と毛色の資料をもとに ImageGen で制作した透明素材です。動作は種ごとに全28パターン。各毛色・模様用に作った透過 WebM が合計64本あります。動画を再生できない環境では透明 PNG 演出に切り替わります。

メニューバー（Mac）または通知領域（Windows）の肉球アイコンから、今すぐ表示、一時停止、動物の単独・複数選択、出現間隔、表示サイズ、動物の表示先、日本語 / English を設定できます。表示サイズは全体の基本値に加え、動物の種類と毛色・模様ごとに上書きできます。「個別設定を消して全体に統一」で一括設定へ戻せます。表示先はカーソルのあるモニタ、メインモニタ、接続中の特定のモニタ、すべてのモニタから選べます。初回起動時に一度表示し、その後は設定した間隔で現れます。

ポモドーロを有効にすると集中中の自動表示を休み、休憩開始時に動物が現れます。標準設定は集中25分・短い休憩5分・4回目の長い休憩15分です。「時間の設定…」で各時間を変えられ、クリック操作を妨げない画面右上の残り時間表示も選べます。「今すぐ表示」は集中中にも使えます。

公式サイト: [Animals Desktop - for Real](https://udteach.github.io/AnimalsDesktopForReal/) ／ [ダウンロード](https://udteach.github.io/AnimalsDesktopForReal/download.html) ／ [Mac 初回起動の手順](https://udteach.github.io/AnimalsDesktopForReal/download.html#mac-first-open)。サイトでは16種類の毛色・模様をトップの丸いボタンで切り替えられ、各カードで4つの動作動画を再生できます。

## 起動

Node.js 24 を使います。

```sh
npm ci
npm run check
npm start
```

## Webでおためし

公式サイトの「Webでおためし」から、インストールせずに動物を見られます。ページを開くと表示が始まり、動物・毛色、出現間隔、大きさ、背景を選べます。「今すぐ表示」「一時停止」も使えます。動きを減らす設定のブラウザでは停止した状態で開くため、「今すぐ表示」か「再開」を押してください。

「全画面にする」で動物の表示面を画面いっぱいに広げます。全画面に対応しない環境では「大きく表示」でページ内を広げます。マウスを動かすか画面をタップすると操作部が現れ、「元に戻す」または Esc で戻れます。動物が現れるのはこのページ内です。作業中のデスクトップへの重ね表示は Mac / Windows 版を使います。

ローカルでは `npm run build:obs` でOBSページとおためしページの両方を生成し、下記HTTPサーバーの `http://localhost:4173/try/` で確認できます。おためしの編集元は `web/try/`、公開用生成物は `docs/try/` です。再生と素材はOBSページと共用し、おためしの選択内容はOBS設定とは別にブラウザへ保存します。

## OBSで使う

公式サイトの「OBSで使う」から、表示したい動物・毛色と動き、出現間隔、サイズ、表示エリアを選びます。プレビューを確認して「OBS用URLをコピー」を押し、OBSの「ブラウザ」ソースのURL欄に貼り付けてください。ブラウザソースの幅と高さは配信キャンバスに合わせます（例: 1920 × 1080）。背景は透明で、音は出ません。

設定ページを閉じてもOBS内で表示が続きます。設定を変えたら新しいURLをコピーしてOBSのURL欄を更新してください。名前付きの設定は、そのブラウザ内に保存できます。別のブラウザやPCでは、OBS用URLを設定ページへ読み込めます。

ローカルで確認する場合は、次のコマンドで公開用ファイルを生成し、`docs/` をHTTPサーバーで開きます。素材の参照先や設定URLのテストは `npm run check:obs` に含まれます。

```sh
npm run build:obs
python3 -m http.server 4173 --directory docs
```

その後、`http://localhost:4173/obs/` を開きます。`docs/obs/` は生成物なので、編集は `web/obs/` と `shared/overlay/` で行います。

## ビルド

```sh
npm run dist:mac
npm run dist:win
```

Mac は Apple Silicon / Intel の DMG と ZIP、Windows は x64 の ZIP を生成します。GitHub のリリースワークフローは Windows 上で NSIS インストーラーも生成します。Mac の最小設定は macOS 12 です。Mac 版はアプリ内部の整合性のためアドホック署名していますが、Apple Developer ID 署名・公証は行っていません。初回起動時に警告が出た場合は [Mac 初回起動の手順](https://udteach.github.io/AnimalsDesktopForReal/download.html#mac-first-open)をご覧ください。

## 素材と根拠

- [毛色・種の調査メモ](research/README.md)
- [素材制作の指示](research/prompts.md)
- [採用素材一覧](research/variants.json)
- [モルモットの毛色・行動とFlow動画12本](research/guinea-pig.md)
- [ネザーランドドワーフの毛色・行動とFlow動画12本](research/rabbit.md)
- [初期5種の動き調査](research/species-motion.md)
- [15パターンの中間フレーム確認](research/qa-motion-patterns.jpg)
- [フクロモモンガ3種類の明暗背景確認](research/qa-sugar-glider.jpg)
- [フクロモモンガの下から登る動画3本](research/flow/sugar-glider-bottom-pop.md)
- [Flow 滑空動画の制作記録](research/flow/README.md)
- [Flow 動作動画30本の制作記録](research/flow/remaining-motions.md)
- [下から顔を出す7本の制作・確認](research/flow/bottom-pop-trial/QA.md)
- [滑空以外27本の明暗確認](research/qa-flow-all-motions.jpg)
- [滑空動画3毛色の実際のアプリ描画](research/qa-flow-sugar-glider.jpg)
- [明色背景での一覧](research/qa-light.jpg) / [暗色背景での一覧](research/qa-dark.jpg)

マカロニマウスには確認できない色違いや品種名を付けていません。画像の基準は *Pachyuromys duprasi* です。
