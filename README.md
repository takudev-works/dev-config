# dev-config

takudev-works の各 repo で共通に使う開発の設定と CI のワークフローの正本。各 repo はこの repo を git の依存として入れ、`dev-config` コマンドか設定ファイルのパスで各ツールに正本を渡す。

| ファイル | ツール | 中身 |
| --- | --- | --- |
| `src/markdownlint-cli2.jsonc` | markdownlint-cli2 | ルールと、どの repo でも検査しないもの（`node_modules`、`.venv`、`dist`、キャッシュ類など） |
| `src/cspell.json` | cspell | 言語、日本語の文字を無視する正規表現、どの repo でも検査しないもの、どの repo でも出る単語 |
| `src/commitlintrc.json` | commitlint | Conventional Commits |
| `src/secretlintrc.json` | secretlint | preset-recommend。ローカルの開発用 DB の接続文字列だけ許す |
| `src/secretlintignore` | secretlint | どの repo でも検査しないもの |
| `src/tsconfig.json` | TypeScript | strict 系の型検査の設定。`noEmit` |
| `src/eslint.config.mjs` | ESLint | `@eslint/js` と typescript-eslint の recommended、Prettier と重なるルールの無効化、どの repo でも検査しないもの |
| `src/vitest.config.mjs` | Vitest | coverage の設定。`src` の TS を対象に、4 つの指標すべてで 95% を閾値にする |
| `src/renovate.json` | Renovate | 各 repo の `renovate.json` から読む preset |
| `src/prettierrc.json` | Prettier | 書式。Markdown は整形しない |
| `src/textlintrc.json` | textlint | 日本語の文章の検査。preset-ja-technical-writing と prh |
| `src/textlintignore` | textlint | どの repo でも検査しないもの |
| `src/prh.yml` | textlint（prh） | 用語の表記ゆれを直す辞書 |
| `src/npmpackagejsonlintrc.json` | npm-package-json-lint | package.json の型と書式、`private: true`、依存の重複と並び順 |
| `src/cli.mjs` | `dev-config` コマンド | 上の設定ファイルのパスを足して各ツールを動かす |

正本は `src/` に置く。ルートには、この repo 自身を検査するための設定を置く。

ファイル名を `.` で始めないのは、git の依存として取り込むときに `.` で始まるファイルが落とされるため（v1.0.0 で起きた）。

## 使い方

この repo を devDependencies に入れる。

`<タグ>` には最新のタグを書く。最新のタグと、そのコミットの SHA（ワークフローの呼び出し先に使う）は次で分かる。

```sh
gh api repos/takudev-works/dev-config/tags --jq '.[0] | "\(.name) \(.commit.sha)"'
```

```json
{
  "devDependencies": {
    "dev-config": "github:takudev-works/dev-config#<タグ>"
  },
  "prettier": "dev-config/src/prettierrc.json"
}
```

ツール本体は、この repo の `dependencies` に入れてある（どれが入っているかは package.json を見る）。bun が `node_modules` の直下に置き、コマンドも `node_modules/.bin` に入るので、各 repo には書かない。ツールのバージョンはこの repo で上げ、各 repo はタグを上げるだけにする。

### dev-config コマンド

設定ファイルのパスを渡す必要があるツールは、`dev-config <ツール> [引数...]` で動かす。正本の設定のパスを足してツールを動かし、ツールの終了コードを返す。引数はそのままツールに渡る。

| `dev-config` の後に書く名前 | 動かすツール | 足す引数 |
| --- | --- | --- |
| `commitlint` | commitlint | `--config src/commitlintrc.json` |
| `markdownlint` | markdownlint-cli2 | `--config src/markdownlint-cli2.jsonc` |
| `npm-package-json-lint` | npm-package-json-lint | `--configFile src/npmpackagejsonlintrc.json` |
| `secretlint` | secretlint | `--secretlintrc src/secretlintrc.json --secretlintignore <除外>` |
| `textlint` | textlint | `--config src/textlintrc.json --ignore-path <除外>` |

