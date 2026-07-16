import { useGameLoop } from './hooks/useGameLoop'
import { AchievementPanel, AchievementToast } from './components/AchievementPanel'
import { BuildingList } from './components/BuildingList'
import { CompletionModal, OfflineReportModal, SettingsBar } from './components/Modals'
import { PigCollection } from './components/PigCollection'
import { PigField } from './components/PigField'
import { PrestigePanel } from './components/PrestigePanel'
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
          <PigField />
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
