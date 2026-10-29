# dev-config

takudev-works の各 repo で共通に使う開発の設定と CI のワークフローの正本。各 repo はこの repo を git の依存として入れ、`dev-config` コマンドか設定ファイルのパスで各ツールに正本を渡す。

各 repo が読むのは、入れた版の `dist/` のファイル。

| ファイル | ツール | 中身 |
| --- | --- | --- |
| `dist/markdownlint-cli2.mjs` | markdownlint-cli2 | ルールと、どの repo でも検査しないもの（`node_modules`、`.venv`、`dist`、キャッシュ類など）。repo の `.markdownlint-cli2.mjs` から読む |
| `dist/cspell.json` | cspell | 言語、日本語の文字を無視する正規表現、どの repo でも検査しないもの、どの repo でも出る単語 |
| `dist/commitlintrc.json` | commitlint | Conventional Commits |
| `dist/secretlintrc.json` | secretlint | preset-recommend。ローカルの開発用 DB の接続文字列だけ許す |
| `dist/secretlintignore` | secretlint | どの repo でも検査しないもの |
| `dist/tsconfig.json` | TypeScript | strict 系の型検査の設定。`noEmit` |
| `dist/eslint.mjs` | ESLint | `@eslint/js` と typescript-eslint の recommended、Prettier と重なるルールの無効化、どの repo でも検査しないもの |
| `dist/vitest.config.mjs` | Vitest | coverage の設定。置き場所を絞らずにすべての TS（`.ts`・`.tsx`・`.mts`・`.cts`）を対象にし、テスト・型の定義・設定ファイル・どの repo でも検査しないディレクトリを外す。4 つの指標すべてで 95% を閾値にする |
| `dist/prettierrc.json` | Prettier | 書式。Markdown は整形しない |
| `dist/textlintrc.json` | textlint | 日本語の文章の検査。preset-ja-technical-writing と prh |
| `dist/textlintignore` | textlint | どの repo でも検査しないもの |
| `dist/prh.yml` | textlint（prh） | 用語の表記ゆれを直す辞書 |
| `dist/npmpackagejsonlintrc.json` | npm-package-json-lint | package.json の型と書式、`name` の scope（`@takudev-works/`）、`private: true`、依存の重複と並び順 |
| `dist/actionlint.yaml` | actionlint | Blacksmith の runner のラベル |
| `dist/zizmor.yml` | zizmor | どの repo でも無効にするルールと、検査から外すワークフロー |
| `dist/cli.mjs` | `dev-config` コマンド | 上の設定ファイルのパスを足して各ツールを動かす |
| `dist/renovate.json` | Renovate | 各 repo の `renovate.json` から読む preset |

正本の元は `src/` の tool ごとのディレクトリ（`src/textlint/` など）に置き、`pnpm run build` で `dist/` の直下に平らに並べる（「この repo の開発の準備」を参照）。各 repo には `dist/` だけを読ませ、`src/` は読ませない。正本の元をいくつかのファイルに分けたり、同じツールの設定を用途ごとにいくつも出したりしても、ビルドを通せば、各 repo が読むものを変えずに済むため。ルートには、この repo 自身を検査するための設定を置く。

ファイル名を `.` で始めないのは、git の依存として取り込むときに `.` で始まるファイルが落とされるため（v1.0.0 で起きた）。

v5 以前は、各 repo が `src/` のファイルを読んでいた。v6 で `dist/` に移したので、上げるときは各 repo の `dev-config/src/` と `node_modules/dev-config/src/` を、`dev-config/dist/` と `node_modules/dev-config/dist/` に直す。ESLint の正本は `eslint.config.mjs` から `eslint.mjs` に名前を変えた（「ESLint」を参照）。

v7 で `dist/markdownlint-cli2.jsonc` をやめた。v6.1 までの書き方（`--config` や `.vscode/settings.json` で正本の JSONC を渡す）の repo のために残していたが、どの repo も `.markdownlint-cli2.mjs` で読む形に移ったため。まだ JSONC を渡している repo は、「markdownlint」の書き方に直してから上げる。