textlint と secretlint の除外は、repo に `.textlintignore`・`.secretlintignore` があれば、正本の除外の後ろにその行を足したファイルを渡す。無ければ正本の除外をそのまま渡す。両ツールとも除外ファイルを 1 つしか渡せないので、repo には正本に足したい行だけを書く。

`.textlintignore`・`.secretlintignore` は、コマンドを動かすディレクトリ（ふつうは repo のルート）に置く。`dev-config` コマンドはそのディレクトリのものだけを読むので、モノレポのパッケージに置いても、ルートで動かすときには効かない。

パスを直接渡す書き方（`--config node_modules/dev-config/src/...`）も、これまでどおり動く。

package.json の scripts には、次のように書く。

```json
{
  "scripts": {
    "validate": "run-p validate:*",
    "validate:markdown": "dev-config markdownlint \"**/*.md\"",
    "validate:package-json": "dev-config npm-package-json-lint \"**/package.json\"",
    "validate:secrets": "dev-config secretlint \"**/*\"",
    "validate:spell": "cspell --no-progress \"**\"",
    "validate:text": "dev-config textlint \"**/*.md\""
  }
}
```

### lefthook

lefthook には、`dev-config` コマンドで正本を渡すコマンドを書く。

```yaml
glob_matcher: doublestar

commit-msg:
  commands:
    commitlint:
      run: bun dev-config commitlint --edit {1}

pre-commit:
  parallel: true
  commands:
    markdownlint:
      glob: '**/*.md'
      run: bun dev-config markdownlint {staged_files}
    textlint:
      glob: '**/*.md'
      run: bun dev-config textlint {staged_files}
    eslint:
      glob: '**/*.{js,mjs,cjs,ts,tsx}'
      run: bun eslint {staged_files}
    prettier:
      run: bun prettier --check --ignore-unknown {staged_files}
    cspell:
      run: bun cspell --no-progress --no-summary --no-must-find-files {staged_files}
    secretlint:
      run: bun dev-config secretlint {staged_files}
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
  "markdownlint.configFile": "${workspaceFolder}/node_modules/dev-config/src/markdownlint-cli2.jsonc"
}
```

ルールは `default: true` ですべて有効にし、日本語の文書で誤検知が多いもの、書き方の好みでしかないものを無効にしている。

| ルール | 設定 | 理由 |
| --- | --- | --- |
| MD003 | `atx` | 見出しを `#` の形式にそろえる |
| MD013 | 無効 | 日本語と表が混ざると、行の長さの制限に必ず引っかかる |
| MD024 | 同じ階層だけ検査 | 別の節の下で同じ見出しを使うことはよくある |
| MD034 | 無効 | URL をそのまま書くことを許す |
| MD060 | 無効 | 日本語と数値が混ざる表では、詰めた書き方のほうが読みやすい |
| MD028、MD031、MD033、MD036、MD040、MD041、MD056 | 無効 | 書き方の好みの範囲で、検査する利点が小さい |

### textlint

日本語の文章を検査する。cspell は日本語を検査から外しているので、日本語はこちらで見る。

textlint は `.gitignore` を見ないので、`.venv` や `.ruby-lsp` のように手元にだけある依存の md も検査してしまう。そのため、どの repo でも検査しないものを `src/textlintignore` で渡す。repo だけの除外は `.textlintignore` に書く（「dev-config コマンド」を参照）。

preset-ja-technical-writing のうち、次のルールを変えている。ほかは既定のまま使う。

| ルール | 設定 | 理由 |
| --- | --- | --- |
| sentence-length | 150 文字まで（既定は 100） | 表の行や、パスとコマンドを含む文が長くなりやすい |
| no-exclamation-question-mark | 無効 | Claude への指示や問いかけで `?` を使う |

prh の辞書 `src/prh.yml` には、表記を 1 つに決めた用語を足していく。辞書に無い用語を自分で作らない（組織の「文書スタイル」）ことを、表記のレベルで守らせる。

