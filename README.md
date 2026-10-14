# markdownlint-config

Takudev の Markdown の lint 設定の正本。各 repo は設定ファイルを持たず、この repo を git の依存として入れて、markdownlint-cli2 の `--config` と Cursor・VS Code の拡張に渡す。

`base.markdownlint-cli2.jsonc` は markdownlint-cli2 の形式で、ルール（`config`）と、どの repo でも検査しないもの（`ignores`。`node_modules`、`.venv`、`dist`、キャッシュ類など）を持つ。

## 使い方

```json
{
  "devDependencies": {
    "markdownlint-config": "github:takudev-works/markdownlint-config#v2.0.0"
  },
  "scripts": {
    "check:markdown": "markdownlint-cli2 --config node_modules/markdownlint-config/base.markdownlint-cli2.jsonc \"**/*.md\" \".github/**/*.md\""
  }
}
```

対象のファイルと、その repo だけで除外したいものは、各 repo のコマンドの引数で渡す（`#` で始まる glob が除外）。

Cursor・VS Code の拡張（vscode-markdownlint）には、repo の `.vscode/settings.json` で同じファイルを渡す。

```json
{
  "markdownlint.configFile": "${workspaceFolder}/node_modules/markdownlint-config/base.markdownlint-cli2.jsonc"
}
```

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

ファイル名を `.` で始めないのは、git の依存として取り込むときに `.` で始まるファイルが落とされるため（v1.0.0 で起きた）。

## 変更の流れ

変更は PR で出し、merge したらタグ（`v2.1.0` など）を打つ。各 repo は Renovate などでタグを更新する。