v8 で、package の名前を `dev-config` から `@takudev-works/dev-config` に変えた。takudev-works の repo の package の名前を、すべて `@takudev-works/` で始めることにしたため（「npm-package-json-lint」を参照）。Renovate は依存の名前を付け替えないので、上げるときは手で次を直す。

- package.json の `devDependencies` の `"dev-config"` を `"@takudev-works/dev-config"` にする
- 正本を読むパスの `dev-config/dist/` と `node_modules/dev-config/dist/` を、`@takudev-works/dev-config/dist/` と `node_modules/@takudev-works/dev-config/dist/` にする
- その repo の package.json（モノレポなら中の package も）の `name` を `@takudev-works/` で始める
- `reusable-validate.yml` の呼び出し先を v8 のタグの SHA にする

v9.1 で、Renovate の preset もほかの正本と同じく、入れた版の `dist/` から読む形にした（「Renovate」を参照）。`src/renovate.json` は v9.1 から無い。`github>takudev-works/dev-config//src/renovate` を読んでいる repo は、`renovate.json` の `extends` を `github>takudev-works/dev-config//dist/renovate#<タグ>` に直す。`<タグ>` は package.json の dev-config と同じタグにする。

v9 で、bun の repo への対応をやめた。v8.2 から、各 repo の package manager を bun から pnpm（runtime は Node）に移し、すべての repo が移ったため。`reusable-validate.yml` は pnpm と Node だけで検査する。まだ bun の repo は、「pnpm と Node」の書き方に移してから上げる。正本の cspell の単語から `bunfig` と `bunx` を外したので、文書にこれらの単語が残っている repo は、repo の `cspell.json` に足す。

## 使い方

この repo を devDependencies に入れる。

`<タグ>` には最新のタグを書く。最新のタグと、そのコミットの SHA（ワークフローの呼び出し先に使う）は次で分かる。

```sh
gh api repos/takudev-works/dev-config/tags --jq '.[0] | "\(.name) \(.commit.sha)"'
```

```json
{
  "devDependencies": {
    "@takudev-works/dev-config": "github:takudev-works/dev-config#<タグ>"
  },
  "prettier": "@takudev-works/dev-config/dist/prettierrc.json"
}
```

ツール本体は、この repo の `dependencies` に入れてある（どれが入っているかは package.json を見る）。pnpm が `node_modules` の直下に置き、コマンドも `node_modules/.bin` に入るので、各 repo には書かない（そのための置き方は「pnpm と Node」を参照）。ツールの版の範囲はこの repo の `dependencies` で決め、上げるのもこの repo で行う。正確な版は各 repo の `pnpm-lock.yaml` で決まり、Renovate の lock ファイルの更新でそろえて新しくなる。範囲（`^`）で書き、版を固定しないのは、ツールの不具合やセキュリティの直しを、この repo の版を出さなくても各 repo の lock の更新で入れられるようにするため。ただし `vitest` と `@vitest/coverage-v8` は固定する。`@vitest/coverage-v8` の peerDependencies は vitest の完全に同じ版を求め、範囲で書くと、lock の更新で 2 つの版がずれうるため。

### pnpm と Node

各 repo の package manager は pnpm、runtime は Node にする。Node と pnpm の版は repo の `mise.toml` に書き（「lefthook」を参照）、package.json の `packageManager` にも `pnpm@<版>` を書く。

ルートの `pnpm-workspace.yaml` に `nodeLinker: hoisted` を書く。pnpm の既定の置き方では、`node_modules/.bin` に入るのが直接の依存（`dev-config`）のコマンドだけになり、eslint・prettier・cspell などが repo から動かないため。

同じファイルに `minimumReleaseAge: 10080` も書く。公開から 7 日（10080 分）たっていない版を、pnpm が入れないようにするため。乗っ取られた版は、公開から数日で見つかって取り下げられることが多い。Renovate の preset も 7 日待つ（「Renovate」を参照）。ただし、手元の `pnpm add`・`pnpm update` と間接の依存は、pnpm の設定でしか止まらない。pnpm の既定は 1 日。`dev-config` は GitHub から入れるので、この設定で止まらない。