### cspell

cspell だけは repo に `cspell.json` を置き、正本を `import` する。エディタの拡張が repo の設定ファイルを探すためと、repo ごとの単語を持たせるため。

```json
{
  "version": "0.2",
  "import": ["./node_modules/dev-config/src/cspell.json"],
  "ignorePaths": ["python/reference/**"],
  "words": ["<その repo だけの単語>"]
}
```

正本の `ignorePaths` は `globRoot` を `${cwd}` にしているので、取り込んだ repo のルートから見たパスとして効く。

検査の対象はすべてのファイル（`cspell "**"`）にする。cspell は TypeScript・Python・Ruby・シェルなど、ファイルの種類ごとの辞書を拡張子に応じて自動で使うので、コードを検査しても誤検知は少ない。バイナリ、`.gitignore` で除外したファイル、正本の `ignorePaths` に当たるファイルは読み飛ばす。

lefthook では `--no-must-find-files` を付ける。コミットしたファイルがすべて読み飛ばされる（画像だけをコミットしたときなど）と、付けないと「対象が無い」として失敗する。

日本語は、ひらがな・カタカナ・漢字を `ignoreRegExpList` で検査から外している。cspell には日本語の辞書がない。

### secretlint

repo だけの除外は `.secretlintignore` に書く。`dev-config secretlint` が正本の除外の後ろに足して渡す（「dev-config コマンド」を参照）。

### TypeScript

repo の `tsconfig.json` から正本を `extends` し、`include` や `lib`、`types` など repo ごとのものだけを書く。TS か、型を検査したい JS があれば、`"validate:type": "tsc"` を足す。

```json
{
  "extends": "dev-config/src/tsconfig.json",
  "compilerOptions": { "types": ["bun"] },
  "include": ["scripts/**/*.ts"]
}
```

### ESLint

repo の `eslint.config.mjs` で正本を読み、repo だけの除外や設定を後ろに足す。

```js
import base from 'dev-config/src/eslint.config.mjs';

export default [...base, { ignores: ['python/**'] }];
```

TypeScript と typescript-eslint の版は、この repo でそろえて上げる。Expo のように、フレームワークが TypeScript や ESLint の設定を決めている package は、そちらに従う。

### Vitest

TS のある repo にはテストを書き、coverage の閾値（4 つの指標すべてで 95%）を守る。repo の `vitest.config.ts` で正本を読み、repo だけの除外や設定を足す。

```ts
import { defineConfig } from 'vitest/config';
import { coverage } from 'dev-config/src/vitest.config.mjs';

export default defineConfig({
  test: {
    coverage: { ...coverage, exclude: [...coverage.exclude, 'src/routeTree.gen.ts'] }
  }
});
```

足すものがなければ、`export { default } from 'dev-config/src/vitest.config.mjs';` だけでよい。`src/vitest.config.d.mts` は、TS から読むときの型の定義。

### Prettier

package.json の `"prettier"` に `dev-config/src/prettierrc.json` を書いて正本を読ませる。CLI もエディタの拡張も、ここから設定を見つける。repo に `.prettierrc` は置かない。

Markdown は整形しない。Prettier は表の列を必ず揃えるが、日本語と数値が混ざる表は詰めた書き方のほうが読みやすい（markdownlint の MD060 を無効にしているのと同じ理由）。正本の `overrides` で `*.md` に `requirePragma` を付け、`@format` の印がある md だけを整形の対象にしている。md の検査は markdownlint に任せる。

除外は repo の `.gitignore` と `.prettierignore` に従う。lock ファイルなど Prettier が形式を知らないファイルは、`--ignore-unknown` で読み飛ばす。

### Renovate

repo の `renovate.json` で preset を読み、repo だけの事情（base のブランチ、ランタイムの制約、特定のパッケージの上限など）だけを書く。

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>takudev-works/dev-config//src/renovate"]
}
```

`github>takudev-works/dev-config//src/renovate` は、この repo の main の `src/renovate.json` を指す（Renovate は preset の名前に `.json` を付けたファイルを読む）。タグではなく main を読むので、main に入った変更がそのまま各 repo に効く。

