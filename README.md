# タイクーンゲーム開発用 Claude Code セットアップ一式

## 中身

```
CLAUDE.md                                    # プロジェクト全体のルール(常時読み込まれる)
PROMPTS.md                                   # Claude Codeへの投げかけ方テンプレート集
.claude/skills/
  git-workflow/SKILL.md                      # ブランチ運用・コミット規約
  phase-1-requirements/SKILL.md              # 要件定義
  phase-2-state-design/SKILL.md              # 状態設計(型・Zustandスキーマ)
  phase-3-core-logic/SKILL.md                # コアロジック実装(tick処理・コスト計算・収集判定)
  phase-4-ui-implementation/SKILL.md         # UI実装(2D React)
  phase-5-testing-balance/SKILL.md           # テスト・バランス調整
```

## セットアップ手順

1. このフォルダの中身を、タイクーンゲーム用のGitリポジトリのルートにそのままコピーする
   (`.claude/`ディレクトリごとコピーすること)
2. リポジトリで `git init`(未初期化の場合)、GitHub上にリモートリポジトリを作成して
   `git remote add origin <URL>` しておく
3. `main` ブランチに初期コミット(このセットアップ一式)をpushしておく
4. Claude Codeを起動し、`PROMPTS.md`の「0. 初回セットアッププロンプト」を貼り付けて開始する

## 動作の仕組み(簡単な補足)

- Claude Codeはプロジェクトルートの`CLAUDE.md`を毎セッション自動的に読み込みます
- `.claude/skills/`配下の各`SKILL.md`は、内容が今の作業に関連すると判断されたときに
  Claude Codeが自動的に参照します(手動で「このスキルを使って」と指定する必要は基本ありません)
- フェーズが進むたびに`main`にマージされ、次のフェーズブランチが切られていきます。
  GitHub上で見ると `main` に5回(フェーズ数分)のマージが積み重なっていく形になります

## カスタマイズしたい場合

- フェーズの数や順序を変えたい場合は `CLAUDE.md` のフェーズテーブルと、対応する
  `.claude/skills/phase-N-xxx/` フォルダを増減させてください
- コミット規約やブランチ命名を変えたい場合は `.claude/skills/git-workflow/SKILL.md` を編集してください
