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

export async function gradeScript(
  goldenScript: string,
  transcript: string,
) {
  const res = await fetch(`${BASE}/scripts/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ golden_script: goldenScript, transcript }),
  })
  if (!res.ok) throw new Error('Grading failed')
  return res.json()
}

// --- Role-play API ---

export interface Personality {
  id: string
  name: string
  description: string
  voice_style: string
  traits: string
}

export interface StartSessionResponse {
  session_id: string
  personality: Personality
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

export async function getPersonalities(): Promise<{
  personalities: Personality[]
  difficulties: string[]
  tts_available: boolean
}> {
  const res = await fetch(`${BASE}/roleplay/personalities`)
  if (!res.ok) throw new Error('Failed to fetch personalities')
  return res.json()
}

export async function startSession(
  personality: string,
  difficulty: string,
): Promise<StartSessionResponse> {
  const res = await fetch(`${BASE}/roleplay/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personality, difficulty }),
  })
  if (!res.ok) throw new Error('Failed to start session')
  return res.json()
}

export async function sendTurn(
  sessionId: string,
  text: string,
): Promise<TurnResponse> {
  const res = await fetch(`${BASE}/roleplay/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, text }),
  })
  if (!res.ok) throw new Error('Failed to send turn')
  return res.json()
}

export async function endSession(sessionId: string) {
  const res = await fetch(`${BASE}/roleplay/end/${sessionId}`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to end session')
  return res.json()
}