lock ファイルに 7 日たっていない版が残っていると、`pnpm install --frozen-lockfile` が `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` で失敗する。そのときは `pnpm clean --lockfile` の後に `pnpm install` で lock を作り直す。直接の依存の範囲を満たす版がどれも 7 日たっていなければ、作り直しても `ERR_PNPM_NO_MATURE_MATCHING_VERSION` で失敗するので、7 日たつのを待つ。

```yaml
nodeLinker: hoisted
minimumReleaseAge: 10080
```

`pnpm-workspace.yaml` の設定は正本から配れないので、どちらも各 repo に書く。

ほかに次のことが要る。

| 場所 | 書くこと | 理由 |
| --- | --- | --- |
| `pnpm-workspace.yaml` の `allowBuilds` | install script を動かす依存（`true`）と止める依存（`false`） | pnpm は、install script を許すかを決めていない依存があると、install を失敗にする。`pnpm approve-builds <許す依存> '!<止める依存>'` で書ける |
| `.prettierignore` | `pnpm-lock.yaml` | Prettier は YAML として読み、pnpm の書いた書式を違反とするため。Prettier の除外は repo の `.gitignore` と `.prettierignore` にしか書けないので、正本からは配れない |
| `tsconfig.json` の `types` | `["node"]` | |
| `node` で直接動かす TS の相対 import | `.ts`・`.mts` を付け、`tsconfig.json` に `allowImportingTsExtensions` と `erasableSyntaxOnly` を足す | Node は型を取り除いて TS を動かすが、拡張子の無い import や `.mjs` から `.mts` を探さないため |
| package.json の `type` | `"module"` | 無いと、Node が `.ts` を ESM として読むたびに警告を stderr に出すため |
| Vercel の project の環境変数 | `ENABLE_EXPERIMENTAL_COREPACK=1` | Vercel が自分で pnpm の版を切り替える仕組みは、pnpm 12 で失敗するため。corepack に `packageManager` の版を入れさせる。corepack は Node 25 から Node に入っていないので、Vercel の Node を 25 以上に上げるときは、別の手段が要る |
| テストで子プロセスとして動かす Node | `spawnSync('node', …)` ではなく `spawnSync(process.execPath, …)` | テストを動かしている Node と同じものを使うため |

### dev-config コマンド

設定ファイルのパスを渡す必要があるツールは、`dev-config <ツール> [引数...]` で動かす。正本の設定のパスを足してツールを動かし、ツールの終了コードを返す。引数はそのままツールに渡る。

コマンドで包むかどうかは、repo に置いた設定ファイルの中で正本を読み込めて、しかもツールとエディタの拡張がその設定ファイルを repo から自分で見つけられるかで決める。両方できるツール（ESLint・cspell・TypeScript・Prettier・markdownlint）は、repo の設定ファイルで正本を読み、包まずに動かす。どちらかができないツール（除外ファイルを 1 つしか渡せない textlint・secretlint、repo の外の設定を読めない actionlint・zizmor など）を包む。

| `dev-config` の後に書く名前 | 動かすツール | 足す引数 |
| --- | --- | --- |
| `actionlint` | actionlint | `-config-file dist/actionlint.yaml`（repo に `.github/actionlint.yaml` があればそちら） |
| `commitlint` | commitlint | `--config dist/commitlintrc.json` |
| `markdownlint` | markdownlint-cli2 | `--config dist/markdownlint-cli2.mjs`（repo の `.markdownlint-cli2.mjs` も重ねて効く）。repo に `.markdownlint-cli2.mjs` があれば要らないが、plugin dev-config の hook が使うので残している |
| `npm-package-json-lint` | npm-package-json-lint | `--configFile dist/npmpackagejsonlintrc.json` |
| `secretlint` | secretlint | `--secretlintrc dist/secretlintrc.json --secretlintignore <除外>` |
| `textlint` | textlint | `--config dist/textlintrc.json --ignore-path <除外>` |
| `zizmor` | zizmor | `--offline --min-severity low --config dist/zizmor.yml`（repo に `.github/zizmor.yml` があればそちら） |

textlint と secretlint の除外は、repo に `.textlintignore`・`.secretlintignore` があれば、正本の除外の後ろにその行を足したファイルを渡す。無ければ正本の除外をそのまま渡す。両ツールとも除外ファイルを 1 つしか渡せないので、repo には正本に足したい行だけを書く。

