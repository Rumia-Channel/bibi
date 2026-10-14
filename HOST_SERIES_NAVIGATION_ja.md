# ホスト限定のシリーズ間ナビゲーション

## 位置づけ

Bibi **2.2.0** と Dantalian **0.1.19** の実装・API・受け入れ仕様。Dantalian の `v0.1.19` は本作業開始時点で未作成だったため、機能追加を含めて同番号で公開する。

対象は Dantalian が採用している **standalone の Bibi 専用ページ**。一般用途と iframe 埋め込みには巻間移動・戻るの UI や通信を追加しない。他サイトでも、自サイトと同一 origin の Bibi を明示設定し、以下のナビゲーション API を提供すれば利用できる。

## 1. ユーザー操作

本の中身と、巻間移動用の案内ページを区別する。

| 現在の表示 | 操作 | 結果 |
| --- | --- | --- |
| 表紙・本文先頭 | さらに戻る | 「前の巻へ」の案内ページを表示する。まだ遷移しない。 |
| 前側の案内ページ | 新しい操作でさらに戻る | 前巻の本文末尾を開く。前巻がなければ元のページへ戻る。 |
| 前側の案内ページ | 本文方向へ進む | 現在の本の表紙・本文先頭へ戻る。 |
| 本文末尾 | さらに進む | 「次の巻へ」の案内ページを表示する。まだ遷移しない。 |
| 後側の案内ページ | 新しい操作でさらに進む | 次巻の表紙・本文先頭を開く。次巻がなければ元のページへ戻る。 |
| 後側の案内ページ | 本文方向へ戻る | 現在の本の本文末尾へ戻る。 |

- 「新しい操作」は、別のキー押下・クリック・タッチジェスチャー、または一度止まった後のスクロール。案内ページを出した同じホイール慣性・同じスワイプ・キーの押しっぱなしでは巻を移動しない。
- 最終ページの表示だけで次巻へ飛ばさない。最終ページを読めることを優先する。
- 先頭への復元、末尾への復元、目次ジャンプ、リサイズ、フォント変更、位置 API の操作だけでは案内ページ・巻間移動を起動しない。
- 案内ページには遷移先の巻名と、明示的な操作ボタンも表示する。スクロール以外にキーボード・矢印・タッチで利用できるようにする。
- シリーズ未登録の本、シリーズ先頭の前側、シリーズ末尾の後側は「元のページへ戻る」と表示する。両方向の有無は独立して判断する。
- 目次ボタンの隣に、小さな間隔を空けて **「戻る」ボタン**を表示する。適切な trusted preset と有効な context があるサイトだけに表示し、一般用途・iframe・URL による自己申告では追加しない。
- 「戻る」は明示操作なので案内ページを挟まず、API context を再確認して最初の元のページへ戻る。通信・identity 検証に失敗した場合は現在の本に留まり、エラーを表示する。

### 案内ページは EPUB のページではない

案内ページを EPUB の spine、`R.Pages`、本文 CFI、本文 pageCount、進捗率、Automark に追加しない。案内ページ表示中の `Bibi.API.getPosition()` は直下の実際の先頭・末尾本文位置を返す。戻り先を表示しただけで進捗や `reading_status` を書き換えない。

前巻へ戻った際の初期位置は前巻の本文末尾、次巻へ進んだ際は次巻の本文先頭。ここでは端末の Automark より明示的な境界指定を優先する。通常の一覧からの起動は既存の再開位置優先を維持する。

### メニューバーとページ単位のタップ領域

メニューバーは上・左右の `safe-area-inset` を含めて配置し、本文・目次・subpanel の上端も同じ menu offset を使用する。viewport の高さは `visualViewport` の等倍時の高さと window の高さから求め、リサイズ・回転に追従する。実 iPad Safari のブラウザー UI は端末上の確認が別途必要。

