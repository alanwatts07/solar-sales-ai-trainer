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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/40 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
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
              <Icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_6px_oklch(0.65_0.25_285)]' : ''}`} />
              <span className="font-light tracking-wide">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
