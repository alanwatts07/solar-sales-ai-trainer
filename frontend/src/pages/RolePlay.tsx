import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DifficultySelect } from '@/components/roleplay/DifficultySelect'
import { VoiceSelect } from '@/components/roleplay/VoiceSelect'
import { ConversationView } from '@/components/roleplay/ConversationView'
import { AudioControls } from '@/components/roleplay/AudioControls'
import { Badge } from '@/components/ui/badge'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { playResponse } from '@/lib/audio'
import {
  getPersonalities,
  startSession,
  sendTurn,
  endSession,
  transcribeAudio,
  type Personality,
  type StartSessionResponse,
} from '@/lib/api'
import { toast } from 'sonner'

type Phase = 'difficulty' | 'voice' | 'session' | 'ended'

interface ChatMessage {
  role: 'rep' | 'customer'
  text: string
}

export function RolePlay() {
  const [phase, setPhase] = useState<Phase>('difficulty')
  const [personalities, setPersonalities] = useState<Personality[]>([])
  const [difficulty, setDifficulty] = useState('')
  const [session, setSession] = useState<StartSessionResponse | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const recorder = useAudioRecorder()
  const { devices, selectedDeviceId, setSelectedDeviceId } = useAudioDevices()

  // Fetch personalities on mount
  useEffect(() => {
    getPersonalities()
      .then((data) => setPersonalities(data.personalities))
      .catch(() => toast.error('Failed to load personalities'))
  }, [])

  const handleDifficultySelect = (d: string) => {
    setDifficulty(d)
    setPhase('voice')
  }

  const handleVoiceSelect = async (personalityId: string) => {
    setIsProcessing(true)
    try {
      toast.info('Starting session...')
      const sess = await startSession(personalityId, difficulty)
      setSession(sess)
      setMessages([{ role: 'customer', text: sess.greeting }])
      setPhase('session')

      // Play the greeting
      setIsSpeaking(true)
      await playResponse(sess.greeting, sess.greeting_audio)
      setIsSpeaking(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendText = async (text: string) => {
    if (!session || isProcessing) return

    setMessages((prev) => [...prev, { role: 'rep', text }])
    setIsProcessing(true)
    try {
      const response = await sendTurn(session.session_id, text)
      setMessages((prev) => [...prev, { role: 'customer', text: response.reply }])

      // Play AI response
      setIsSpeaking(true)
      await playResponse(response.reply, response.reply_audio)
      setIsSpeaking(false)

      if (response.session_ended) {
        toast.info('Session ended. Nice work!')
        setPhase('ended')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Turn failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVoiceSend = async () => {
    if (!recorder.audioBlob || !session) return

    setIsProcessing(true)
    try {
      // Transcribe the recording
      const { text } = await transcribeAudio(recorder.audioBlob)
      if (!text.trim()) {
        toast.error('No speech detected')
        return
      }
      recorder.reset()
      // Send as a turn
      await handleSendText(text)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStopRecording = () => {
    recorder.stopRecording()
    // Auto-submit after stopping
    setTimeout(handleVoiceSend, 300)
  }

  const handleEndSession = async () => {
    if (session) {
      try {
        await endSession(session.session_id)
      } catch {
        // Session might already be ended
      }
    }
    setPhase('ended')
  }

  const handleRestart = () => {
    setPhase('difficulty')
    setSession(null)
    setMessages([])
    setDifficulty('')
  }

  return (
    <>
      <PageHeader title="Training" />
      <div className="flex h-[calc(100svh-3.5rem-4.5rem)] flex-col">
        {phase === 'difficulty' && (
          <div className="flex-1 overflow-y-auto p-4">
            <DifficultySelect onSelect={handleDifficultySelect} />
          </div>
        )}

        {phase === 'voice' && (
          <div className="flex-1 overflow-y-auto p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 pt-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Starting session...</p>
              </div>
            ) : (
              <VoiceSelect personalities={personalities} onSelect={handleVoiceSelect} />
            )}
          </div>
        )}

        {phase === 'session' && session && (
          <>
            {/* Session header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <Badge variant="secondary" className="text-xs">
                {session.personality.name}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {session.difficulty}
              </Badge>
              {isSpeaking && (
                <Badge className="text-xs">Speaking...</Badge>
              )}
              {/* Device selector */}
              {devices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="ml-auto max-w-[120px] rounded border border-input bg-background px-1 py-0.5 text-xs"
                  disabled={recorder.isRecording}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label.slice(0, 20)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto p-4">
              <ConversationView messages={messages} isWaiting={isProcessing} />
            </div>

            {/* Input controls */}
            <AudioControls
              isRecording={recorder.isRecording}
              isProcessing={isProcessing || isSpeaking}
              audioLevel={recorder.audioLevel}
              onStartRecording={() => recorder.startRecording(selectedDeviceId || undefined)}
              onStopRecording={handleStopRecording}
              onEndSession={handleEndSession}
              onSendText={handleSendText}
            />
          </>
        )}

        {phase === 'ended' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            <h2 className="text-lg font-semibold">Session Complete</h2>
            <p className="text-center text-sm text-muted-foreground">
              {messages.length} messages exchanged
              {session && ` with ${session.personality.name}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Train Again
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
