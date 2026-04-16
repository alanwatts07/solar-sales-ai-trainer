import { Button } from '@/components/ui/button'
import { Mic, Square, PhoneOff, Loader2, Send } from 'lucide-react'
import { useState } from 'react'

interface AudioControlsProps {
  isRecording: boolean
  isProcessing: boolean
  audioLevel: number
  onStartRecording: () => void
  onStopRecording: () => void
  onEndSession: () => void
  // Text input fallback
  onSendText: (text: string) => void
}

export function AudioControls({
  isRecording,
  isProcessing,
  audioLevel,
  onStartRecording,
  onStopRecording,
  onEndSession,
  onSendText,
}: AudioControlsProps) {
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice')

  const handleSendText = () => {
    if (!textInput.trim()) return
    onSendText(textInput.trim())
    setTextInput('')
  }

  return (
    <div className="space-y-2 border-t border-border bg-background p-4">
      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setInputMode('voice')}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            inputMode === 'voice' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Voice
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            inputMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Type
        </button>
      </div>

      {inputMode === 'voice' ? (
        <div className="flex items-center justify-center gap-4">
          <Button size="sm" variant="destructive" onClick={onEndSession}>
            <PhoneOff className="mr-2 h-4 w-4" />
            End
          </Button>

          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isProcessing}
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
              isRecording
                ? 'animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/30'
                : isProcessing
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
            } disabled:opacity-50`}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isRecording ? (
              <Square className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>

          {/* Level indicator */}
          <div className="w-12 text-center">
            {isRecording && (
              <div className="flex h-8 items-end justify-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-green-500 transition-all duration-75"
                    style={{
                      height: `${Math.max(4, Math.min(32, audioLevel * (0.5 + i * 0.2)))}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Type your sales pitch..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={isProcessing}
          />
          <Button size="sm" onClick={handleSendText} disabled={isProcessing || !textInput.trim()}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="destructive" onClick={onEndSession}>
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
