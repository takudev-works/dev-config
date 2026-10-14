# lint-config

Takudev の lint 設定の正本。各 repo はこの repo を git の依存として入れ、各ツールに設定ファイルのパスを渡す。

| ファイル | ツール | 中身 |
| --- | --- | --- |
| `base.markdownlint-cli2.jsonc` | markdownlint-cli2 | ルールと、どの repo でも検査しないもの（`node_modules`、`.venv`、`dist`、キャッシュ類など） |
| `base.cspell.json` | cspell | 言語、日本語の文字を無視する正規表現、どの repo でも検査しないもの、どの repo でも出る単語 |
| `base.commitlintrc.json` | commitlint | Conventional Commits |
| `base.secretlintrc.json` | secretlint | preset-recommend。ローカルの開発用 DB の接続文字列だけ許す |
| `base.secretlintignore` | secretlint | どの repo でも検査しないもの |
| `base.npmpackagejsonlintrc.json` | npm-package-json-lint | package.json の型と書式、`private: true`、依存の重複と並び順 |

ファイル名を `.` で始めないのは、git の依存として取り込むときに `.` で始まるファイルが落とされるため（v1.0.0 で起きた）。

## 使い方

この repo を devDependencies に入れる。

```json
{
  "devDependencies": {
    "lint-config": "github:takudev-works/lint-config#v3.0.0"
  }
}
```

ツール本体（markdownlint-cli2、cspell、commitlint、secretlint、npm-package-json-lint、npm-run-all2）は、この repo の `dependencies` に入れてある。bun が `node_modules` の直下に置き、コマンドも `node_modules/.bin` に入るので、各 repo には書かない。ツールのバージョンはこの repo で上げ、各 repo はタグを上げるだけにする。

lefthook には、各ツールに正本のパスを渡すコマンドを書く。

```yaml
glob_matcher: doublestar

commit-msg:
  commands:
    commitlint:
      run: bun commitlint --config node_modules/lint-config/base.commitlintrc.json --edit {1}

pre-commit:
  parallel: true
  commands:
    markdownlint:
      glob: '**/*.md'
      run: bun markdownlint-cli2 --config node_modules/lint-config/base.markdownlint-cli2.jsonc {staged_files}
    cspell:
      run: bun cspell --no-progress --no-summary --no-must-find-files {staged_files}
    secretlint:
      run: bun secretlint --secretlintrc node_modules/lint-config/base.secretlintrc.json --secretlintignore node_modules/lint-config/base.secretlintignore {staged_files}
    package-json:
      glob: '**/package.json'
      run: bun run check:package-json
```

`glob_matcher: doublestar` は、`**/*.md` をルート直下の md にも一致させるため。lefthook の既定では `**` が 1 階層以上の意味になり、ルート直下のファイルが検査されない。

lefthook の設定そのものを共有しない（`extends` や `remotes` を使わない）のは、それらが repo の `lefthook.yml` より後に読まれて上書きするため。repo ごとの除外を `lefthook.yml` に書けなくなる。

### markdownlint

その repo だけで除外したいものは、コマンドの引数で渡す（`#` で始まる glob が除外）。

- `"**/*.md"` は `.github` のような `.` で始まるディレクトリの md も拾うので、それらを別に渡す必要はない
- 対象を正本の `globs` に書かないのは、そうすると引数の除外（`#…`）が効かなくなるため
- lefthook のように検査するファイルを直接渡すときも、その repo だけの除外を引数で渡す。直接渡したファイルにも `#…` の除外は効く

Cursor・VS Code の拡張（vscode-markdownlint）には、repo の `.vscode/settings.json` で同じファイルを渡す。

```json
{
  "markdownlint.configFile": "${workspaceFolder}/node_modules/lint-config/base.markdownlint-cli2.jsonc"
}
```

### cspell

cspell だけは repo に `cspell.json` を置き、正本を `import` する。エディタの拡張が repo の設定ファイルを探すためと、repo ごとの単語を持たせるため。

```json
{
  "version": "0.2",
  "import": ["./node_modules/lint-config/base.cspell.json"],
  "ignorePaths": ["python/reference/**"],
  "words": ["<その repo だけの単語>"]
}
```

正本の `ignorePaths` は `globRoot` を `${cwd}` にしているので、取り込んだ repo のルートから見たパスとして効く。

検査の対象はすべてのファイル（`cspell "**"`）にする。cspell は TypeScript・Python・Ruby・シェルなど、ファイルの種類ごとの辞書を拡張子に応じて自動で使うので、コードを検査しても誤検知は少ない。バイナリ、`.gitignore` で除外したファイル、正本の `ignorePaths` に当たるファイルは読み飛ばす。

lefthook では `--no-must-find-files` を付ける。コミットしたファイルがすべて読み飛ばされる（画像だけをコミットしたときなど）と、付けないと「対象が無い」として失敗する。

日本語は、ひらがな・カタカナ・漢字を `ignoreRegExpList` で検査から外している。cspell には日本語の辞書がない。

### secretlint

`--secretlintignore` は 1 つしか渡せない。正本にない除外が要る repo は、正本の中身に足したファイルを repo に置いてそちらを渡す。

### npm-package-json-lint

どの repo にも当てはまるものだけを検査する: 各プロパティの型、`name` と `version` の書式、`private: true`（間違えて npm に公開しないため）、プロパティと依存の重複、依存のアルファベット順。依存の書き方（`^` か固定か、git の依存か）は repo ごとに事情が違うので検査しない。

`"**/package.json"` で渡すと、`node_modules` の中は自動で除外される。ファイルのパスを直接渡すとディレクトリとして扱われて失敗するので、lefthook でも package.json が変わったときに `check:package-json`（repo のすべての package.json）を動かす。

### commitlint

`subject-case` は大文字だけと PascalCase の subject を禁じる。日本語の subject は通るが、`README を直す` のように大文字だけの英単語で始まると大文字だけと判定されて落ちる。

## ルールの選び方（markdownlint）

`default: true` ですべてのルールを有効にし、日本語の文書で誤検知が多いもの、書き方の好みでしかないものを無効にしている。

| ルール | 設定 | 理由 |
| --- | --- | --- |
| MD003 | `atx` | 見出しを `#` の形式にそろえる |
| MD013 | 無効 | 日本語と表が混ざると、行の長さの制限に必ず引っかかる |
| MD024 | 同じ階層だけ検査 | 別の節の下で同じ見出しを使うことはよくある |
| MD034 | 無効 | URL をそのまま書くことを許す |
| MD060 | 無効 | 日本語と数値が混ざる表では、詰めた書き方のほうが読みやすい |
| MD028、MD031、MD033、MD036、MD040、MD041、MD056 | 無効 | 書き方の好みの範囲で、検査する利点が小さい |

## 変更の流れ

変更は PR で出し、merge したらタグ（`v3.1.0` など）を打つ。各 repo は Renovate などでタグを更新する。

この repo 自身も同じ設定で検査する。`mise run setup` で依存と lefthook を入れる。
