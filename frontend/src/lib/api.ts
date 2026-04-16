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
): Promise<{
  accuracy_score: number
  matched_keywords: string[]
  missed_keywords: string[]
  incorrect_phrases: { expected: string; actual: string }[]
  semantic_feedback: string
  diff_segments: { type: string; text: string; expected?: string; actual?: string }[]
}> {
  const res = await fetch(`${BASE}/scripts/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ golden_script: goldenScript, transcript }),
  })
  if (!res.ok) throw new Error('Grading failed')
  return res.json()
}
