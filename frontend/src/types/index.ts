export interface GoldenScript {
  id: string
  title: string
  content: string
  createdAt: string
}

export interface TranscriptionResult {
  text: string
  segments: { start: number; end: number; text: string }[]
}

export interface GradingResult {
  accuracyScore: number
  matchedKeywords: string[]
  missedKeywords: string[]
  incorrectPhrases: { expected: string; actual: string }[]
  semanticFeedback: string
  diffSegments: DiffSegment[]
}

export interface DiffSegment {
  type: 'match' | 'missing' | 'incorrect' | 'extra'
  expected?: string
  actual?: string
  text?: string
}

export interface AssessmentResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  criteria: {
    empathy: { score: number; feedback: string }
    objectionHandling: { score: number; feedback: string }
    closingSkills: { score: number; feedback: string }
    scriptAdherence: { score: number; feedback: string }
  }
  tips: string[]
  overallFeedback: string
}

export interface RolePlaySession {
  id: string
  difficulty: 'easy' | 'medium' | 'hard'
  personality: string
  transcript: ConversationTurn[]
  assessment?: AssessmentResult
  createdAt: string
}

export interface ConversationTurn {
  role: 'rep' | 'customer'
  text: string
  timestamp: number
}

export type AppTab = 'script' | 'train' | 'history'