`.textlintignore`・`.secretlintignore` は、コマンドを動かすディレクトリ（ふつうは repo のルート）に置く。`dev-config` コマンドはそのディレクトリのものだけを読むので、モノレポのパッケージに置いても、ルートで動かすときには効かない。

パスを直接渡す書き方（`--config node_modules/@takudev-works/dev-config/dist/...`）も、これまでどおり動く。

package.json の scripts には、次のように書く。

```json
{
  "scripts": {
    "validate": "run-p validate:*",
    "validate:format": "prettier --check .",
    "validate:markdown": "markdownlint-cli2 \"**/*.md\"",
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
      run: pnpm exec dev-config commitlint --edit {1}

pre-commit:
  parallel: true
  commands:
    markdownlint:
      glob: '**/*.md'
      run: pnpm exec markdownlint-cli2 {staged_files}
    textlint:
      glob: '**/*.md'
      run: pnpm exec dev-config textlint {staged_files}
    eslint:
      glob: '**/*.{js,mjs,cjs,ts,mts,cts,tsx}'
      run: pnpm exec eslint --no-warn-ignored {staged_files}
    prettier:
      run: pnpm exec prettier --check --ignore-unknown {staged_files}
    cspell:
      run: pnpm exec cspell --no-progress --no-summary --no-must-find-files {staged_files}
    secretlint:
      run: pnpm exec dev-config secretlint {staged_files}
    package-json:
      glob: '**/package.json'
      run: pnpm run validate:package-json
    shellcheck:
      glob: '**/*.{sh,bash}'
      run: shellcheck {staged_files}
    actionlint:
      glob: '.github/workflows/*.{yml,yaml}'
      run: pnpm exec dev-config actionlint {staged_files}
    zizmor:
      glob: '.github/workflows/*.{yml,yaml}'
      run: pnpm exec dev-config zizmor {staged_files}
```

shellcheck・actionlint・zizmor は npm のパッケージではないので、この repo の `dependencies` には入れられない。各 repo の `mise.toml` に、Node・pnpm・lefthook と一緒に入れる。シェルスクリプトがまだ無い repo にも入れておく。CI も、`mise.toml` にある版で検査する（「GitHub Actions の部品」を参照）。`[tasks.setup]` は、「README」の「開発の準備」で使う。

```toml
[tools]
node = "<版>"
pnpm = "<版>"
lefthook = "<版>"
actionlint = "<版>"
zizmor = "<版>"
shellcheck = "<版>"

[tasks.setup]
description = "依存と git hook を入れる"
run = ["pnpm install --frozen-lockfile", "lefthook install"]
```

ワークフローを CI で検査するだけでなく lefthook でも止めるのは、CI まで待たずに直せて、CI を回し直さずに済むため。エディタの拡張は、actionlint には信頼できるものが無く、zizmor の公式の拡張は repo の外（`node_modules/@takudev-works/dev-config/dist`）の設定を見つけられないので使わない。

`glob_matcher: doublestar` は、`**/*.md` をルート直下の md にも一致させるため。lefthook の既定では `**` が 1 階層以上の意味になり、ルート直下のファイルが検査されない。

lefthook の設定そのものを共有しない（`extends` や `remotes` を使わない）のは、それらが repo の `lefthook.yml` より後に読まれて上書きするため。repo ごとの除外を `lefthook.yml` に書けなくなる。

### markdownlint

repo のルートに `.markdownlint-cli2.mjs` を置き、正本を読む。その repo だけで除外したいものは、`ignores` の後ろに足す。

```js
import base from '@takudev-works/dev-config/dist/markdownlint-cli2.mjs';

export default { ...base, ignores: [...base.ignores, 'python/reference/**'] };
```

足すものがなければ、`export { default } from '@takudev-works/dev-config/dist/markdownlint-cli2.mjs';` だけでよい。

markdownlint-cli2 も Cursor・VS Code の拡張（vscode-markdownlint）も、このファイルを repo のルートから自分で見つける。そのため、scripts と lefthook では `--config` を渡さずに動かす（`markdownlint-cli2 "**/*.md"`、`pnpm exec markdownlint-cli2 {staged_files}`）。`.vscode/settings.json` の `markdownlint.configFile` も要らない。

