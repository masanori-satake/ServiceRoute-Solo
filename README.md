# ServiceRoute-Solo - Quick Web Service Status & Route Checker

[![version](https://img.shields.io/badge/version-1.0.2-blue)](projects/app/manifest.json)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/gkgjpkhcpijhdcaledmhggcceigkgoja)](https://chromewebstore.google.com/detail/serviceroute-solo/gkgjpkhcpijhdcaledmhggcceigkgoja)
[![License-MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Privacy-Local Only](https://img.shields.io/badge/Privacy-100%25%20Local-brightgreen)](AGENTS.md)
[![Manifest-V3](https://img.shields.io/badge/Manifest-V3-orange)](projects/app/manifest.json)

> A lightweight, privacy-first Chrome extension to instantly monitor web service status, track connectivity routes, and detect downtime right from your browser.

## Overview

Modern software development and daily workflows rely on dozens of internal and cloud web services. When an endpoint stops responding, identifying whether the root cause is a server outage, proxy failure, dropped SSO session, or local network disruption can be frustrating and time-consuming.

**ServiceRoute-Solo** solves this by delivering an instant, 100% local status monitor and route checker right inside your browser. By utilizing your active browser session context without relying on third-party servers, it helps developers and IT teams troubleshoot connectivity issues in seconds.

## Key Features

- **Instant Route & Status Diagnosis (`service-checker`, `route-checker`):** Analyzes HTTP status codes and redirect targets to isolate connection failures within 10 seconds.
- **Real-Time Uptime Monitoring (`status-monitor`, `uptime-checker`):** Checks essential endpoints continuously and presents service health with intuitive Material Design 3 indicators.
- **SSO & Session Aware (`network-status`):** Shares browser session credentials to verify authenticated internal portals and services without extra logins.
- **Adaptive Polling & Smart Sleep:** Automatically adjusts check intervals (15–30 mins) and enters sleep mode outside business hours to prevent wasteful network traffic.
- **100% Local Privacy First (`chrome-extension`):** Leverages dynamic host permissions (`optional_host_permissions`) to check targets directly without external API dependencies.

## 🔒 Privacy & Security

- **100% Local Execution:** Performs all checks directly from your browser. No external API calls, background tracking, or analytics telemetry.
- **Zero External Dependencies:** Built entirely with Pure Vanilla JS and native browser APIs—zero third-party libraries or external code packages.
- **Zero Data Collection:** Your monitored URLs, check history, and credentials never leave your browser sandbox (`chrome.storage.local`).

## Installation

### 🚀 From Chrome Web Store (Recommended)

<a href="https://chromewebstore.google.com/detail/serviceroute-solo/gkgjpkhcpijhdcaledmhggcceigkgoja">
  <img src="projects/web/assets/chrome-web-store-badge.png" alt="Available in the Chrome Web Store" />
</a>

### 🛠️ From Source Code

1. Clone or download this repository.
2. Open Chrome extensions management page (`chrome://extensions`).
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the `projects/app` directory.

## Usage

1. Open the Extension Options page to add the name and URL of your essential services.
2. Grant host permissions when prompted upon adding a new domain.
3. Click the extension icon in your toolbar to view real-time status and route updates for all configured endpoints.

---

## 🇯🇵 日本語

### タイトル
`ServiceRoute-Solo - 常用Webサービス稼働＆ネットワーク経路チェッカー`

### 概要
業務や開発でよく使うWebサービスやエンドポイントが障害で停止していないか、到達経路が途絶えていないかをワンクリックで素早く確認。通信のダウンタイムや接続障害にいち早く気づける完全ローカル完結型のステータス・経路監視ツールです。

外部の監視サーバーを介さず、ユーザーのブラウザコンテキスト（Cookie/セッション）を利用してローカルで動作します。「サーバーダウン」か「プロキシの不調」か「認証切れ」かを即座に切り分け、ユーザーの自己解決を促進します。

### 主な特徴

- **障害原因の即時切り分け:** HTTPステータスコードやリダイレクトを解析し、問題の起点を10秒以内に特定します。
- **SSO対応:** ブラウザのセッションを共有するため、一度ログインすれば追加の認証なしでチェックが可能です。
- **アダプティブ・ポーリング:** 状態に応じて確認間隔を動的に制御（15分〜30分）。サーバーやネットワークへの不要な負荷を徹底的に排除します。
- **監視時間設定:** ユーザーの業務時間外（夜間・休日）は自動的にスリープし、無駄なトラフィックを発生させません。
- **完全ローカル実行:** `optional_host_permissions` を活用。機密性の高い社内ネットワークのURLも安全に監視できるプライバシー最優先設計。
- **Material 3 デザイン:** Google Material 3 (M3) に準拠した、直感的でモダンなUI。

### インストール方法

#### 🚀 Chrome ウェブストアからインストール（推奨）

<a href="https://chromewebstore.google.com/detail/serviceroute-solo/gkgjpkhcpijhdcaledmhggcceigkgoja">
  <img src="projects/web/assets/chrome-web-store-badge.png" alt="Chrome ウェブストアで入手" />
</a>

#### 🛠️ ソースコードからインストール

1. このリポジトリをクローンまたはZIPダウンロードします。
2. ブラウザで拡張機能管理ページを開きます（Chrome: `chrome://extensions`）。
3. 「デベロッパー モード」をオンにします。
4. 「パッケージ化されていない拡張機能を読み込む」ボタンをクリックし、`projects/app` フォルダを選択します。

### 使い方

1. 拡張機能のオプション画面から、監視したいサービスの「名前」と「URL」を入力して追加します。
2. 初回追加時に、そのドメインへのアクセス権限を許可してください。
3. ポップアップ画面で各サービスの稼働状況がリアルタイムに表示されます。

### プライバシーとセキュリティ

- **完全ローカル実行 (Local Only):** 本拡張機能は、設定されたターゲットURL以外への通信を一切行いません。
- **トラッキングなし:** アクセス解析や広告、外部サービスへのデータ送信は一切行いません。
- **透明性:** 外部ライブラリを一切使用しない Vanilla JS 構成。依存関係によるブラックボックスを排除しています。

### 免責事項

本ソフトウェアは個人開発によるオープンソースプロジェクトであり、無保証 (AS IS) です。利用により生じたいかなる損害（データの消失、業務の中断等）についても、開発者は一切の責任を負いません。自己責任でご利用ください。

---

© 2026 Masanori SATAKE
