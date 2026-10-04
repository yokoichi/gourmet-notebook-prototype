# グルメ手帳 — 静的プロトタイプ

スマホ・PCで操作感を確かめる、GitHub Pages向けの試作です。最初の店舗と配布ファイルはすべて架空の合成サンプルです。

- 店舗一覧、店名/住所/メモ/タグの検索、ジャンル絞り込み、手動追加/編集。
- UTF-8 CSV/JSONのブラウザ内解析とプレビュー。2 MiB・1,000候補まで。重複候補と不正な行はスキップ。画面内の上限は2,000店舗。
- 引用符・カンマ・改行のあるCSV、Saved相当の列名、店舗配列/版付き独自JSONに対応。全Takeout形式、Maps JSON/GeoJSON、ZIPは未対応。
- 全項目JSONのローカル書き出し、合成分類例、チケット計算の見積例。

入力と取り込みはメモリ内だけで扱い、再読み込みで消えます。認証・端末同期・サーバ保存・実AI・購入・チケット消費は未実装です。選択ファイル・解析結果は送信しません。ページ資源の取得通信とGitHub側のアクセス記録は別です。外部フォント/CDN/分析タグ、ブラウザ永続ストア、Service Workerを使いません。

CSVはname/title/店名の列が必須です。address、phone、genre、tags、memo/note、mapsURL/item_content_urlは任意です。JSONは店舗の配列、または`{"schemaVersion":1,"restaurants":[...]}`を受け付けます。電話は文字列で指定してください。サンプルはexamples/にあります。

開発資料、分析プロンプト、実データ、秘密はこの公開repoに含めません。分析プロンプトはローカルで検討し、承認後にサービスへ反映します。

## ローカル確認

依存パッケージは不要です。Node.js 20以降で`npm test`。表示はこのフォルダで`python3 -m http.server 8765 --bind 127.0.0.1`を実行し、`http://127.0.0.1:8765/`を開きます。

GitHub Pagesはmainのルートを静的配信します。公開予定のURLは`https://yokoichi.github.io/gourmet-notebook-prototype/`です。購入や実アカウントの機能がある本番版ではありません。
