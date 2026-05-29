const i18n = {
  ja: {
    title: "ServiceRoute-Solo - サービス稼働状況チェッカー",
    subtitle: "ユーザー視点のサービス稼働状況＆接続経路チェッカー",
    about_title: "プロジェクト概要",
    about_p1:
      "ServiceRoute-Soloは、ブラウザから社内外の各種Webサービスへの可用性と接続経路を、ユーザー視点で監視・特定するためのChrome拡張機能です。",
    about_p2:
      "「サービスにアクセスできない」とき、それがサーバー側の障害なのか、プロキシの設定ミスなのか、あるいは単なるセッション切れ（認証エラー）なのかを、ユーザーの手元で即座に切り分けます。",
    features_title: "主な特徴",
    feature1_title: "障害原因の即時特定",
    feature1_p:
      "HTTPステータスやリダイレクトを解析し、問題の起点を10秒以内に特定します。",
    feature2_title: "完全ローカル・プライバシー",
    feature2_p:
      "データはすべてブラウザ内に保存。外部サーバーへの送信は一切行いません。",
    feature3_title: "アダプティブ・ポーリング",
    feature3_p:
      "稼働状況に応じてチェック間隔を最適化。ネットワーク負荷を最小限に抑えます。",
    feature4_title: "業務時間外スリープ",
    feature4_p:
      "夜間や休日は自動でチェックを停止。無駄なトラフィックを発生させません。",
    cta_title: "今すぐ始めましょう",
    cta_p: "Chrome ウェブストアから無料でインストールできます。",
    cta_btn: "Chrome ウェブストアへ",
    cta_note: "※現在はデベロッパーモードでのインストールのみ対応しています。",
    links_title: "リンク",
    link_usage: "使いかたガイド",
    link_privacy: "プライバシーポリシー",
    link_repo: "GitHub リポジトリ",
    nav_home: "ホーム",
    nav_usage: "使いかた",
    nav_privacy: "プライバシー",
    privacy_title: "プライバシーポリシー",
    privacy_intro:
      "ServiceRoute-Solo（以下「本拡張機能」）は、ユーザーのプライバシーを最優先に設計されています。",
    privacy_h1: "1. データの収集と利用",
    privacy_p1:
      "本拡張機能は、ユーザーが設定した監視対象URLの稼働状況を確認するために、対象URLへのリクエスト（fetch）を行いますが、その結果やユーザーの設定内容を外部のサーバーに送信することはありません。すべてのデータはユーザーのブラウザ内（chrome.storage.local）でのみ保存・利用されます。",
    privacy_h2: "2. 外部通信について",
    privacy_p2:
      "本拡張機能は、ユーザーが明示的に設定した監視対象URL以外との通信を行いません。アクセス解析（Google Analytics等）や広告ネットワーク、クラッシュレポート送信などの外部通信も一切含まれていません。",
    privacy_h3: "3. 権限の利用について",
    privacy_p3:
      "本拡張機能は、特定のドメインへのアクセス権限を動的に要求します。これらの権限は、ユーザーが指定したサービスの死活監視を行うためにのみ使用されます。",
    privacy_h4: "4. 免責事項",
    privacy_p4:
      "本拡張機能の利用により生じたいかなる損害についても、開発者は一切の責任を負いません。自己責任でご利用ください。",
    back_home: "ホームに戻る",
    usage_title: "ServiceRoute-Solo の使いかた",
    usage_step1_t: "1. サービスの追加",
    usage_step1_p:
      "拡張機能のオプション画面を開き、「サービス名」と監視したい「URL」を入力して追加ボタンを押します。",
    usage_step2_t: "2. 権限の許可",
    usage_step2_p:
      "URLを追加すると、ブラウザからそのドメインへのアクセス権限を求めるポップアップが表示されます。「許可」を選択してください。",
    usage_step3_t: "3. 稼働状況の確認",
    usage_step3_p:
      "ブラウザ右上の拡張機能アイコン（ポップアップ）をクリックすると、現在の稼働状況が一覧で表示されます。異常が検知された場合は、色付きのアイコンで通知されます。",
    usage_step4_t: "4. 監視時間の設定",
    usage_step4_p:
      "オプション画面の「監視時間設定」から、自動チェックを行う時間帯や曜日を指定できます。業務時間外はチェックを停止してバッテリーや通信量を節約します。",
  },
  en: {
    title: "ServiceRoute-Solo - Service Availability Checker",
    subtitle:
      "User-centric service availability and connectivity route checker",
    about_title: "Project Overview",
    about_p1:
      "ServiceRoute-Solo is a Chrome extension for monitoring and identifying the availability and connectivity routes to various internal and external web services from the user's perspective.",
    about_p2:
      "When you 'cannot access a service', it immediately determines whether it is a server-side failure, a proxy misconfiguration, or a simple session timeout (authentication error) right at the user's fingertips.",
    features_title: "Key Features",
    feature1_title: "Instant Root Cause Analysis",
    feature1_p:
      "Analyzes HTTP status and redirects to identify the source of the problem within 10 seconds.",
    feature2_title: "Fully Local & Private",
    feature2_p:
      "All data is stored within the browser. No data is ever sent to external servers.",
    feature3_title: "Adaptive Polling",
    feature3_p:
      "Optimizes check intervals based on availability, minimizing network load.",
    feature4_title: "Off-hours Sleep",
    feature4_p:
      "Automatically stops checks during nights and weekends to avoid unnecessary traffic.",
    cta_title: "Get Started Now",
    cta_p: "Available for free on the Chrome Web Store.",
    cta_btn: "Go to Chrome Web Store",
    cta_note: "*Currently only supports installation via Developer Mode.",
    links_title: "Links",
    link_usage: "Usage Guide",
    link_privacy: "Privacy Policy",
    link_repo: "GitHub Repository",
    nav_home: "Home",
    nav_usage: "Usage",
    nav_privacy: "Privacy",
    privacy_title: "Privacy Policy",
    privacy_intro:
      'ServiceRoute-Solo (hereinafter referred to as "this extension") is designed with user privacy as the top priority.',
    privacy_h1: "1. Data Collection and Use",
    privacy_p1:
      "This extension performs requests (fetch) to monitored URLs to check their status. However, it does not send the results or user settings to any external servers. All data is stored and used only within the user's browser (chrome.storage.local).",
    privacy_h2: "2. External Communication",
    privacy_p2:
      "This extension does not communicate with anything other than the monitored URLs explicitly set by the user. It does not include any external communication such as analytics (e.g., Google Analytics), ad networks, or crash report transmissions.",
    privacy_h3: "3. Use of Permissions",
    privacy_p3:
      "This extension dynamically requests access permissions for specific domains. These permissions are used solely for monitoring the availability of the services specified by the user.",
    privacy_h4: "4. Disclaimer",
    privacy_p4:
      "The developer shall not be liable for any damages arising from the use of this extension. Use at your own risk.",
    back_home: "Back to Home",
    usage_title: "How to Use ServiceRoute-Solo",
    usage_step1_t: "1. Adding a Service",
    usage_step1_p:
      'Open the extension\'s options page, enter the "Service Name" and the "URL" you want to monitor, and click the add button.',
    usage_step2_t: "2. Granting Permissions",
    usage_step2_p:
      'After adding a URL, a browser popup will appear requesting access to that domain. Please select "Allow".',
    usage_step3_t: "3. Checking Status",
    usage_step3_p:
      "Click the extension icon (popup) in the top right of your browser to see a list of current statuses. If an abnormality is detected, it will be indicated with a colored icon.",
    usage_step4_t: "4. Monitoring Time Settings",
    usage_step4_p:
      'From the "Monitoring Time Settings" in the options page, you can specify the time periods and days for automatic checks. Checks will stop during off-hours to save battery and data usage.',
  },
};

function updateContent() {
  const lang = navigator.language.startsWith("ja") ? "ja" : "en";
  const texts = i18n[lang];

  document.title = texts.title;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (texts[key]) {
      el.textContent = texts[key];
    }
  });
}

document.addEventListener("DOMContentLoaded", updateContent);
