# Animals Desktop - for Real

チンチラ、ゴールデンハムスター、ジャンガリアンハムスター、マカロニマウス、フクロモモンガが、ときどきデスクトップに現れる Mac / Windows 向けアプリです。壁紙は変更せず、クリックを通す透明ウィンドウに動物を表示します。

現在は最初の動作版です。チンチラ3毛色、ゴールデンハムスター2毛色、ジャンガリアンハムスターのノーマル1種類、マカロニマウスの自然色1種類、フクロモモンガ3毛色・模様の計10種類を収録しています。静止画像は実在する種と毛色の資料をもとに ImageGen で制作した透明素材です。種ごとに3つ、合計15の出現演出を用意しました。10毛色と各3動作の組み合わせ30本は、Flow で生成した透過 WebM を再生します。動画を再生できない環境では透明 PNG 演出に切り替わります。

メニューバー（Mac）または通知領域（Windows）の肉球アイコンから、今すぐ表示、一時停止、動物の単独・複数選択、出現間隔、表示サイズ、日本語 / English を設定できます。初回起動時に一度表示し、その後は設定した間隔で現れます。

ポモドーロを有効にすると集中中の自動表示を休み、休憩開始時に動物が現れます。標準設定は集中25分・短い休憩5分・4回目の長い休憩15分です。「時間の設定…」で各時間を変えられ、クリック操作を妨げない画面右上の残り時間表示も選べます。「今すぐ表示」は集中中にも使えます。

公式サイト: [Animals Desktop - for Real](https://udteach.github.io/AnimalsDesktopForReal/) ／ [ダウンロード](https://udteach.github.io/AnimalsDesktopForReal/download.html)

## 起動

Node.js 24 を使います。

```sh
npm ci
npm run check
npm start
```

## ビルド

```sh
npm run dist:mac
npm run dist:win
```

Mac は Apple Silicon / Intel の DMG と ZIP、Windows は x64 の ZIP を生成します。GitHub のリリースワークフローは Windows 上で NSIS インストーラーも生成します。Mac の最小設定は macOS 12 です。コード署名・公証は行っていません。Mac で初回起動時に警告が出た場合は Finder からアプリを右クリックして「開く」を選んでください。

## 素材と根拠

- [毛色・種の調査メモ](research/README.md)
- [素材制作の指示](research/prompts.md)
- [採用素材一覧](research/variants.json)
- [種ごとの動きと15パターン](research/species-motion.md)
- [15パターンの中間フレーム確認](research/qa-motion-patterns.jpg)
- [フクロモモンガ3種類の明暗背景確認](research/qa-sugar-glider.jpg)
- [Flow 滑空動画の制作記録](research/flow/README.md)
- [Flow 動作動画30本の制作記録](research/flow/remaining-motions.md)
- [滑空以外27本の明暗確認](research/qa-flow-all-motions.jpg)
- [滑空動画3毛色の実際のアプリ描画](research/qa-flow-sugar-glider.jpg)
- [明色背景での一覧](research/qa-light.jpg) / [暗色背景での一覧](research/qa-dark.jpg)

マカロニマウスには確認できない色違いや品種名を付けていません。画像の基準は *Pachyuromys duprasi* です。