| 設定 | 中身 |
| --- | --- |
| 実行の時間 | 平日の 9 時より前（日本時間）。lock ファイルの更新は月曜の 9 時より前 |
| PR | ラベル `dependencies`、担当は `t-i-0414`（レビュアーは各 repo の CODEOWNERS で付く）、コミットメッセージの頭に `chore:`、同時に開く PR は 5 本まで |
| 上げ方 | 公開から 7 日たった版だけを上げる。範囲指定（`^` など）の下限も上げる |
| まとめ方 | npm・Python・GitHub Actions・mise・Terraform のそれぞれで、major 以外を 1 本の PR にまとめる |
| major | Dependency Dashboard で承認してから PR を出す |
| TypeScript | 7 未満に止める。typescript-eslint が TS 7 にまだ対応していないため |
| `dev-config` | 自分たちで出すので、7 日待たず、major も承認を待たない。package.json の版と、再利用できるワークフローの呼び出し先の SHA を 1 本の PR で上げる |

設定の検査（`renovate-config-validator`）は依存が大きいので、`bun run validate` には入れない。renovate の版はワークフローの `RENOVATE_VERSION` に固定し、この repo の `renovate.json` で読む `customManagers:githubActionsVersions` で Renovate に上げさせる。`src/renovate.json` か `renovate.json` が変わった PR でだけ、`.github/workflows/renovate-config.yml` で回す。動くかどうかがファイルの変更で決まるので、必須の check にはしない。各 repo では回さない。設定に誤りがあれば、Renovate がその repo の Dependency Dashboard か issue で知らせ、更新を止める。

### npm-package-json-lint

どの repo にも当てはまるものだけを検査する: 各プロパティの型、`name` と `version` の書式、`private: true`（間違えて npm に公開しないため）、プロパティと依存の重複、依存のアルファベット順。依存の書き方（`^` と固定のどちらにするか、git の依存にするか）は repo ごとに事情が違うので検査しない。

`"**/package.json"` で渡すと、`node_modules` の中は自動で除外される。ファイルのパスを直接渡すとディレクトリとして扱われて失敗するので、lefthook でも package.json が変わったときに `validate:package-json`（repo のすべての package.json）を動かす。

### commitlint

Conventional Commits の形（`feat: …` など）を検査する。手元では lefthook の `commit-msg` でコミットメッセージを、CI では `reusable-validate.yml` で PR のタイトルと PR のコミットメッセージを検査する。`subject-case`（subject の大文字・小文字の書き方）は検査しない。subject は日本語で書くので、この規則は `README を直す` や `TypeScript を上げる` のように固有名詞で始まる subject を落とすだけになるため。

### CODEOWNERS

repo の `.github/CODEOWNERS` に `* @t-i-0414` を書く。Renovate や Claude が出す PR にも、自動でレビュアーが付く。CODEOWNERS はほかのファイルを読み込めず、組織全体に置く仕組みも無いので、この repo からは配れない。各 repo に置く。

### README

repo の README に「開発の準備」の節を置き、手元で最初に実行することを書く。repo だけの準備（認証、DB、`.env` など）があれば、この後ろに足す。

````markdown
## 開発の準備

手元では次の順に実行する。

```sh
mise install      # mise.toml の版のツールを入れる
mise run setup    # 依存と git hook を入れる
bun run validate  # CI と同じ検査
```

前もって `mise` を入れておく（入れ方は https://mise.jdx.dev/getting-started.html ）。初めて使う repo では、`mise trust` で `mise.toml` を信頼してから実行する。
````

## GitHub Actions の部品

再利用できるワークフロー（`workflow_call`）を置いている。各 repo は、いつ動かすかと呼び出し先だけを書く。runner や action の版、条件はここで一元管理する。

