# 状態設計(フェーズ2)

`docs/requirements.md` をデータ構造に落とし込んだ際の設計判断の記録。

## 全体構成

- 型定義: `src/types/game.ts`(データの「形」のみ。数値は持たない)
- ストア: `src/store/gameStore.ts`(Zustand単一ストア + persist)
- 数値パラメータ・マスタデータ: `src/logic/constants.ts`(フェーズ3で作成)

## 設計判断と理由

### 1. 単一ストア構成

Zustandストアは `useGameStore` の1つに統合した。資源・施設・豚は互いに依存する
(施設→レート、看板→豚出現率、豚→レートボーナス)ため、分割すると更新の整合性を
取るコストの方が高い。UI側の関心事分離はセレクタで行う。

### 2. Record(IDキー)方式、配列は不使用

施設は4種・豚は12種で固定かつIDが型レベルで既知のため、
`Record<BuildingId, number>` / `Record<PigSpeciesId, PigCollectionEntry>` を採用した。

- 配列+find より参照が O(1) で、TypeScriptが「全IDぶんのエントリが存在する」ことを保証できる
- 図鑑は未捕獲でも `count: 0` のフルレコードで持つ。「キーの有無」と「捕獲済みか」の
  2通りの表現が混ざるのを避けるため

### 3. 施設は「レベルの数値」だけを状態に持つ

施設の名前・効果量・コスト曲線は不変のマスタデータなので状態に含めず、
`BuildingSpec` としてconstants.tsに置く。セーブデータには `buildingLevels` の数値のみが
入るため、フェーズ5でのバランス調整(マスタ側の変更)が既存セーブを壊さない。

### 4. 永続状態(GameState)と一時状態(TransientState)の分離

`activePig`(出現中の豚)・`offlineReport`・モーダルフラグは永続化しない。
リロード時に出現中の豚が復活する挙動は不自然であり、要件上も「オフライン中は豚が
出現しない」ため。persistの `partialize` で GameState のみを保存する。

### 5. 時刻はすべて「引数で渡すエポックms」

`tick(nowMs)` `applyOfflineProgress(nowMs)` のように、現在時刻はアクションの引数で
受け取る設計にした。ロジック内で `Date.now()` を直接呼ぶとユニットテストで時間を
制御できないため。`lastActiveAt` / `lastSpawnCheckAt` を状態に持ち、
「経過時間ぶんの精算」をロジック側で純粋関数として計算できるようにする。

### 6. オフライン精算は tick と別アクション

`applyOfflineProgress` を独立させた。tickは「1秒進める」定常処理、オフライン精算は
「上限2時間クリップ+レポート生成」という別ルールを持つため、混ぜると条件分岐が濁る。
精算結果は `offlineReport` に入れ、UIはそれを表示して `dismissOfflineReport` で閉じる。

### 7. 永続化キーとバージョン

- キー: `batotycoon:save`(SAVE_KEY)
- `persist` の `version: 1`(SAVE_VERSION)。スキーマ変更時はversionを上げて
  `migrate` を実装する。セーブスロットは1つ、保存タイミングはZustand persistの
  デフォルト(状態変更ごと)に従う

### 8. ロジックとストアの境界

ストアのアクションは「状態更新の入口」のみ。計算式(レート計算・コスト曲線・
出現抽選・重複変換額)はフェーズ3で `src/logic/` に純粋関数として実装し、
アクションから呼び出す。現段階のアクション本体は `throw new Error` のスタブとし、
未実装のまま呼ばれた場合に静かに壊れないようにしている。

## フェーズ3への引き継ぎ

- `src/logic/constants.ts` に施設マスタ(`BuildingSpec[]`)・豚マスタ(`PigSpecies[]`)・
  基本レート・出現判定間隔などの全数値を集約すること
- 乱数(豚の抽選)は `() => number` を引数で注入できる形にし、テストで固定できるようにすること
- ストアの8アクションの実装と、対応するロジック関数のユニットテストが成果物