- JSONC の設定（`.markdownlint-cli2.jsonc`）にしないのは、JSONC では正本の `ignores` を読み込んで足せず、repo に除外の一覧を丸写しすることになるため
- 拡張は、ワークスペースを信頼しているときだけ JS の設定を読む。`.markdownlint-cli2.mjs` を直したら、Cursor・VS Code を再起動する（拡張が JS を読み込んだまま持つため）
- lefthook のように検査するファイルを直接渡しても、`ignores` の除外は効く
- `"**/*.md"` は `.github` のような `.` で始まるディレクトリの md も拾うので、それらを別に渡す必要はない
- dev-config を入れていないフォルダの md にも正本を当てたいときは、エディタのユーザー設定の `markdownlint.configFile` に `dist/markdownlint-cli2.mjs` を渡す。dotfiles が `~/.config/markdownlint/` にリンクしている。信頼していないワークスペースでは、拡張がこの JS を読まないので効かない

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

textlint は `.gitignore` を見ないので、`.venv` や `.ruby-lsp` のように手元にだけある依存の md も検査してしまう。そのため、どの repo でも検査しないものを `dist/textlintignore` で渡す。repo だけの除外は `.textlintignore` に書く（「dev-config コマンド」を参照）。

preset-ja-technical-writing のうち、次のルールを変えている。ほかは既定のまま使う。

| ルール | 設定 | 理由 |
| --- | --- | --- |
| sentence-length | 150 文字まで（既定は 100） | 表の行や、パスとコマンドを含む文が長くなりやすい |
| no-exclamation-question-mark | 無効 | Claude への指示や問いかけで `?` を使う |

prh の辞書（`dist/prh.yml`。元は `src/textlint/prh.yml`）は、今は空。表記を 1 つに決めた用語ができたら足していく。

### cspell

cspell だけは repo に `cspell.json` を置き、正本を `import` する。エディタの拡張が repo の設定ファイルを探すためと、repo ごとの単語を持たせるため。

```json
{
  "version": "0.2",
  "import": ["./node_modules/@takudev-works/dev-config/dist/cspell.json"],
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
  "extends": "@takudev-works/dev-config/dist/tsconfig.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["scripts/**/*.ts"]
}
```

### ESLint

repo の `eslint.config.mjs` で正本を読み、repo だけの除外や設定を後ろに足す。

```js
import base from '@takudev-works/dev-config/dist/eslint.mjs';

export default [...base, { ignores: ['python/**'] }];
```

正本の名前を `eslint.config.mjs` にしないのは、typescript-eslint が `eslint.config.*` という名前のファイルの場所から `tsconfigRootDir` を推し量るため。正本がその名前だと、repo のルートではなく `node_modules/@takudev-works/dev-config/dist` を推し量る。

TypeScript と typescript-eslint の版は、この repo でそろえて上げる。Expo のように、フレームワークが TypeScript や ESLint の設定を決めている package は、そちらに従う。

### Vitest

TS のある repo にはテストを書き、coverage の閾値（4 つの指標すべてで 95%）を守る。repo の `vitest.config.mts` で正本を読み、repo だけの除外や設定を足す。`vitest.config.ts` にしないのは、package.json に `"type": "module"` の無い repo では、Vite が「ESM を CommonJS として読んでいる」と警告するため。

```ts
import { defineConfig } from 'vitest/config';
import { coverage } from '@takudev-works/dev-config/dist/vitest.config.mjs';

export default defineConfig({
  test: {
    coverage: { ...coverage, exclude: [...coverage.exclude, 'src/routeTree.gen.ts'] }
  }
});
```

足すものがなければ、`export { default } from '@takudev-works/dev-config/dist/vitest.config.mjs';` だけでよい。TS から読むときの型の定義（`dist/vitest.config.d.mts`）は、ビルドで作られる。

正本は、`src/` のような置き場所に絞らず、すべての TS を数える。置き場所は repo ごとに違い、絞ると、絞った外にテストの無いコードを足しても数字に出ないため。数えないのは、テスト（`*.test.*`・`*.spec.*`）、型の定義、設定ファイル（`*.config.*`）、テスト用のディレクトリ（`test/`・`tests/`・`__tests__/`）、どの repo でも検査しないディレクトリ（ほかのツールの除外と同じ一覧）。

