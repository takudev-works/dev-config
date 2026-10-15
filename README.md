# dev-config

Takudev の lint 設定の正本。各 repo はこの repo を git の依存として入れ、各ツールに設定ファイルのパスを渡す。

| ファイル | ツール | 中身 |
| --- | --- | --- |
| `base.markdownlint-cli2.jsonc` | markdownlint-cli2 | ルールと、どの repo でも検査しないもの（`node_modules`、`.venv`、`dist`、キャッシュ類など） |
| `base.cspell.json` | cspell | 言語、日本語の文字を無視する正規表現、どの repo でも検査しないもの、どの repo でも出る単語 |
| `base.commitlintrc.json` | commitlint | Conventional Commits |
| `base.secretlintrc.json` | secretlint | preset-recommend。ローカルの開発用 DB の接続文字列だけ許す |
| `base.secretlintignore` | secretlint | どの repo でも検査しないもの |
| `base.tsconfig.json` | TypeScript | strict 系の型検査の設定。`noEmit` |
| `base.eslint.config.mjs` | ESLint | `@eslint/js` と typescript-eslint の recommended、Prettier と重なるルールの無効化、どの repo でも検査しないもの |
| `base.vitest.config.mjs` | Vitest | coverage の設定。`src` の TS を対象に、4 つの指標すべてで 95% を閾値にする |
| `base.renovate.json` | Renovate | 各 repo の `renovate.json` から読む preset |
| `base.prettierrc.json` | Prettier | 書式。Markdown は整形しない |
| `base.npmpackagejsonlintrc.json` | npm-package-json-lint | package.json の型と書式、`private: true`、依存の重複と並び順 |

ファイル名を `.` で始めないのは、git の依存として取り込むときに `.` で始まるファイルが落とされるため（v1.0.0 で起きた）。

## 使い方

この repo を devDependencies に入れる。

```json
{
  "devDependencies": {
    "dev-config": "github:takudev-works/dev-config#v3.0.0"
  },
  "prettier": "dev-config/base.prettierrc.json"
}
```

ツール本体（markdownlint-cli2、cspell、commitlint、secretlint、npm-package-json-lint、Prettier、ESLint と typescript-eslint、TypeScript、Vitest と coverage-v8、npm-run-all2）は、この repo の `dependencies` に入れてある。bun が `node_modules` の直下に置き、コマンドも `node_modules/.bin` に入るので、各 repo には書かない。ツールのバージョンはこの repo で上げ、各 repo はタグを上げるだけにする。

lefthook には、各ツールに正本のパスを渡すコマンドを書く。

```yaml
glob_matcher: doublestar

commit-msg:
  commands:
    commitlint:
      run: bun commitlint --config node_modules/dev-config/base.commitlintrc.json --edit {1}

pre-commit:
  parallel: true
  commands:
    markdownlint:
      glob: '**/*.md'
      run: bun markdownlint-cli2 --config node_modules/dev-config/base.markdownlint-cli2.jsonc {staged_files}
    eslint:
      glob: '**/*.{js,mjs,cjs,ts,tsx}'
      run: bun eslint {staged_files}
    prettier:
      run: bun prettier --check --ignore-unknown {staged_files}
    cspell:
      run: bun cspell --no-progress --no-summary --no-must-find-files {staged_files}
    secretlint:
      run: bun secretlint --secretlintrc node_modules/dev-config/base.secretlintrc.json --secretlintignore node_modules/dev-config/base.secretlintignore {staged_files}
    package-json:
      glob: '**/package.json'
      run: bun run validate:package-json
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
  "markdownlint.configFile": "${workspaceFolder}/node_modules/dev-config/base.markdownlint-cli2.jsonc"
}
```

### cspell

cspell だけは repo に `cspell.json` を置き、正本を `import` する。エディタの拡張が repo の設定ファイルを探すためと、repo ごとの単語を持たせるため。

```json
{
  "version": "0.2",
  "import": ["./node_modules/dev-config/base.cspell.json"],
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

### TypeScript

repo の `tsconfig.json` から正本を `extends` し、`include` や `lib`、`types` など repo ごとのものだけを書く。

```json
{
  "extends": "dev-config/base.tsconfig.json",
  "compilerOptions": { "types": ["bun"] },
  "include": ["scripts/**/*.ts"]
}
```

### ESLint

repo の `eslint.config.mjs` で正本を読み、repo だけの除外や設定を後ろに足す。

```js
import base from 'dev-config/base.eslint.config.mjs';

export default [...base, { ignores: ['python/**'] }];
```

TypeScript と typescript-eslint の版は、この repo でそろえて上げる。Expo のように、フレームワークが TypeScript や ESLint の設定を決めている package は、そちらに従う。

### Vitest

TS のある repo にはテストを書き、coverage の閾値（4 つの指標すべてで 95%）を守る。repo の `vitest.config.ts` で正本を読み、repo だけの除外や設定を足す。

```ts
import { defineConfig } from 'vitest/config';
import { coverage } from 'dev-config/base.vitest.config.mjs';

