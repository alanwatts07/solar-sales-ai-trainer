import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScriptUploader } from '@/components/script-test/ScriptUploader'
import { RecordingPanel } from '@/components/script-test/RecordingPanel'
import { TranscriptDiff } from '@/components/script-test/TranscriptDiff'
import { AccuracyScore } from '@/components/script-test/AccuracyScore'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { transcribeAudio, gradeScript } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface GradingResult {
  accuracy_score: number
  matched_keywords: string[]
  missed_keywords: string[]
  incorrect_phrases: { expected: string; actual: string }[]
  semantic_feedback: string
  diff_segments: { type: string; text: string; expected?: string; actual?: string }[]
}

interface HealthInfo {
  stt_available: boolean
  stt_backend: string
  llm: { backend: string }
}

export function ScriptMaster() {
  const [goldenScript, setGoldenScript] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<GradingResult | null>(null)
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const recorder = useAudioRecorder()
  const { devices, selectedDeviceId, setSelectedDeviceId } = useAudioDevices()

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null))
  }, [])

  const handleStart = () => {
    setTranscriptPreview(null)
    setResult(null)
    recorder.startRecording(selectedDeviceId || undefined)
  }

  const handleStop = () => {
    recorder.stopRecording()
  }

  const handleSubmit = async () => {
    if (!goldenScript || !recorder.audioBlob) return

    setIsProcessing(true)
    setResult(null)
    setTranscriptPreview(null)
    try {
      // Step 1: Transcribe audio on server
      toast.info('Transcribing audio...')
      const { text } = await transcribeAudio(recorder.audioBlob)

      if (!text.trim()) {
        toast.error('No speech detected. Check your mic and try again.')
        return
      }

      setTranscriptPreview(text)

      // Step 2: Grade against golden script
      toast.info('Grading your attempt...')
      const grading = await gradeScript(goldenScript, text)
      setResult(grading)
      toast.success(`Score: ${grading.accuracy_score}%`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    recorder.reset()
    setResult(null)
    setTranscriptPreview(null)
  }

  const sttLabel = health?.stt_backend === 'whisper_api'
    ? 'Whisper API'
    : health?.stt_backend === 'local_whisper'
      ? 'Local Whisper'
      : health?.stt_available
        ? 'Ready'
        : 'Unavailable'

  const llmLabel = health?.llm.backend === 'anthropic_api'
    ? 'API'
    : health?.llm.backend === 'claude_cli'
      ? 'Claude CLI'
      : '...'

  return (
    <>
      <PageHeader title="Script Master" />
      <div className="space-y-4 p-4">
        {/* Backend status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={health?.stt_available ? 'default' : 'destructive'} className="text-xs">
            STT: {health ? sttLabel : '...'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            LLM: {llmLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {devices.length} mic{devices.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <ScriptUploader
          onScriptSet={setGoldenScript}
          onScriptClear={() => setGoldenScript(null)}
          currentScript={goldenScript}
        />

        {goldenScript && (
          <>
            <RecordingPanel
              isRecording={recorder.isRecording}
              duration={recorder.duration}
              audioLevel={recorder.audioLevel}
              hasRecording={!!recorder.audioBlob}
              isProcessing={isProcessing}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onDeviceChange={setSelectedDeviceId}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
              onSubmit={handleSubmit}
            />

            {/* Transcript preview */}
            {transcriptPreview && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="mb-1 text-xs font-medium text-muted-foreground">What you said:</p>
                <p className="text-foreground">{transcriptPreview}</p>
              </div>
            )}
          </>
        )}

        {result && (
          <>
            <AccuracyScore
              score={result.accuracy_score}
              matchedKeywords={result.matched_keywords}
              missedKeywords={result.missed_keywords}
              semanticFeedback={result.semantic_feedback}
            />
            <TranscriptDiff segments={result.diff_segments} />
          </>
        )}
      </div>
    </>
  )
}