左右外側のページ幅の 1/3 を前後移動に使用する。見開きは画面幅の左右各 1/6、単ページは各 1/3。RTL は前後の割当を反転する。中央とリンク・操作 UI の動作を維持し、巻間移動の有効化とは独立して適用する。独自 preset は既定 preset を継承しないため `flipper-width:1/3` を明示する。本文 iframe のクリック座標はその実表示矩形から算出し、固定レイアウトの元ページ拡大率を二重適用しない。

## 2. 役割分担

| 担当 | 責任 |
| --- | --- |
| Dantalian | 現在の書籍・ファイル版、シリーズ内の順番、隣接巻、閲覧可能性、元のページの確定、安全な起動 URL、既存認証。 |
| Bibi | 実本文の境界、前後の案内ページ、追加操作の検出、連続操作の抑制、API 応答の検証、状態・エラー表示、検証済み URL への遷移。 |
| 設定した別サイト | Dantalian と同じ JSON 契約の endpoint と、自サイト向けの trusted preset を提供する。 |

Bibi に Dantalian の書籍 ID 解析、シリーズ DB、API トークン管理、読書位置サーバー保存を実装しない。Dantalian の境界イベント処理も、Bibi 内部の `R` や本文 iframe を外側から操作する方式にしない。

## 3. 既存の接続点

### Dantalian

- `GET /api/books/{id}`: `id`、`media_type`、`series_id`、`series_number`、`volume`、`epub_file_hash`、`epub_file_name` などの書籍情報。
- `GET /api/series`: シリーズの `id` と `name`。これだけでは隣接巻は取得できない。
- `PUT /api/books/{id}/series`: シリーズ所属・巻順の更新。隣接巻を調べるために呼ぶ API ではない。
- `/reader/?book=<id>&from=<元のページ>`: 書籍情報・登録 EPUB を確認する起動ページ。document-pinned preset を持つ `/vendor/bibi/dantalian.html` へ `location.replace` する。
- `/epubs/{epub_file_hash}`: 既存の EPUB 配信。Native と Worker→Wasabi の配信経路を作り直さない。

新規 lookup は Native/Worker で共通の SQL と判定を使用し、現在の本と直前・直後の巻を単一の DB snapshot から取得する。既存の書籍・シリーズ更新 API を lookup の代用として呼ばない。

トップページの本クリックは詳細表示、本専用一覧のクリックと詳細・編集の「読む」は読書起動、という既存の区別を維持する。

### Bibi

- `Bibi.API.getState/getPosition/restorePosition/subscribe` と、identity 付きの確定位置通知を再利用する。
- trusted preset の設定と、URL 等の user-only 設定を分離する既存分類を利用する。
- 既存の `edge=head|foot` により巻間移動後の先頭・末尾指定を行う。レイアウト依存のページ番号を URL に保存しない。
- `atEnd` や `bibi:got-to-the-end` だけを巻間移動のトリガーにしない。ユーザーの追加操作が必要。

参考: [Dantalian 側の統合仕様](../../Rust/Dantalian/docs/BIBI_INTEGRATION.md)、[起動ページ](../../Rust/Dantalian/static/js/reader.js)、[既存設定分類](./__src/bibi/resources/scripts/bibi.heart.lifecycle.mjs)、[既存の本文移動](./__src/bibi/resources/scripts/bibi.heart.reader.mjs)。

## 4. 新規 Dantalian HTTP API

### `GET /api/reader-navigation`

```http
GET /api/reader-navigation?book_key=book%3A123&content_hash=HASH&return_to=%2Fbooks%2F HTTP/1.1
Accept: application/json
```

| query | 必須 | 意味 |
| --- | --- | --- |
| `book_key` | 必須 | ホストの書籍識別子。Dantalian では `book:<正の i64 ID>`。Bibi はこの形式を解析せず、そのまま送る。 |
| `content_hash` | 必須 | 読み込み済みの `epub_file_hash`。拡張子込み・なしを勝手に変換せず、opaque な文字列として一致確認する。 |
| `return_to` | 任意 | 最初に読書を開始した同一サイト内の元のページ。欠落・不正時は Dantalian の `/books/`。 |

通常の Worker API 認証を適用する。API トークンを query に入れない。Bibi の API fetch は `credentials: same-origin` を使い、Worker は既存の認証 cookie を扱う。Native にこの機能のための別認証方式を追加しない。