export default defineConfig({
  test: {
    coverage: { ...coverage, exclude: [...(coverage.exclude ?? []), 'src/routeTree.gen.ts'] }
  }
});
```

足すものがなければ、`export { default } from 'dev-config/base.vitest.config.mjs';` だけでよい。`base.vitest.config.d.mts` は、TS から読むときの型の定義。

### Prettier

package.json の `"prettier"` に `dev-config/base.prettierrc.json` を書いて正本を読ませる。CLI もエディタの拡張も、ここから設定を見つける。repo に `.prettierrc` は置かない。

Markdown は整形しない。Prettier は表の列を必ず揃えるが、日本語と数値が混ざる表は詰めた書き方のほうが読みやすい（markdownlint の MD060 を無効にしているのと同じ理由）。正本の `overrides` で `*.md` に `requirePragma` を付け、`@format` の印がある md だけを整形の対象にしている。md の検査は markdownlint に任せる。

除外は repo の `.gitignore` と `.prettierignore` に従う。lock ファイルなど Prettier が形式を知らないファイルは、`--ignore-unknown` で読み飛ばす。

### Renovate

repo の `renovate.json` で preset を読み、repo だけの事情（base のブランチ、ランタイムの制約、特定のパッケージの上限など）だけを書く。

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>takudev-works/dev-config:base.renovate"]
}
```

`github>takudev-works/dev-config:base.renovate` は、この repo の main の `base.renovate.json` を指す（Renovate は preset の名前に `.json` を付けたファイルを読む）。タグではなく main を読むので、main に入った変更がそのまま各 repo に効く。

| 設定 | 中身 |
| --- | --- |
| 実行の時間 | 平日の 9 時より前（日本時間）。lock ファイルの更新は月曜の 9 時より前 |
| PR | ラベル `dependencies`、レビュアーと担当は `t-i-0414`、コミットメッセージの頭に `chore:`、同時に開く PR は 5 本まで |
| 上げ方 | 公開から 7 日たった版だけを上げる。範囲指定（`^` など）の下限も上げる |
| まとめ方 | npm・Python・GitHub Actions・mise・Terraform のそれぞれで、major 以外を 1 本の PR にまとめる |
| major | Dependency Dashboard で承認してから PR を出す |
| TypeScript | 7 未満に止める。typescript-eslint が TS 7 にまだ対応していないため |
| `dev-config` | 自分たちで出すので、7 日待たず、major も承認を待たない |

設定の検査（`renovate-config-validator`）は依存が大きいので、`bun run validate` には入れず、`base.renovate.json` か `renovate.json` が変わった PR でだけ `.github/workflows/renovate-config.yml` で回す。動くかどうかがファイルの変更で決まるので、必須の check にはしない。各 repo では回さない。設定に誤りがあれば、Renovate がその repo の Dependency Dashboard か issue で知らせ、更新を止める。

### npm-package-json-lint

どの repo にも当てはまるものだけを検査する: 各プロパティの型、`name` と `version` の書式、`private: true`（間違えて npm に公開しないため）、プロパティと依存の重複、依存のアルファベット順。依存の書き方（`^` か固定か、git の依存か）は repo ごとに事情が違うので検査しない。

`"**/package.json"` で渡すと、`node_modules` の中は自動で除外される。ファイルのパスを直接渡すとディレクトリとして扱われて失敗するので、lefthook でも package.json が変わったときに `validate:package-json`（repo のすべての package.json）を動かす。

### commitlint

Conventional Commits の形（`feat: …` など）を検査する。`subject-case`（subject の大文字・小文字の書き方）は検査しない。subject は日本語で書くので、この規則は `README を直す` や `TypeScript を上げる` のように固有名詞で始まる subject を落とすだけになるため。

## GitHub Actions の部品

再利用できるワークフロー（`workflow_call`）を置いている。各 repo は、いつ動かすかと呼び出し先だけを書く。runner や action の版、条件はここで一元管理する。

| ワークフロー | 中身 |
| --- | --- |
| `.github/workflows/reusable-validate.yml` | mise で repo の `mise.toml` の版の bun などを入れ、`bun install --frozen-lockfile` と `bun run validate` を回す |
| `.github/workflows/reusable-dev-config-review.yml` | 週 1 回など定期的に、repo の設定のうち dev-config の正本に重なっているものを Claude Code が探し、消す PR を出す |
| `.github/workflows/reusable-claude.yml` | issue や PR のコメントの `@claude` で Claude Code を動かす。書き手が repo の OWNER・MEMBER・COLLABORATOR のときだけ動く |

```yaml
# .github/workflows/org-requirements.yml
name: Org Requirements

on:
  pull_request:
  push:
    branches: [main]

jobs:
  dev-config:
    uses: takudev-works/dev-config/.github/workflows/reusable-validate.yml@v4.0.0
```

```yaml
# .github/workflows/claude.yml
name: Claude

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  pull_request_review:
    types: [submitted]
  issues:
    types: [opened]

jobs:
  claude:
    uses: takudev-works/dev-config/.github/workflows/reusable-claude.yml@v4.0.0
    secrets: inherit
    permissions:
      contents: write
      pull-requests: write
      issues: write
```

```yaml
# .github/workflows/dev-config-review.yml
name: dev-config review

on:
  schedule:
    # 毎週月曜 9:30（日本時間）
    - cron: '30 0 * * 1'
  workflow_dispatch:

jobs:
  review:
    uses: takudev-works/dev-config/.github/workflows/reusable-dev-config-review.yml@v4.0.0
    secrets: inherit
    permissions:
      contents: write
      pull-requests: write
      id-token: write
```

- `secrets: inherit` で、組織の secret `ORG_CLAUDE_CODE_OAUTH_TOKEN` を渡す
- 呼び出す側の job に書いた権限が上限になるので、`permissions` は呼び出す側に書く
- 呼び出したワークフローの check の名前は `<呼び出す側の job> / <呼ばれる側の job>`（`dev-config / validate`）になる。組織の ruleset `dev-config` が、既定のブランチへの merge にこの check の合格を求める。画面には、ワークフロー名を頭に付けた `Org Requirements / dev-config / validate` と出る

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
