# markdownlint-config

Takudev の Markdown の lint 設定の正本。各 repo は設定ファイルを持たず、この repo を git の依存として入れて、markdownlint-cli2 の `--config` に渡す。

## 使い方

```json
{
  "devDependencies": {
    "markdownlint-config": "github:takudev-works/markdownlint-config#v1.0.1"
  },
  "scripts": {
    "check:markdown": "markdownlint-cli2 --config node_modules/markdownlint-config/markdownlint.json \"**/*.md\" \"#node_modules\""
  }
}
```

対象のファイルと除外は repo ごとに違うので、この設定には入れない。各 repo のコマンドの引数で渡す（`#` で始まる glob が除外）。

## ルールの選び方

`default: true` ですべてのルールを有効にし、日本語の文書で誤検知が多いもの、書き方の好みでしかないものを無効にしている。

| ルール | 設定 | 理由 |
| --- | --- | --- |
| MD003 | `atx` | 見出しを `#` の形式にそろえる |
| MD013 | 無効 | 日本語と表が混ざると、行の長さの制限に必ず引っかかる |
| MD024 | 同じ階層だけ検査 | 別の節の下で同じ見出しを使うことはよくある |
| MD034 | 無効 | URL をそのまま書くことを許す |
| MD060 | 無効 | 日本語と数値が混ざる表では、詰めた書き方のほうが読みやすい |
| MD028、MD031、MD033、MD036、MD040、MD041、MD056 | 無効 | 書き方の好みの範囲で、検査する利点が小さい |

ファイル名を `.` で始めないのは、git の依存として取り込むときに `.` で始まるファイルが落とされるため。

## 変更の流れ

変更は PR で出し、merge したらタグ（`v1.0.1` など）を打つ。各 repo は Renovate などでタグを更新する。
