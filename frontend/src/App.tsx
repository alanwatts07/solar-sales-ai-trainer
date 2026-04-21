import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { ScriptMaster } from '@/pages/ScriptMaster'
import { RolePlay } from '@/pages/RolePlay'
import { HistoryPage } from '@/pages/HistoryPage'
import { Toaster } from '@/components/ui/sonner'
import type { AppTab } from '@/types'

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('train')

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
