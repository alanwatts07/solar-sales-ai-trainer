import { useState, useEffect, useCallback, useRef } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DifficultySelect } from '@/components/roleplay/DifficultySelect'
import { ConversationView } from '@/components/roleplay/ConversationView'
import { AudioControls } from '@/components/roleplay/AudioControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { playResponse } from '@/lib/audio'
import { RefreshCw, Eye } from 'lucide-react'
import {
  startSession,
  sendTurn,
  endSession,
  transcribeAudio,
  type StartSessionResponse,
  type GradingContext,
} from '@/lib/api'
import { toast } from 'sonner'

type Phase = 'difficulty' | 'session' | 'reveal'

interface ChatMessage {
  role: 'rep' | 'customer'
  text: string
}

export function RolePlay() {
  const [phase, setPhase] = useState<Phase>('difficulty')
  const [session, setSession] = useState<StartSessionResponse | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [gradingContext, setGradingContext] = useState<GradingContext | null>(null)

  const recorder = useAudioRecorder()
  const { devices, selectedDeviceId, setSelectedDeviceId } = useAudioDevices()
  const pendingVoiceSend = useRef(false)

  const handleDifficultySelect = async (difficulty: string) => {
    setIsStarting(true)
    try {
      toast.info('Generating a customer for you...')
      const sess = await startSession(difficulty)
      setSession(sess)
      setMessages([{ role: 'customer', text: sess.greeting }])
      setPhase('session')

      setIsSpeaking(true)
      await playResponse(sess.greeting, sess.greeting_audio)
      setIsSpeaking(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start. Is the backend running?')
    } finally {
      setIsStarting(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSendText = useCallback(async (text: string) => {
    if (!session || isProcessing) return

    setMessages((prev) => [...prev, { role: 'rep', text }])
    setIsProcessing(true)
    try {
      const response = await sendTurn(session.session_id, text)
      setMessages((prev) => [...prev, { role: 'customer', text: response.reply }])

      setIsSpeaking(true)
      await playResponse(response.reply, response.reply_audio)
      setIsSpeaking(false)

      if (response.session_ended) {
        toast.info('Customer ended the conversation.')
        await handleEndSession()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Turn failed')
    } finally {
      setIsProcessing(false)
    }
  }, [session, isProcessing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit voice when audioBlob becomes available
  useEffect(() => {
    if (!pendingVoiceSend.current || !recorder.audioBlob || !session) return
    pendingVoiceSend.current = false

    const submitVoice = async () => {
      setIsProcessing(true)
      try {
        toast.info('Transcribing...')
        const { text } = await transcribeAudio(recorder.audioBlob!)
        if (!text.trim()) {
          toast.error('No speech detected')
          setIsProcessing(false)
          return
        }
        recorder.reset()
        await handleSendText(text)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Transcription failed')
        setIsProcessing(false)
      }
    }
    submitVoice()
  }, [recorder.audioBlob]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStopRecording = () => {
    pendingVoiceSend.current = true
    recorder.stopRecording()
  }

  const handleEndSession = async () => {
    if (!session) return
    try {
      const result = await endSession(session.session_id)
      setGradingContext(result.grading_context)
      setPhase('reveal')
    } catch {
      setPhase('reveal')
    }
  }

  const handleRestart = () => {
    setPhase('difficulty')
    setSession(null)
    setMessages([])
    setGradingContext(null)
  }

  return (
    <>
      <PageHeader title="Training" />
      <div className="flex h-[calc(100svh-3.5rem-4.5rem)] flex-col">

        {/* --- Pick Difficulty --- */}
        {phase === 'difficulty' && (
          <div className="flex-1 overflow-y-auto p-4">
            {isStarting ? (
              <div className="flex flex-col items-center gap-3 pt-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Generating your customer...</p>
              </div>
            ) : (
              <DifficultySelect onSelect={handleDifficultySelect} />
            )}
          </div>
        )}

        {/* --- Live Session --- */}
        {phase === 'session' && session && (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <Badge variant="secondary" className="text-xs">
                {session.customer_name}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {session.difficulty}
              </Badge>
              {isSpeaking && <Badge className="text-xs">Speaking...</Badge>}
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

            <div className="flex-1 overflow-y-auto p-4">
              <ConversationView messages={messages} isWaiting={isProcessing} />
            </div>

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

        {/* --- Post-Session Reveal --- */}
        {phase === 'reveal' && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="text-center">
              <Eye className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h2 className="text-lg font-semibold">Session Reveal</h2>
              <p className="text-sm text-muted-foreground">
                Here's who you were actually talking to
              </p>
            </div>

            {gradingContext && (
              <>
                {/* Customer profile */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {gradingContext.customer_name} ({gradingContext.difficulty})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Mood: {gradingContext.emotional_state}
                  </CardContent>
                </Card>

                {/* Hidden traits reveal */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Hidden Traits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gradingContext.hidden_traits.map((t) => (
                      <div key={t.trait} className="rounded-md bg-muted/50 p-3">
                        <p className="text-sm font-medium capitalize">
                          {t.trait.replace(/_/g, ' ')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          Clue: {t.hint}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Objections used */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Objections Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {gradingContext.objections.map((o, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="shrink-0 text-xs capitalize">
                            {o.skill.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-muted-foreground">{o.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Conversation recap */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Conversation ({messages.length} messages)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {messages.map((m, i) => (
                        <p key={i} className="text-xs">
                          <span className={m.role === 'rep' ? 'font-medium text-primary' : 'font-medium'}>
                            {m.role === 'rep' ? 'You' : gradingContext.customer_name}:
                          </span>{' '}
                          <span className="text-muted-foreground">{m.text}</span>
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex justify-center pb-4">
              <Button onClick={handleRestart}>
                <RefreshCw className="mr-2 h-4 w-4" /> Train Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
