import { Suspense, lazy } from 'react'
import { useGameLoop } from './hooks/useGameLoop'
import { AchievementPanel, AchievementToast } from './components/AchievementPanel'
import { BuildingList } from './components/BuildingList'
import { CompletionModal, OfflineReportModal, SettingsBar } from './components/Modals'
import { PigCollection } from './components/PigCollection'
import { PrestigePanel } from './components/PrestigePanel'

// three.js はバンドルが大きいため、3D牧場だけコード分割して遅延読み込みする
const PigField3D = lazy(() =>
  import('./components/three/PigField3D').then((m) => ({ default: m.PigField3D })),
)

function PigFieldLoading() {
  return (
    <section className="pig-field">
      <h2>牧場</h2>
      <div className="pig-field__area pig-field__area--3d">
        <p className="pig-field__empty">牧場を準備中…</p>
      </div>
    </section>
  )
}
import { ResourceDisplay } from './components/ResourceDisplay'
import './App.css'

export default function App() {
  useGameLoop()

  return (
    <div className="app">
      <h1 className="app__title">🐷 ぶたタイクーン</h1>
      <ResourceDisplay />
      <main className="app__main">
        <div className="app__column">
          <Suspense fallback={<PigFieldLoading />}>
            <PigField3D />
          </Suspense>
          <BuildingList />
          <PrestigePanel />
        </div>
        <div className="app__column">
          <PigCollection />
          <AchievementPanel />
        </div>
      </main>
      <SettingsBar />
      <OfflineReportModal />
      <CompletionModal />
      <AchievementToast />
    </div>
  )
}