| ワークフロー | 中身 |
| --- | --- |
| `.github/workflows/reusable-validate.yml` | mise で repo の `mise.toml` の版の bun などを入れ、`bun install --frozen-lockfile` と `bun run validate` を回す。PR では、その前に PR のタイトルと PR のコミットメッセージを commitlint で検査する |
| `.github/workflows/reusable-claude.yml` | issue や PR のコメントの `@claude` で Claude Code を動かす。書き手が repo の OWNER・MEMBER・COLLABORATOR のときだけ動く |

```yaml
# .github/workflows/org-requirements.yml
name: Org Requirements

on:
  pull_request:
    types: [opened, edited, reopened, synchronize]
  push:
    branches: [main]

jobs:
  dev-config:
    uses: takudev-works/dev-config/.github/workflows/reusable-validate.yml@<タグのコミットの SHA> # <タグ>
    permissions:
      contents: read
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
    uses: takudev-works/dev-config/.github/workflows/reusable-claude.yml@<タグのコミットの SHA> # <タグ>
    secrets:
      ORG_CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.ORG_CLAUDE_CODE_OAUTH_TOKEN }}
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
```

- 呼び出し先は、タグのコミットの SHA に `# <タグ>` を添えて固定する（「使い方」のコマンドで分かる）。この形なら Renovate が SHA とタグを一緒に更新できる
- 組織の secret `ORG_CLAUDE_CODE_OAUTH_TOKEN` だけを名前で渡す。`secrets: inherit` にしないのは、呼ばれる側にほかの secret まで渡るため（`secrets: inherit` のままの repo も動く）
- 呼び出す側の job に書いた権限が上限になるので、`permissions` は呼び出す側に書く
- Claude Code を動かすワークフローには `id-token: write` が要る。`claude-code-action` が、Claude の GitHub App のトークンを OIDC で取るため。無いと「Could not fetch an OIDC token」で失敗する
- `claude.yml` には `actions: read` も要る。Claude が PR の CI の結果とログを読むため。無いと、CI が落ちた理由を聞いてもログを読めず、差分から推測するしかない。呼ばれる側が求める権限を呼ぶ側が持っていないと、ワークフローが起動時に失敗するので、呼ぶ側を先に足してから、呼ばれる側の版を上げる
- PR のタイトルと、PR の base から head までのコミットメッセージも検査する。squash で merge すると PR のタイトルが、merge commit で merge すると PR のコミットメッセージが、そのまま既定のブランチに入るため。lefthook を通らないコミット（`--no-verify`、GitHub の画面での編集）も CI で止まる。merge commit（`Merge ...`）は commitlint が無視する。タイトルを直したときにも検査し直すように、`pull_request` の `types` に `edited` を入れる
- 呼び出したワークフローの check の名前は `<呼び出す側の job> / <呼ばれる側の job>`（`dev-config / validate`）になる。組織の ruleset `dev-config` が、既定のブランチへの merge にこの check の合格を求める。画面には、ワークフロー名を頭に付けた `Org Requirements / dev-config / validate` と出る
- 組織の ruleset `dev-config` は、全 repo の既定のブランチと `main`・`staging`・`develop` にかかる。この check のほかに、承認 1 件、CODEOWNERS のレビュー、push で古い承認を取り消す、会話の解決、merge 方法は merge と squash、force push と削除の禁止を求める。組織の Owner は常に迂回できるので、自分の PR は迂回して merge する。repo だけの検査は、repo の ruleset で必須の check にせず、その repo の `validate:*` に足す。repo の ruleset を作ると、守るブランチと迂回できる人を組織の ruleset と 2 か所で持つことになるため

## 正本と各 repo の重なりを片付ける

`.github/workflows/dev-config-consolidate.yml` が毎週月曜 9:30（日本時間）に、takudev-works の repo を見て次の 2 つを行う。各 repo にワークフローを置かなくてよいように、dev-config の 1 か所で回す。

