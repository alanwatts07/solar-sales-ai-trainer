import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'solar-trainer-progress-v1'
const UPDATE_EVENT = 'solar-trainer-progress-updated'

export interface Progress {
  totalXp: number
  streak: number
  bestStreak: number
  sessionCount: number
  lastGrade: string | null
  lastSessionAt: string | null
}

const DEFAULT: Progress = {
  totalXp: 0,
  streak: 0,
  bestStreak: 0,
  sessionCount: 0,
  lastGrade: null,
  lastSessionAt: null,
}

export interface Level {
  name: string
  emoji: string
  minXp: number
  maxXp: number
}

export const LEVELS: Level[] = [
  { name: 'Rookie', emoji: '🌱', minXp: 0, maxXp: 500 },
  { name: 'Closer', emoji: '🎯', minXp: 500, maxXp: 2000 },
  { name: 'Shark', emoji: '🦈', minXp: 2000, maxXp: 5000 },
  { name: 'Wolf', emoji: '🐺', minXp: 5000, maxXp: Infinity },
]

export const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
}

export function getLevel(xp: number): Level {
  return LEVELS.findLast((l) => xp >= l.minXp) ?? LEVELS[0]
}

export function xpForGrade(score: number, difficulty: string): number {
  const mult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1
  return Math.round(score * mult)
}

export function gradeIncreasesStreak(grade: string): boolean {
  return grade === 'A' || grade === 'B'
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT
  }
}

function save(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    // Notify all useProgress instances in this tab
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT))
  } catch {
    // storage full or blocked
  }
}

// Per-instance transient state for animations (kept via a session ref)
interface AnimationState {
  lastXpGained: number | null
  didLevelUp: boolean
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load)
  const [anim, setAnim] = useState<AnimationState>({
    lastXpGained: null,
    didLevelUp: false,
  })

  // Listen for updates from other useProgress instances
  useEffect(() => {
    const sync = () => setProgress(load())
    window.addEventListener(UPDATE_EVENT, sync)
    // Also sync on storage events (other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) sync()
    })
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const recordSession = useCallback((score: number, grade: string, difficulty: string) => {
    const current = load()
    const xpGained = xpForGrade(score, difficulty)
    const keepStreak = gradeIncreasesStreak(grade)
    const prevLevel = getLevel(current.totalXp)
    const newXp = current.totalXp + xpGained
    const newLevel = getLevel(newXp)
    const newStreak = keepStreak ? current.streak + 1 : 0

    const updated: Progress = {
      totalXp: newXp,
      streak: newStreak,
      bestStreak: Math.max(current.bestStreak, newStreak),
      sessionCount: current.sessionCount + 1,
      lastGrade: grade,
      lastSessionAt: new Date().toISOString(),
    }

    save(updated)
    setProgress(updated)
    setAnim({
      lastXpGained: xpGained,
      didLevelUp: newLevel.name !== prevLevel.name,
    })
    return xpGained
  }, [])

  const clearAnimations = useCallback(() => {
    setAnim({ lastXpGained: null, didLevelUp: false })
  }, [])

  const reset = useCallback(() => {
    save(DEFAULT)
    setProgress(DEFAULT)
  }, [])

  const currentLevel = getLevel(progress.totalXp)
  const xpIntoLevel = progress.totalXp - currentLevel.minXp
  const xpToNextLevel = currentLevel.maxXp === Infinity
    ? 0
    : currentLevel.maxXp - progress.totalXp
  const levelProgress = currentLevel.maxXp === Infinity
    ? 100
    : Math.round((xpIntoLevel / (currentLevel.maxXp - currentLevel.minXp)) * 100)

  return {
    ...progress,
    currentLevel,
    xpIntoLevel,
    xpToNextLevel,
    levelProgress,
    lastXpGained: anim.lastXpGained,
    didLevelUp: anim.didLevelUp,
    recordSession,
    clearAnimations,
    reset,
  }
}
