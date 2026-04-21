import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DifficultySelect } from '@/components/roleplay/DifficultySelect'
import { DoorSelector } from '@/components/roleplay/doors/DoorSelector'
import { ConversationView } from '@/components/roleplay/ConversationView'
import { GradeCard } from '@/components/assessment/GradeCard'
import { CriteriaBreakdown } from '@/components/assessment/CriteriaBreakdown'
import { TraitReport } from '@/components/assessment/TraitReport'
import { ObjectionReport } from '@/components/assessment/ObjectionReport'
import { TipsPanel } from '@/components/assessment/TipsPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAutoListen } from '@/hooks/useAutoListen'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { playResponse, playKnockSound } from '@/lib/audio'
import { RefreshCw, PhoneOff, Mic, Square } from 'lucide-react'
import {
  startSession,
  sendTurn,
  endSession,
  transcribeAudio,
  assessSession,
  type StartSessionResponse,
  type Assessment,
} from '@/lib/api'
import { toast } from 'sonner'

type Phase = 'difficulty' | 'door' | 'session' | 'grading' | 'results'

interface ChatMessage {
  role: 'rep' | 'customer'
  text: string
}

export function RolePlay() {
  const [phase, setPhase] = useState<Phase>('difficulty')
  const [difficulty, setDifficulty] = useState('')
  const [session, setSession] = useState<StartSessionResponse | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const sessionRef = useRef<StartSessionResponse | null>(null)

  const listen = useAutoListen()
  const { selectedDeviceId } = useAudioDevices()

  // Keep sessionRef in sync
  useEffect(() => { sessionRef.current = session }, [session])

  // Auto-submit when audioBlob appears from silence detection
  useEffect(() => {
    if (!listen.audioBlob || !sessionRef.current || isProcessing) return

    const submit = async () => {
      setIsProcessing(true)
      try {
        toast.info('Transcribing...')
        const { text } = await transcribeAudio(listen.audioBlob!)
        if (!text.trim()) {
          toast.error('No speech detected')
          listen.resetAndContinue()
          setIsProcessing(false)
          return
        }

        setMessages((prev) => [...prev, { role: 'rep', text }])

        const response = await sendTurn(sessionRef.current!.session_id, text)
        setMessages((prev) => [...prev, { role: 'customer', text: response.reply }])

        setIsSpeaking(true)
        await playResponse(response.reply, response.reply_audio)
        setIsSpeaking(false)

        if (response.session_ended) {
          toast.info('Customer ended the conversation.')
          await handleEndSession()
        } else {
          // Resume listening for next turn
          listen.resetAndContinue()
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Turn failed')
        listen.resetAndContinue()
      } finally {
        setIsProcessing(false)
      }
    }
    submit()
  }, [listen.audioBlob]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDifficultySelect = (d: string) => {
    setDifficulty(d)
    setPhase('door')
  }

  const handleDoorKnock = async () => {
    // Play knock sound (this is the user gesture for mic permission)
    await playKnockSound()

    // Request mic permission inside this click handler
    try {
      await listen.startListening(selectedDeviceId || undefined)
    } catch {
      toast.error('Microphone access required')
      return
    }

    // Start the session (no AI greeting -- rep speaks first)
    try {
      const sess = await startSession(difficulty)
      setSession(sess)
      setMessages([])
      setPhase('session')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start session')
      listen.stopListening()
    }
  }

  const handleEndSession = async () => {
    listen.stopListening()
    if (!sessionRef.current) return
    setPhase('grading')

    try {
      const result = await endSession(sessionRef.current.session_id)
      toast.info('Grading your performance...')
      const grade = await assessSession(result.transcript, result.grading_context, result.session_id)
      setAssessment(grade)
      setPhase('results')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assessment failed')
      setPhase('results')
    }
  }

  const handleManualStop = () => {
    listen.forceStop()
  }

  const handleRestart = () => {
    listen.stopListening()
    setPhase('difficulty')
    setSession(null)
    setMessages([])
    setDifficulty('')
    setAssessment(null)
  }

  return (
    <>
      <PageHeader title="Training" />
      <div className="flex h-[calc(100svh-3.5rem-4.5rem)] flex-col">

        {/* --- Difficulty --- */}
        {phase === 'difficulty' && (
          <div className="flex-1 overflow-y-auto p-4">
            <DifficultySelect onSelect={handleDifficultySelect} />
          </div>
        )}

        {/* --- Door --- */}
        {phase === 'door' && (
          <div className="flex flex-1 flex-col p-4">
            <Badge variant="secondary" className="mx-auto mb-4 text-xs capitalize">
              {difficulty} mode
            </Badge>
            <DoorSelector onKnock={handleDoorKnock} />
          </div>
        )}

        {/* --- Session --- */}
        {phase === 'session' && session && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <Badge variant="secondary" className="text-xs">
                {session.customer_name}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {difficulty}
              </Badge>
              {isSpeaking && <Badge className="text-xs">Speaking...</Badge>}
              {listen.isSpeaking && !isProcessing && (
                <Badge variant="default" className="text-xs">Listening...</Badge>
              )}
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 && !isProcessing && (
                <div className="flex flex-col items-center gap-2 pt-12 text-center">
                  <Mic className="h-8 w-8 text-red-500 animate-pulse" />
                  <p className="text-lg font-bold text-red-500 animate-pulse">SPEAK NOW</p>
                  <p className="text-xs text-muted-foreground">
                    Introduce yourself. I'll send it when you pause for 4 seconds.
                  </p>
                </div>
              )}
              <ConversationView messages={messages} isWaiting={isProcessing} />

              {/* "SPEAK" prompt after AI finishes */}
              {messages.length > 0 && !isProcessing && !isSpeaking && !listen.isSpeaking && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Mic className="h-5 w-5 text-red-500 animate-pulse" />
                  <span className="text-lg font-bold text-red-500 animate-pulse">SPEAK</span>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <Button size="sm" variant="destructive" onClick={handleEndSession}>
                <PhoneOff className="mr-2 h-4 w-4" /> End
              </Button>

              {/* Audio level + countdown */}
              <div className="flex items-center gap-3">
                {listen.silenceCountdown > 0 && (
                  <span className="text-sm font-mono text-yellow-400 tabular-nums">
                    Sending in {listen.silenceCountdown}...
                  </span>
                )}

                {/* Level bars */}
                <div className="flex h-8 items-end gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        listen.isSpeaking ? 'bg-green-500' : 'bg-muted-foreground/30'
                      }`}
                      style={{
                        height: `${Math.max(4, Math.min(32, listen.audioLevel * (0.5 + i * 0.2)))}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Manual stop */}
                {listen.isSpeaking && (
                  <button
                    onClick={handleManualStop}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Error */}
              {listen.error && (
                <p className="text-xs text-red-400">{listen.error}</p>
              )}
            </div>
          </>
        )}

        {/* --- Grading --- */}
        {phase === 'grading' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">Analyzing your performance...</p>
          </div>
        )}

        {/* --- Results --- */}
        {phase === 'results' && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-8">
            {assessment ? (
              <>
                <GradeCard
                  grade={assessment.overall_grade}
                  score={assessment.overall_score}
                  summary={assessment.overall_summary}
                />
                <CriteriaBreakdown
                  criteria={[
                    { label: 'Trait Detection', ...assessment.trait_detection },
                    { label: 'Objection Handling', ...assessment.objection_handling },
                    { label: 'Empathy', ...assessment.empathy },
                    { label: 'Closing Skills', ...assessment.closing_skills },
                    { label: 'Conversation Flow', ...assessment.conversation_flow },
                  ]}
                />
                <TraitReport
                  traits={assessment.trait_detection.detected}
                  score={assessment.trait_detection.score}
                  feedback={assessment.trait_detection.feedback}
                />
                <ObjectionReport
                  objections={assessment.objection_handling.per_objection}
                  score={assessment.objection_handling.score}
                  feedback={assessment.objection_handling.feedback}
                />
                <TipsPanel
                  tips={assessment.tips}
                  highlight={assessment.highlight_moment}
                  biggestMiss={assessment.biggest_miss}
                />
              </>
            ) : (
              <p className="pt-20 text-center text-sm text-muted-foreground">
                Assessment unavailable.
              </p>
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