- 処理は import できる関数に置いてテストし、CLI の入口（`bin/` や `scripts/` のような、外の世界とのやり取りと `process.exit` だけのファイル）は薄くして、repo の `exclude` で外す。外すときは、なぜ外すかを設定ファイルのコメントに書く
- 子プロセスとして動かしてテストしても、coverage には数えられない。数えたい処理は、テストから関数として呼ぶ
- 入口と処理を 1 つのファイルに書くときは、入口の部分（`if (import.meta.main) { … }` など）だけを `/* v8 ignore start */`・`/* v8 ignore stop */` で外し、理由をコメントに書く

### Prettier

package.json の `"prettier"` に `@takudev-works/dev-config/dist/prettierrc.json` を書いて正本を読ませる。CLI もエディタの拡張も、ここから設定を見つける。repo に `.prettierrc` は置かない。

Markdown は整形しない。Prettier は表の列を必ず揃えるが、日本語と数値が混ざる表は詰めた書き方のほうが読みやすい（markdownlint の MD060 を無効にしているのと同じ理由）。正本の `overrides` で `*.md` に `requirePragma` を付け、`@format` の印がある md だけを整形の対象にしている。md の検査は markdownlint に任せる。

除外は repo の `.gitignore` と `.prettierignore` に従う。lock ファイルなど Prettier が形式を知らないファイルは、`--ignore-unknown` で読み飛ばす。

### Renovate

repo の `renovate.json` で preset を読み、repo だけの事情（base のブランチ、ランタイムの制約、特定のパッケージの上限など）だけを書く。

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>takudev-works/dev-config//dist/renovate#<タグ>"]
}
```

`github>takudev-works/dev-config//dist/renovate#<タグ>` は、この repo のそのタグの `dist/renovate.json` を指す（Renovate は preset の名前に `.json` を付けたファイルを読む）。Renovate は GitHub の上で repo を読み、`pnpm install` をしないので、`node_modules` の中のものは読めない。そのため、パスではなくタグで、ほかの正本と同じ版を読ませる。`<タグ>` は package.json の dev-config と同じタグにする。

この repo の `renovate.json` だけは、タグを付けずに main の `dist/renovate.json` を読む。この repo 自身は、ほかのツールでも手元の `dist/` の正本で検査するため（「この repo の開発の準備」を参照）。

| 設定 | 中身 |
| --- | --- |
| 実行の時間 | 平日の 9 時より前（日本時間）。lock ファイルの更新は月曜の 9 時より前 |
| PR | ラベル `dependencies`、担当は `t-i-0414`（レビュアーは各 repo の CODEOWNERS で付く）、コミットメッセージの頭に `chore:`、同時に開く PR は 5 本まで |
| 上げ方 | 公開から 7 日たった版だけを上げる。範囲指定（`^` など）の下限も上げる |
| まとめ方 | npm・Python・GitHub Actions・mise・Terraform のそれぞれで、major 以外を 1 本の PR にまとめる。mise の Terraform は Terraform の PR に入れる。`required_version` と別の PR になると、`required_version` を上げた PR の CI が古い Terraform で動いて落ちるため |
| major | 承認を待たずに、依存ごとに 1 本ずつ PR を出す。同じ monorepo の package（`vitest` と `@vitest/coverage-v8` など）は、`config:recommended` の決まりで 1 本にまとまる |
| TypeScript | 6.1 未満に止める。typescript-eslint の peerDependencies が `<6.1.0` で、それより新しい TS では lint が落ちるため |
| `@takudev-works/dev-config` | 自分たちで出すので、7 日待たない。package.json の版、再利用できるワークフローの呼び出し先の SHA、`renovate.json` の preset のタグを 1 本の PR で上げる |
| mise の `op` | 上げない。Renovate が版を調べる先を持たないため。手で上げる |
| 脆弱性の PR | ラベルを `security` にする |

