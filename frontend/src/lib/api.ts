const BASE = '/api'

export async function uploadScript(content: string, title: string) {
  const res = await fetch(`${BASE}/scripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, title }),
  })
  if (!res.ok) throw new Error('Failed to upload script')
  return res.json()
}

export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  const res = await fetch(`${BASE}/transcribe`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Transcription failed')
  return res.json()
}

export async function gradeScript(goldenScript: string, transcript: string) {
  const res = await fetch(`${BASE}/scripts/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ golden_script: goldenScript, transcript }),
  })
  if (!res.ok) throw new Error('Grading failed')
  return res.json()
}

// --- Role-play API ---

export interface StartSessionResponse {
  session_id: string
  customer_name: string
  difficulty: string
  greeting: string
  greeting_audio: string | null
  tts_mode: string
}

export interface TurnResponse {
  reply: string
  reply_audio: string | null
  turn_number: number
  session_ended: boolean
  tts_mode: string
}

export interface HiddenTrait {
  trait: string
  description: string
  hint: string
}

export interface GradingContext {
  customer_name: string
  difficulty: string
  hidden_traits: HiddenTrait[]
  objections: { text: string; skill: string }[]
  emotional_state: string
}

export interface EndSessionResponse {
  transcript: { role: string; content: string }[]
  turn_count: number
  grading_context: GradingContext
}

export async function getRoleplayConfig(): Promise<{
  difficulties: { id: string; label: string; desc: string }[]
  tts_available: boolean
}> {
  const res = await fetch(`${BASE}/roleplay/config`)
  if (!res.ok) throw new Error('Failed to fetch config')
  return res.json()
}

export async function startSession(difficulty: string): Promise<StartSessionResponse> {
  const res = await fetch(`${BASE}/roleplay/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty }),
  })
  if (!res.ok) throw new Error('Failed to start session')
  return res.json()
}

export async function sendTurn(sessionId: string, text: string): Promise<TurnResponse> {
  const res = await fetch(`${BASE}/roleplay/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, text }),
  })
  if (!res.ok) throw new Error('Failed to send turn')
  return res.json()
}

export async function endSession(sessionId: string): Promise<EndSessionResponse> {
  const res = await fetch(`${BASE}/roleplay/end/${sessionId}`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to end session')
  return res.json()
}

// --- Assessment API ---

export interface TraitDetection {
  trait: string
  detected: boolean
  evidence: string
  handling: string
}

export interface ObjectionGrade {
  objection: string
  skill_tested: string
  handled: boolean
  quality: string
  notes: string
}

export interface CategoryScore {
  score: number
  grade: string
  feedback: string
}

export interface Assessment {
  overall_grade: string
  overall_score: number
  overall_summary: string
  trait_detection: CategoryScore & { detected: TraitDetection[] }
  objection_handling: CategoryScore & { per_objection: ObjectionGrade[] }
  empathy: CategoryScore
  closing_skills: CategoryScore
  conversation_flow: CategoryScore
  tips: string[]
  highlight_moment: string
  biggest_miss: string
}

export async function assessSession(
  transcript: { role: string; content: string }[],
  gradingContext: GradingContext,
): Promise<Assessment> {
  const res = await fetch(`${BASE}/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, grading_context: gradingContext }),
  })
  if (!res.ok) throw new Error('Assessment failed')
  return res.json()
}