### 正常応答

```json
{
  "schemaVersion": 1,
  "bookKey": "book:123",
  "contentHash": "HASH",
  "series": {
    "id": 9,
    "name": "シリーズ名",
    "order": "series-number-asc-id-asc"
  },
  "previous": {
    "bookKey": "book:122",
    "title": "第1巻",
    "contentHash": "HASH1",
    "status": "ready",
    "href": "/reader/?book=122&entry=end&from=%2Fbooks%2F"
  },
  "next": {
    "bookKey": "book:124",
    "title": "第3巻",
    "contentHash": "HASH3",
    "status": "ready",
    "href": "/reader/?book=124&entry=start&from=%2Fbooks%2F"
  },
  "returnTo": {
    "href": "/books/",
    "label": "元のページへ戻る"
  }
}
```

この例の ID・hash・巻名は契約を示す例であり、実測値ではない。応答は `Cache-Control: no-store`。本文のロード完了を待たず進捗を書いたり、読了扱いにしたりしない。

### シリーズ順と隣接巻

1. 現在の書籍と同じ `series_id` の通常の本（`media_type=book` または既存の null）を対象にする。CD・オーディオブックは混ぜない。
2. `series_number` の昇順、未設定は末尾、同じ値・未設定同士は `id` 昇順で固定する。
3. 現在の本の直前・直後の **登録済みの本** を返す。巻番号に欠番があっても架空の本を補わない。
4. UI のタイトル順・発売日順・登録順の選択によって巻間移動の順番を変えない。
5. `series_number` 未設定の ID 順は確定的な代替順であり、実際の出版巻順を推測した結果ではない。正確な巻順が必要なら既存の巻順フィールドを設定する。
6. 大シリーズは複数シリーズ等のグループなので、単独の巻順として扱わない。

Native と Worker で同じ共有 core の判定・DTO を使う。全書籍一覧をブラウザへ取得して隣接巻を推測しない。新しい DB スキーマ・巻順専用テーブル・依存ライブラリは不要。

### 「隣接巻なし」と「隣接巻が読めない」の区別

- 該当方向に本がない場合は `previous` / `next` を `null` にする。シリーズ未登録の場合は `series=null`、両方の隣接巻も `null`。
- 本は存在するが EPUB 未登録なら `status=missing-file`、PDF 等なら `status=unsupported-format`。この場合も隣接巻の object を返すが `href=null`。`contentHash` は未登録の場合に null を許す。
- 読めない巻を勝手に飛ばしてさらに先の巻へ移動しない。「隣接巻なし」に偽装して自動的に元のページへ戻ることもしない。
- 現行のアクセス制御を必ず通す。将来、書籍単位の認可を追加する場合も、非公開の書籍名・ID・URL を応答で漏らさない。

### エラー

```json
{
  "error": "読書中のファイルが変更されています。開き直してください。",
  "code": "CONTENT_CHANGED"
}
```

| HTTP | code | 動作 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | 書籍キー・必須 query 等が不正。遷移しない。 |
| 401 | 既存の認証エラー | 再認証を案内し、現在の本と案内ページを保持する。 |
| 404 | `BOOK_NOT_FOUND` | 現在の本が削除済み・取得不能。遷移しない。 |
| 409 | `CONTENT_CHANGED` | 開いている file identity が DB と不一致。旧位置を別版へ流用しない。 |
| 422 | `BOOK_UNAVAILABLE` | 現在の本自体が未登録・非 EPUB。正常 context を捏造しない。 |
| 5xx / 通信失敗 | 通信・サーバーエラー | 案内ページに留まり、別の明示操作で再試行できるようにする。 |

API の失敗と隣接巻 `null` を混同しない。エラー時に fallback の戻り先へ自動遷移しない。

## 5. 元のページと巻間 URL

最初の起動元をシリーズの最後まで保持する。例:

```text
/books/?search=作品 → 第1巻 → 第2巻 → 第3巻 → /books/?search=作品
```

