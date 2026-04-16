import { Button } from '@/components/ui/button'
import { Mic, Square, PhoneOff, Loader2, Send, MicOff } from 'lucide-react'
import { useState } from 'react'

interface AudioControlsProps {
  isRecording: boolean
  isProcessing: boolean
  audioLevel: number
  micError: string | null
  micPermission: string
  onStartRecording: () => void
  onStopRecording: () => void
  onRequestPermission: () => void
  onEndSession: () => void
  onSendText: (text: string) => void
}

export function AudioControls({
  isRecording,
  isProcessing,
  audioLevel,
  micError,
  micPermission,
  onStartRecording,
  onStopRecording,
  onRequestPermission,
  onEndSession,
  onSendText,
}: AudioControlsProps) {
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<'voice' | 'text'>(
    micPermission === 'denied' ? 'text' : 'voice'
  )

  const handleSendText = () => {
    if (!textInput.trim()) return
    onSendText(textInput.trim())
    setTextInput('')
  }

  const handleMicTap = () => {
    if (isProcessing) return
    if (isRecording) {
      onStopRecording()
    } else {
      onStartRecording()
    }
  }

  // Show permission request if denied or never asked
  const needsPermission = micPermission === 'denied' || micError?.includes('Permission')

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
        <div className="flex flex-col items-center gap-2">
          {/* Permission request */}
          {needsPermission ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <MicOff className="h-8 w-8 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                Microphone blocked by browser
              </p>
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                Tap the lock/settings icon in your browser's address bar, find "Microphone", and set it to "Allow". Then reload the page.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onRequestPermission}>
                  Try Again
                </Button>
                <Button size="sm" onClick={() => setInputMode('text')}>
                  Use Text Instead
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4">
                <Button size="sm" variant="destructive" onClick={onEndSession}>
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End
                </Button>

                {/* Tap-toggle mic button */}
                <button
                  onClick={handleMicTap}
                  disabled={isProcessing}
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                    isRecording
                      ? 'scale-110 bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : isProcessing
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground active:scale-95'
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

              {/* Status */}
              <p className="text-xs text-muted-foreground">
                {isProcessing
                  ? 'Processing...'
                  : isRecording
                    ? 'Tap stop when done'
                    : 'Tap mic to record'}
              </p>
            </>
          )}

          {/* Error display */}
          {micError && (
            <p className="max-w-xs text-center font-mono text-xs text-red-400">{micError}</p>
          )}
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
