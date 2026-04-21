import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'solar-trainer-progress-v1'

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
  } catch {
    // storage full or blocked
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(DEFAULT)
  const [lastXpGained, setLastXpGained] = useState<number | null>(null)
  const [didLevelUp, setDidLevelUp] = useState(false)

  useEffect(() => {
    setProgress(load())
  }, [])

  const recordSession = useCallback((score: number, grade: string, difficulty: string) => {
    const xpGained = xpForGrade(score, difficulty)
    const keepStreak = gradeIncreasesStreak(grade)

    setProgress((prev) => {
      const prevLevel = getLevel(prev.totalXp)
      const newXp = prev.totalXp + xpGained
      const newLevel = getLevel(newXp)
      const newStreak = keepStreak ? prev.streak + 1 : 0

      const updated: Progress = {
        totalXp: newXp,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        sessionCount: prev.sessionCount + 1,
        lastGrade: grade,
        lastSessionAt: new Date().toISOString(),
      }

      save(updated)
      setLastXpGained(xpGained)
      setDidLevelUp(newLevel.name !== prevLevel.name)
      return updated
    })

    return xpGained
  }, [])

  const clearAnimations = useCallback(() => {
    setLastXpGained(null)
    setDidLevelUp(false)
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
    lastXpGained,
    didLevelUp,
    recordSession,
    clearAnimations,
    reset,
  }
}