毎回「直前の Bibi URL」を戻り先にすると巻を往復してしまうため、そうしない。

- Dantalian は元のページの path/query/fragment を検証し、`/`・`/books/`・`/edit/` だけを認める。
- protocol-relative URL、外部 origin、backslash、制御文字、不正なパスを戻り先として採用しない。不正・欠落時は `/books/`。
- 新しい起動 query `entry=start|end` を導入する。通常の起動では `entry` を付けず、再開位置を維持する。
- 起動ページは `entry=start → edge=head`、`entry=end → edge=foot` に変換し、Bibi の URL に渡す。
- 同時に元のページを `host-return-to` として渡す。HTTP API が生成する隣接巻の `from` にも、同じ元のページを保持する。
- Bibi の巻間移動・戻り先への移動は `location.replace`。reader の履歴が巻数分たまることを避ける。
- 読書ページの直開き・bookmark・別タブもあるため、無条件の `history.back()` や `document.referrer` を戻り先にしない。

## 6. Bibi を設定したサイトだけで有効にする

### trusted preset のみで許可

通常の preset は無効のまま。Dantalian の専用 preset にだけ次を加える:

```javascript
Bibi.preset({
    'use-host-navigation': true,
    'host-navigation-api': '/api/reader-navigation',
    'host-navigation-paths': ['/', '/books/', '/edit/', '/reader/']
});
```

上の3設定は **preset-only**。さらに、サイトが HTML の `bibi-script` に `data-bibi-preset="dantalian"` を明示するか、既に `bibi-preset` script を配置していることが必要。属性は `presets/dantalian.js` というパスではなく basename を指定する。URL query/hash の `preset=dantalian` で有効な preset を選んだだけでは許可しない。書籍内メタデータ、Biscuit/localStorage、postMessage からも有効化できない。

- `use-host-navigation=false` が既定。endpoint と許可パスの明示設定も必要。
- endpoint は同一 origin の HTTP(S) だけ。ワイルドカード origin・任意外部 endpoint を許可しない。
- `host-return-to` は user-only の値として受け取るが、機能の有効化・origin・許可パスを変更する権限はない。
- 機能無効時は案内ページ、戻るボタン、ナビゲーション用 API 通信を追加しない。従来の Bibi の先頭・末尾動作をそのまま使う。
- iframe 埋め込みはこの機能の対象外。Jo の既存の読書位置・移動 API を壊さない。
- 同一 origin の信頼済みサイト JavaScript は既に reader を操作できる。この許可設計は URL 等の非信頼入力からの機能有効化を防ぐもので、サイト自身の XSS を sandbox 化するものではない。
- Dantalian の importer は upstream `index.html` のバイト列を変更せず、独立した `dantalian.html` を生成する。document preset の指定と preset digest を含む cache key を加え、host entry 自体も tracked preset と元 HTML から再計算して検証する。

別サイトは同じ JSON 契約を実装する endpoint と、そのサイトで許可する pathnames を設定する。Bibi に Dantalian 固有の URL や `book:<id>` の解析を埋め込まない。

### Bibi が API 応答を検証する

操作可能になった後、現在の公開 API identity を用いて endpoint を取得する。対象は `bookKey`、`contentHash`、`schemaVersion=1` が現在の session と一致する応答だけ。

- endpoint の cookie は `credentials=same-origin` で送信する。認証 token をナビゲーション URL に入れない。
- 遷移 URL はアプリ内の相対 URL、同一 origin、HTTP(S)、userinfo なし、trusted preset の許可 pathname に一致することを確認する。
- `javascript:`、`data:`、protocol-relative・外部 URL、許可されていない pathname を拒否する。
- 巻名・ラベル・エラーはテキストとして描画し、API の文字列を HTML として挿入しない。
- 実際に案内ページから外側へ移動する直前にも API を再取得する。長時間の読書中に巻順・ファイル・登録が変わっても、初回取得結果だけで遷移しない。
- 再取得・遷移は single-flight。同じ操作の連続イベントで二重 fetch・二重遷移を起こさない。エラーや不一致では本文・案内ページに留まる。
- 内向き操作は保留中の fetch を abort し、ロックを即解除する。キャンセル済み request の成功・エラー・finally が新しい状態を上書きしない。

