import { useGameStore } from '../store/gameStore'
import { useIsCollectionComplete } from '../store/selectors'
import { formatCoins, formatDuration } from './format'

/** オフライン収集の精算結果モーダル */
export function OfflineReportModal() {
  const report = useGameStore((s) => s.offlineReport)
  const dismiss = useGameStore((s) => s.dismissOfflineReport)
  if (report === null) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal">
        <h2>おかえりなさい!</h2>
        <p>
          {formatDuration(report.elapsedSeconds)}のあいだに
          <strong> 🪙 {formatCoins(report.coinsEarned)} </strong>
          集まりました
        </p>
        {report.capped && <p className="modal__note">(オフライン収集は最大2時間分です)</p>}
        <button type="button" onClick={dismiss}>
          受け取る
        </button>
      </div>
    </div>
  )
}

/** 図鑑コンプリート達成モーダル(1回だけ表示) */
export function CompletionModal() {
  const complete = useIsCollectionComplete()
  const celebrated = useGameStore((s) => s.completionCelebrated)
  const markCelebrated = useGameStore((s) => s.markCompletionCelebrated)
  if (!complete || celebrated) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal modal--celebration">
        <h2>🎉 図鑑コンプリート!</h2>
        <p>全12種の豚を集めました。生成ボーナスは最大の +38% です!</p>
        <button type="button" onClick={markCelebrated}>
          やったー!
        </button>
      </div>
    </div>
  )
}

/** リセット確認つきの設定エリア */
export function SettingsBar() {
  const resetGame = useGameStore((s) => s.resetGame)

  const handleReset = () => {
    if (window.confirm('セーブデータを全て消去して最初からやり直しますか?')) {
      resetGame()
    }
  }

  return (
    <footer className="settings-bar">
      <button type="button" className="settings-bar__reset" onClick={handleReset}>
        データをリセット
      </button>
    </footer>
  )
}
