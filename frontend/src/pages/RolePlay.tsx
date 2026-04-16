import { useState, useEffect, useCallback, useRef } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DifficultySelect } from '@/components/roleplay/DifficultySelect'
import { ConversationView } from '@/components/roleplay/ConversationView'
import { AudioControls } from '@/components/roleplay/AudioControls'
import { GradeCard } from '@/components/assessment/GradeCard'
import { CriteriaBreakdown } from '@/components/assessment/CriteriaBreakdown'
import { TraitReport } from '@/components/assessment/TraitReport'
import { ObjectionReport } from '@/components/assessment/ObjectionReport'
import { TipsPanel } from '@/components/assessment/TipsPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { playResponse } from '@/lib/audio'
import { RefreshCw } from 'lucide-react'
import {
  startSession,
  sendTurn,
  endSession,
  transcribeAudio,
  assessSession,
  type StartSessionResponse,
  type GradingContext,
  type Assessment,
} from '@/lib/api'
import { toast } from 'sonner'

type Phase = 'difficulty' | 'session' | 'grading' | 'results'

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
  const [transcript, setTranscript] = useState<{ role: string; content: string }[]>([])
  const [gradingContext, setGradingContext] = useState<GradingContext | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)

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
        toast.info('Customer ended the conversation. Grading...')
        await handleEndSession()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Turn failed')
    } finally {
      setIsProcessing(false)
    }
  }, [session, isProcessing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit voice when audioBlob ready
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
    setPhase('grading')

    try {
      const result = await endSession(session.session_id)
      setTranscript(result.transcript)
      setGradingContext(result.grading_context)

      // Now run the AI assessment
      toast.info('AI is grading your performance...')
      const grade = await assessSession(result.transcript, result.grading_context)
      setAssessment(grade)
      setPhase('results')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assessment failed')
      setPhase('results')
    }
  }

  const handleRestart = () => {
    setPhase('difficulty')
    setSession(null)
    setMessages([])
    setGradingContext(null)
    setAssessment(null)
    setTranscript([])
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

        {/* --- Grading in progress --- */}
        {phase === 'grading' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">Analyzing your performance...</p>
            <p className="text-xs text-muted-foreground">
              Checking trait detection, objection handling, empathy, and more
            </p>
          </div>
        )}

        {/* --- Results --- */}
        {phase === 'results' && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-8">
            {assessment ? (
              <>
                {/* Overall grade */}
                <GradeCard
                  grade={assessment.overall_grade}
                  score={assessment.overall_score}
                  summary={assessment.overall_summary}
                />

                {/* Category breakdown */}
                <CriteriaBreakdown
                  criteria={[
                    { label: 'Trait Detection', ...assessment.trait_detection },
                    { label: 'Objection Handling', ...assessment.objection_handling },
                    { label: 'Empathy', ...assessment.empathy },
                    { label: 'Closing Skills', ...assessment.closing_skills },
                    { label: 'Conversation Flow', ...assessment.conversation_flow },
                  ]}
                />

                {/* Hidden trait report */}
                <TraitReport
                  traits={assessment.trait_detection.detected}
                  score={assessment.trait_detection.score}
                  feedback={assessment.trait_detection.feedback}
                />

                {/* Objection report */}
                <ObjectionReport
                  objections={assessment.objection_handling.per_objection}
                  score={assessment.objection_handling.score}
                  feedback={assessment.objection_handling.feedback}
                />

                {/* Tips */}
                <TipsPanel
                  tips={assessment.tips}
                  highlight={assessment.highlight_moment}
                  biggestMiss={assessment.biggest_miss}
                />
              </>
            ) : (
              <div className="pt-20 text-center">
                <p className="text-sm text-muted-foreground">
                  Assessment unavailable. Session data may have been lost.
                </p>
              </div>
            )}

            <div className="flex justify-center">
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
