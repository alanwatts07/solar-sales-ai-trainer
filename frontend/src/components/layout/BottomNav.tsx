import { FileText, Mic, History } from 'lucide-react'
import type { AppTab } from '@/types'

interface BottomNavProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

const tabs: { id: AppTab; label: string; icon: typeof FileText }[] = [
  { id: 'script', label: 'Script', icon: FileText },
  { id: 'train', label: 'Train', icon: Mic },
  { id: 'history', label: 'History', icon: History },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