設定の検査（`renovate-config-validator`）は依存が大きいので、`pnpm run validate` には入れない。renovate の版はワークフローの `RENOVATE_VERSION` に固定し、この repo の `renovate.json` で読む `customManagers:githubActionsVersions` で Renovate に上げさせる。`src/renovate/` か `renovate.json` が変わった PR でだけ、`.github/workflows/renovate-config.yml` で、ビルドした `dist/renovate.json` と `renovate.json` を検査する。動くかどうかがファイルの変更で決まるので、必須の check にはしない。各 repo では回さない。設定に誤りがあれば、Renovate がその repo の Dependency Dashboard か issue で知らせ、更新を止める。

### npm-package-json-lint

どの repo にも当てはまるものだけを検査する: 各プロパティの型、`name` と `version` の書式、`name` が `@takudev-works/` で始まること、`private: true`（間違えて npm に公開しないため）、プロパティと依存の重複、依存のアルファベット順。

`name` を `@takudev-works/` で始めるのは、takudev-works の package を、ほかの package と名前で取り違えないようにするため。モノレポの中の package も同じにする（`@takudev-works/<repo>-<名前>`）。依存の書き方（`^` と固定のどちらにするか、git の依存にするか）は repo ごとに事情が違うので検査しない。

`"**/package.json"` で渡すと、`node_modules` の中は自動で除外される。ファイルのパスを直接渡すとディレクトリとして扱われて失敗するので、lefthook でも package.json が変わったときに `validate:package-json`（repo のすべての package.json）を動かす。

### commitlint

Conventional Commits の形（`feat: …` など）を検査する。手元では lefthook の `commit-msg` でコミットメッセージを、CI では `reusable-validate.yml` で PR のタイトルと PR のコミットメッセージを検査する。`subject-case`（subject の大文字・小文字の書き方）は検査しない。subject は日本語で書くので、この規則は `README を直す` や `TypeScript を上げる` のように固有名詞で始まる subject を落とすだけになるため。

### CODEOWNERS

repo の `.github/CODEOWNERS` に `* @t-i-0414` を書く。Renovate や Claude が出す PR にも、自動でレビュアーが付く。CODEOWNERS はほかのファイルを読み込めず、組織全体に置く仕組みも無いので、この repo からは配れない。各 repo に置く。

### README

repo の README に「開発の準備」の節を置き、手元で最初に実行することを書く。`mise run setup` は、`mise.toml` の `[tasks.setup]`（「lefthook」を参照）を動かす。repo だけの準備（認証、DB、`.env` など）があれば、この後ろに足す。

````markdown
## 開発の準備

手元では次の順に実行する。

```sh
mise install       # mise.toml の版の Node、pnpm、lefthook、actionlint、zizmor、shellcheck を入れる
mise run setup     # 依存と git hook を入れる
pnpm run validate  # CI と同じ検査
```

前もって `mise` を入れておく（入れ方は https://mise.jdx.dev/getting-started.html ）。初めて使う repo では、`mise trust` で `mise.toml` を信頼してから実行する。
````

## GitHub Actions の部品

再利用できるワークフロー（`workflow_call`）を置いている。各 repo は、いつ動かすかと呼び出し先だけを書く。runner や action の版、条件はここで一元管理する。

| ワークフロー | 中身 |
| --- | --- |
| `.github/workflows/reusable-validate.yml` | mise で repo の `mise.toml` の版の Node と pnpm などを入れ、`pnpm install --frozen-lockfile` と `pnpm run validate` を回す。その前に、repo の `.github/workflows` を actionlint と zizmor で、シェルスクリプトを shellcheck で検査する。PR では、PR のタイトルと PR のコミットメッセージも commitlint で検査する |
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
- `.github/workflows` を actionlint と zizmor で検査する
  - actionlint は、ワークフローの構文、`${{ }}` の式、`needs`・`steps` の参照、action の入力の名前などの誤りを見る。`run:` のシェルは shellcheck で検査する
  - zizmor は、権限の広さ、checkout の資格情報の残し方、外から入る値の `run:` への埋め込みなど、セキュリティ上の問題を見る
