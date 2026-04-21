import { Flame } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'

export function ProgressBadge() {
  const { totalXp, streak, currentLevel } = useProgress()

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Level */}
      <div className="flex items-center gap-1 rounded-full border border-white/15 bg-primary/10 px-2 py-0.5">
        <span>{currentLevel.emoji}</span>
        <span className="font-medium">{currentLevel.name}</span>
      </div>

      {/* XP */}
      <div className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 sm:flex">
        <span className="font-mono tabular-nums">{totalXp.toLocaleString()}</span>
        <span className="text-muted-foreground">XP</span>
      </div>

      {/* Streak (only show if > 0) */}
      {streak > 0 && (
        <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5">
          <Flame className={`h-3 w-3 text-orange-400 ${streak >= 3 ? 'animate-pulse' : ''}`} />
          <span className="font-mono font-bold tabular-nums text-orange-300">{streak}</span>
        </div>
      )}
    </div>
  )
}