## 7. Bibi の新しい公開 JS API

ホスト固有の書籍 lookup は HTTP 契約に分離し、Bibi の API は状態を公開する。

### `Bibi.API.getHostNavigationState()`

```json
{
  "enabled": true,
  "loading": false,
  "navigating": false,
  "visibleBoundary": "foot",
  "error": null
}
```

`visibleBoundary` は `null` / `head` / `foot`。本文の `position`・CFI とは別の UI 状態である。機能無効の場合は `enabled=false` で、追加通信は行わない。

### `Bibi.API.refreshHostNavigation()`

現在の書籍・ファイル identity の context を再取得する Promise。無効時は `HOST_NAVIGATION_DISABLED` を返す。成功・失敗を区別し、失敗を「隣接巻なし」として扱わない。

### `bibi:host-navigation-changed`

既存の公開イベントと同様に `schemaVersion`、`sessionId`、`bookKey`、`contentHash` と新しい state を通知する。既存の `bibi:position-changed` を案内ページ用に転用しない。古い session の応答は現在の状態へ適用しない。

新規機能の主要実装は責任を分けた host-navigation module に置く。reader/input の境界フックと、表示用 CSS は既存のモジュール・ビルド規約に従って接続する。

## 8. 検証条件

### Dantalian

- Native / Worker の JSON・判定・error code が一致する。
- 単独の本、シリーズ先頭・中間・末尾、欠番、同番号、巻順未設定を検証する。
- EPUB 未登録・PDF の隣接巻を飛ばさない。削除・hash 不一致・認証失敗で誤遷移しない。
- 元のページの query/fragment を巻間移動後も保持し、外部 URL・不正な戻り先は採用しない。
- `/` の詳細表示と `/books/` の読書起動の区別を維持する。

### Bibi

- 既定無効。URL から有効化しようとしても追加 UI・API fetch が発生しない。
- 前後の案内ページを挟み、別の追加操作でだけ遷移する。内側方向の操作は本文へ戻す。
- ホイール慣性・同一スワイプ・キー repeat が複数巻の移動にならない。
- paged / horizontal / vertical、LTR / RTL、リフロー / 固定レイアウトで成立する。
- 境界への復元・目次・リサイズで勝手に巻を移動しない。
- 案内ページを出しても本文 CFI・spine 進捗・pageCount・Automark を汚さない。
- API の identity・origin・pathname 検証、通信失敗、同時操作を検証する。

実際の Dantalian の2巻以上の EPUB を使い、先頭・末尾の案内、追加スクロール、前後の巻の初期位置、元のページへの復帰を実画面で確認する。テストだけで実画面確認の代わりにしない。

## 9. 実施した検証

- Bibi の unit suite 46 件、配布物のブラウザー回帰 26 シナリオ（既存 13、新規 13）に成功。実 EPUB の本文を描画して前後案内・別操作・慣性・key repeat・タッチ・キャンセル・TOC・戻るボタン・ページ単位のクリックを確認した。固定レイアウトの座標二重適用は修正前に実クリックで失敗し、修正後は見開き・縦長のページ送りに成功した。
- iPad 相当の Chromium mobile context で `834×1194` / `1194×834` と上 24px・左右 12px の safe area を適用し、目次と戻るボタンを含むメニューバー全体の矩形とスクリーンショットを確認した。実 iPad Safari 上の検証ではない。
- Native の関連テスト 107 件成功・外部サービス依存 1 件除外、Worker helper 28 件成功。両方の実 HTTP ナビゲーション契約 2 件ずつに成功した。D1/SQLite の実 lookup に対する巻順、未登録/PDF、削除、ファイル版変更、不正 query、許可戻り先、読書状態の非更新を確認した。Worker は認証なしの 401 も確認した。
- `bun audit` はインストール済み 448 packages の既知脆弱性 0。新規の依存追加はない。
