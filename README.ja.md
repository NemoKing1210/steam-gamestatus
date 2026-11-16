# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · **日本語** · [한국어](README.ko.md) · [Polski](README.pl.md)

[![ユーザースクリプトをインストール](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![ライセンス: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![バージョン](https://img.shields.io/badge/version-1.14.1-green?style=for-the-badge)](CHANGELOG.md)

Steam ストアと Steam コミュニティ向けのユーザースクリプトで、[GameStatus.info](https://gamestatus.info) からゲームの追加情報（保護、発売日、スコア、ハードウェア要件など）を表示します。

Steam を閲覧している間、ストアを離れることなく、ゲームカードやゲームページのヘッダーにコンパクトな情報バッジが表示されます。

[Tampermonkey](https://www.tampermonkey.net/)、[Violentmonkey](https://violentmonkey.github.io/)、[Greasemonkey](https://www.greasespot.net/)、ScriptCat、および `// ==UserScript==` メタデータブロックに対応するその他のマネージャーと互換性があります。

## クイックインストール

1. ユーザースクリプトマネージャーをインストールします（Tampermonkey または Violentmonkey を推奨）。
2. 下のインストールリンクをクリックします。マネージャーがインストール確認を開きます。

**インストール URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![インストール](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### URL からインストール（ダッシュボード）

| マネージャー | 手順 |
|---------|------|
| Tampermonkey | ダッシュボード → **Utilities** → **Install from URL** |
| Violentmonkey | ダッシュボード → **+** → **Install from URL** |
| Greasemonkey | アドオンメニュー → **New User Script** → raw URL を貼り付け |

上記のインストール URL を貼り付けてください。

### 手動インストール

1. このリポジトリの [`steam-gamestatus.user.js`](steam-gamestatus.user.js) を開きます。
2. ファイルの内容をすべてコピーします。
3. ユーザースクリプトマネージャーで新しいスクリプトを作成し、コードを貼り付けます。
4. 保存してスクリプトを有効にします。

## 更新

スクリプトには GitHub の raw ファイルを指す `@updateURL` と `@downloadURL` メタデータが含まれています。対応マネージャーは自動的に更新を確認します（Tampermonkey: ダッシュボード → 確認間隔、Violentmonkey: 同様）。

マネージャーはインストール済みの `@version` とリモートのメタデータを比較し、更新を提示するか判断します。

## 機能

- **設定パネル** — ヘッダーのボタンから、バッジの位置・サイズ、カードの位置、キャッシュ期間、キャッシュのクリア、「データベースに未登録」バッジの表示を設定
- **ゲームカードのステータスバッジ** — ストアのホーム、検索結果、ウィッシュリスト、セールページなど、`/app/{id}` リンクを含む一覧
- **ゲームページのステータスバッジ** — `.apphub_OtherSiteInfo` 内、Community Hub / Store Page リンクの隣に表示されるコンパクトなチップ
- **詳細なツールチップ** — カバー画像、ステータスチップ、色分けされたスコア、ハードウェア情報を含む Steam 風ポップオーバー
- **色分けされたステータス** — 長いゲームリストをすばやく視覚的に確認
- **遅延読み込み** — カードが画面内に入ったときだけバッジを読み込み
- **スマートキャッシュ** — レスポンスをローカルにキャッシュし、API 負荷を抑えて再訪問を高速化
- **Steam 風 UI** — Steam の `.app_tag` に似たバッジ、ストアのホバーポップオーバーに似たツールチップ
- **10 言語の UI** — 英語、ロシア語、中国語、スペイン語、ポルトガル語、ドイツ語、フランス語、日本語、韓国語、ポーランド語（ブラウザの言語から自動判定）

## 対応ページ

| サイト | URL パターン |
|------|-------------|
| Steam ストア | `https://store.steampowered.com/*` |
| Steam コミュニティ（アプリハブ） | `https://steamcommunity.com/app/*` |

## ステータスの色

各バッジには、GameStatus.info 上のゲームのステータスを反映した色付きのドットがあります：

| 色 | ステータス | 意味 |
|-------|--------|---------|
| 緑 | 準備完了 | ゲームが準備完了 / 利用可能であることを示します |
| オレンジ | 保留中（最近） | 保留ステータス。ゲームの発売から 1 か月未満 |
| 赤 | 保留中（長期） | 保留ステータス。ゲームの発売から 1 か月以上 |
| オレンジ | 保護回避 | 保護を回避する方法があることを示します |
| 青 | 本日リリース | ゲームは本日発売。ステータスはまだ保留の場合があります |
| グレー | ステータス不明 / データベースに未登録 | ステータスが不明、または GameStatus.info でゲームが見つかりません |
| 青（スピナー） | 読み込み中 | API からデータを取得中 |

バッジをクリックすると、GameStatus.info のゲームページが開きます（ゲームが見つからない場合はサイトのトップページ）。

## ツールチップの内容

バッジにカーソルを合わせると Steam 風のポップオーバーが開き、次の情報が表示される場合があります：

- **ヘッダー** — カバー画像、タイトル、ステータスチップ、AAA / 保護 / グループのチップ
- **日付** — 発売日とステータス更新日、Steam ID、登録者数
- **スコア** — GameStatus と Metacritic の値。Metacritic 風の色（緑 ≥75、黄 ≥50、赤はそれ未満）
- **スペック** — CPU、RAM、GPU、OS（利用可能な場合）
- **説明** — ゲームの短い説明
- **フッター** — サポートボタンと API / GameStatus へのリンク

ゲームがデータベースにない場合、ポップオーバーには「データベースに未登録」チップと、検索時に試行した API URL の一覧が表示されます。

## 設定

Steam ヘッダーの **GameStatus**（またはユーザースクリプトマネージャーのメニュー）を開いて設定します：

| 設定 | 既定値 | 備考 |
|---------|---------|--------|
| バッジの位置（垂直 / 水平） | 上 / 左 | ストアカードのバッジのみ。ゲームページのチップはヘッダーのまま |
| カードの位置 | 左 | ゲームの横に GameStatus カードを開く位置。スペースがない場合は空いている次の辺に切り替わります |
| バッジのサイズ | 中 | 小 / 中 / 大 / 特大。ストアカードのバッジのみ |
| 「データベースに未登録」バッジを表示 | オン | オフにすると、一致しないカードは未マークのまま |
| キャッシュ期間（時間） | 6 | すべてのキャッシュ済み検索に適用。最大 168（7 日） |
| キャッシュをクリア | — | 即時。保存は不要 |

## 開発者向け

このセクションは専用ガイドに移動しました：

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — ビルド、ローカルテスト、設定、リリース
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 仕組み、リポジトリ構成、メタデータ、権限
- [CONTRIBUTING.md](CONTRIBUTING.md) — コントリビューションの流れと PR チェックリスト
- [AGENTS.md](AGENTS.md) — AI コーディングエージェント向けの指示
- [SECURITY.md](SECURITY.md) — セキュリティポリシーと非公開での報告

## その他のユーザースクリプト

同じ作者による他のユーザースクリプト：

| ユーザースクリプト | できること |
|:-------------------|:-----------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Steam ストアと Steam コミュニティのコンテンツ（ゲーム説明、レビュー、プロフィールコメント、ニュース）をページ上で翻訳する充実した設定パネル |
| [![Steam Region Block Bypass](https://img.shields.io/badge/Steam_Region_Block_Bypass-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-region-block-bypass) | Steam が「このアイテムはお住まいの地域では現在ご利用いただけません」と表示したときにストアの製品ページを復元します |

## データソース

すべてのゲームデータは公開 GameStatus.info API から取得しています：

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

このプロジェクトは Valve、Steam、GameStatus.info と**提携していません**。ステータス情報はコミュニティによって維持されており、不完全または古い場合があります。参考情報として使用し、保証として扱わないでください。

## ライセンス

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
