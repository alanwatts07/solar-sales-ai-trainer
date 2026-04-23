import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { ScriptMaster } from '@/pages/ScriptMaster'
import { RolePlay } from '@/pages/RolePlay'
import { HistoryPage } from '@/pages/HistoryPage'
import { Landing } from '@/pages/Landing'
import { Toaster } from '@/components/ui/sonner'
import type { AppTab } from '@/types'

const LANDING_SEEN_KEY = 'solar-trainer-skip-landing'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [activeTab, setActiveTab] = useState<AppTab>('train')

  // If they've already started before, skip the landing
  useEffect(() => {
    const skip = localStorage.getItem(LANDING_SEEN_KEY)
    if (skip === 'true') setShowLanding(false)
  }, [])

  const handleStart = () => {
    localStorage.setItem(LANDING_SEEN_KEY, 'true')
    setShowLanding(false)
  }

  if (showLanding) {
    return (
      <div className="dark">
        <Landing onStart={handleStart} />
        <Toaster position="top-center" />
      </div>
    )
  }

  return (
    <div className="dark">
      <AppShell>
        {activeTab === 'script' && <ScriptMaster />}
        {activeTab === 'train' && <RolePlay />}
        {activeTab === 'history' && <HistoryPage />}
      </AppShell>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster position="top-center" />
    </div>
  )
}

export default App