| job | 中身 |
| --- | --- |
| `consolidate` | 2 つ以上の repo に同じ設定があれば、正本に足す PR を dev-config に出す |
| `remove-duplicates` | dev-config を入れている repo ごとに、その repo が使っている版の正本と重なる設定を消す PR を、その repo に出す |

`remove-duplicates` が dev-config の main ではなく各 repo が使っている版と比べるのは、正本にまだ入っていないものを消すと、その repo の検査が落ちるため。そのため、正本に寄せた設定が各 repo から消えるのは、寄せる PR を merge してタグを打ち、各 repo がその版を入れた後の実行になる。

ほかの private な repo を読み、PR を出すために、組織の GitHub App `takudev-dev-config` を使う。権限は Contents と Pull requests の Read and write。Client ID と秘密鍵は、組織の secret `ORG_DEV_CONFIG_APP_CLIENT_ID` と `ORG_DEV_CONFIG_APP_PRIVATE_KEY`（dev-config だけが読める）に入れてある。

## 名前の付け方

屋号は `Taku.dev`。屋号まわりの名前は、Taku.dev として名乗る名前か、制作に使うツールの中の名前かで使い分ける。

| 区分 | 使う名前 | 対象の例 |
| --- | --- | --- |
| Taku.dev として名乗る名前 | `Taku.dev` | 名刺、請求書、サイト、アプリストアのデベロッパー名、claude.ai の組織名 |
| 制作に使うツールの中の名前 | `takudev-works` | GitHub の org、AWS のアカウント名、Vercel のチーム、Canva のチーム、Figma のチームなど |
| 記号を使えない識別子 | `takudev` | メールドメイン（takudev.net）、Google Workspace のドメイン |

- 名乗る名前は屋号の表記どおり `Taku.dev` と書く。`takudev` や `Takudev` と書かない
- 制作に使うツールのチーム名は、お客さんを招待したりファイルを共有したりして相手に見えても、`takudev-works` にする
- 制作に限らず事業全体で使うツールの組織名（claude.ai など）は、名乗る名前として `Taku.dev` にする
- ドメインや ID のように `.` を使えない、または使うと別の意味になるところは `takudev` にする
- ドメインは takudev.net のまま使う。takudev-works.net には移さない
- AWS のルートのメールアドレスは takudev.net のものにする。アカウント名は表示名なので `takudev-works` でよい
- GitHub の org は、名前を変えると URL や連携の設定に影響が出るので、`takudev-works` のまま長く使う

## 変更の流れ

変更は PR で出す。版を上げるときは、PR で package.json の `version` を上げる。merge すると `.github/workflows/release-tag.yml` が、そのコミットに同じ版のタグ（`v` に版を付けたもの）を打ち、前のタグからの PR を並べた GitHub Release を作る。各 repo の Renovate の PR に、この変更点が載る。その版のタグがもうあれば何もしない。タグは手で打たない。各 repo は Renovate などでタグを更新する。

v3.1.0 と v4.0.0 のタグは、package.json の版が `3.0.0` のまま打った。各 repo がタグのコミットの SHA を参照しているので、打ち直していない。

## この repo の開発の準備

この repo 自身も、`src/` の正本で検査する。正本そのものの中身は `test/` で検査する（どの repo でも検査しないディレクトリが 5 つのツールの除外でそろっていること、commitlint が日本語の subject を通すことなど）。`src/vitest.config.mjs` は、同じ名前の `.d.mts` があると `tsc` の対象から外れるので、`tsconfig.vitest-config.json` で別に型を検査する。各 repo が呼ぶワークフローの正本なので、`.github/workflows` も actionlint と zizmor で検査する（`validate:workflows`）。

手元では次の順に実行する。

```sh
mise install      # mise.toml の版の bun、lefthook、actionlint、zizmor を入れる
mise run setup    # 依存と git hook を入れる
bun run validate  # CI と同じ検査
```

前もって `mise` を入れておく（入れ方は https://mise.jdx.dev/getting-started.html ）。初めて使う repo では、`mise trust` で `mise.toml` を信頼してから実行する。