- git で管理しているシェルスクリプト（`*.sh`・`*.bash`）を shellcheck で検査する。意図してそう書いているところは、理由をコメントに書き、その行の前に `# shellcheck disable=<番号>` を付ける
- 設定は `dist/actionlint.yaml`（Blacksmith の runner のラベル）と `dist/zizmor.yml` を使う。repo に `.github/actionlint.yaml`・`.github/zizmor.yml` があれば、そちらを使う。lefthook と同じ `dev-config actionlint`・`dev-config zizmor` で動かすので、設定の選び方と引数は手元と CI で同じになる
- repo の `.github/zizmor.yml` は、正本に重ねるのではなく置き換える。置くときは、正本の `rules`（`self-repository` の無効化と、`dangerous-triggers` で `claude.yml` を外すもの）も写す
- ワークフローは `node_modules/@takudev-works/dev-config/dist/` の `cli.mjs` を動かすので、呼び出し先と package.json の dev-config は、どちらも v8 以上にそろえる。呼び出し先の SHA と package.json の版は、Renovate がそろえて上げる
- actionlint・zizmor・shellcheck は、repo の `mise.toml` にある版を使う（手元の lefthook と同じ版にするため）。無ければ `reusable-validate.yml` の env の版を使う。どちらの版も Renovate が上げる。actionlint にも、runner の shellcheck ではなくこの版を使わせる
- zizmor の指摘を、目的上そのままにするときは、理由をコメントに書き、指摘の行に `# zizmor: ignore[<指摘の名前>]` を付ける。`run: |` の中のシェルに書いても効かないので、`run: |` の行に付ける
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

この repo 自身も正本で検査する。ESLint・markdownlint と `dev-config` コマンドで動かすツールは `dist/` の正本を、Prettier・TypeScript・cspell・Vitest は `src/` の正本を読む。正本そのものの中身は `test/` で検査する（どの repo でも検査しないディレクトリが 6 つのツールの除外でそろっていること、commitlint が日本語の subject を通すこと、各 repo の書き方で `dist/` の型が通ることなど）。テストの coverage も、ルートの `vitest.config.mts` で正本を読んで測り、各 repo と同じ閾値（4 つの指標すべてで 95%）を守る。`src/cli/cli.mts` は、テストが子プロセスで dist の `cli.mjs` を動かして確かめていて、子プロセスは測れないので数えない。ビルドの手順（`scripts/`）もテストし、数える。各 repo が呼ぶワークフローの正本なので、`.github/workflows` も actionlint と zizmor で検査する（`validate:workflows`）。

### ビルド

`src/` の TS（`*.mts`）を `tsc` で JS（`*.mjs`）と型の定義（`*.d.mts`）にし、`src/` の tool ごとのディレクトリにあるほかのファイル（JSON・YAML・除外ファイル）と一緒に、`dist/` の直下に平らに並べる。名前の重なるファイルがあれば、ビルドを止める。`src/` を変えたら `pnpm run build` を実行し、`dist/` も一緒にコミットする。

- `dist/` をコミットするのは、各 repo が git の依存として入れるときに、package manager が依存の `prepare` を動かすとは限らないため（pnpm は、`allowBuilds` で許していない依存の install script を動かさない）。入れるときにビルドできない
- `scripts/` の TS は、Node が型を取り除いてそのまま動かす。そのため、`scripts/` の中の import には `.mts` を付ける（Node は `.mjs` から `.mts` を探さない）
- `validate:build` が一時ディレクトリにビルドし直し、`dist/` と違えば落ちる。lefthook も、`src/`・`dist/`・`scripts/`・`tsconfig.build.json` を変えたコミットで同じ検査をする
- 型の定義は、各 repo が import するもの（ESLint・markdownlint・Vitest の正本）にだけ置く。`src/cli/` のものは `dev-config` コマンドとして動かすだけなので置かない
- `dist/` は Prettier の対象から外している（`tsc` の出力の書式は Prettier と違う）。ESLint・cspell などは、正本の除外に `dist` があるので対象にならない

手元では次の順に実行する。

```sh
mise install       # mise.toml の版の Node、pnpm、lefthook、actionlint、zizmor、shellcheck を入れる
mise run setup     # 依存と git hook を入れる
pnpm run validate  # CI と同じ検査
```

前もって `mise` を入れておく（入れ方は https://mise.jdx.dev/getting-started.html ）。初めて使う repo では、`mise trust` で `mise.toml` を信頼してから実行する。
