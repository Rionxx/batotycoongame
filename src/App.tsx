import { Suspense, lazy } from 'react'
import { useGameLoop } from './hooks/useGameLoop'
import { AchievementPanel, AchievementToast } from './components/AchievementPanel'
import { CompletionModal, OfflineReportModal, SettingsBar } from './components/Modals'
import { PigCollection } from './components/PigCollection'
import { PrestigePanel } from './components/PrestigePanel'
import { ResourceDisplay } from './components/ResourceDisplay'
import './App.css'

// three.js はバンドルが大きいため、3Dワールドだけコード分割して遅延読み込みする
const World3D = lazy(() =>
  import('./components/three/World3D').then((m) => ({ default: m.World3D })),
)

function WorldLoading() {
  return (
    <section className="world">
      <div className="world__viewport world__viewport--loading">
        <p>牧場を準備中…</p>
      </div>
    </section>
  )
}

export default function App() {
  useGameLoop()

  return (
    <div className="app">
      <h1 className="app__title">🐷 ぶたタイクーン</h1>
      <ResourceDisplay />
      <Suspense fallback={<WorldLoading />}>
        <World3D />
      </Suspense>
      <main className="app__main">
        <div className="app__column">
          <PrestigePanel />
          <AchievementPanel />
        </div>
        <div className="app__column">
          <PigCollection />
        </div>
      </main>
      <SettingsBar />
      <OfflineReportModal />
      <CompletionModal />
      <AchievementToast />
    </div>
  )
}
