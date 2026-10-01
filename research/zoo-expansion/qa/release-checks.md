# v0.6.0 組み込み確認

- `npm run check`: 12テストと18 PNG・72 WebMの素材照合が成功。
- `npm run check:obs`: 8テストとWeb公開用の生成物照合が成功。
- `overlay-smoke.cjs`: 実際のElectron preloadとoverlayにIPCを送り、新しい8動画と8 PNG代替表示のデコード、アルファ、可視性、出入りの指定、終了通知を確認。結果は `overlay-smoke.json`。
- `npm run pack -- --mac --arm64`: 成功。梱包済みのapp.asarがv0.6.0・18種類、外部resourcesが18 PNG・72 WebMであることを照合。
- `codesign --verify --deep --strict`: 梱包済みApple Silicon Macアプリの署名検証が成功。
- Webおためしで2種を選択してWebM再生を確認。日英紹介カードの4動作ラベルを反映し、日本語カードのクラッタリングと毛づくろいを再生確認。

GitHubの既存ワークフローでMac両CPUとWindowsインストーラー・ZIPをビルドし、リリース成立後にmainへ公開サイトを反映する。
