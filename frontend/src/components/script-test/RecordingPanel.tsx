import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Square, RotateCcw, Loader2, Settings } from 'lucide-react'
import type { AudioDevice } from '@/hooks/useAudioDevices'

interface RecordingPanelProps {
  isRecording: boolean
  duration: number
  audioLevel: number
  hasRecording: boolean
  isProcessing: boolean
  devices: AudioDevice[]
  selectedDeviceId: string
  onDeviceChange: (deviceId: string) => void
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onSubmit: () => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function RecordingPanel({
  isRecording,
  duration,
  audioLevel,
  hasRecording,
  isProcessing,
  devices,
  selectedDeviceId,
  onDeviceChange,
  onStart,
  onStop,
  onReset,
  onSubmit,
}: RecordingPanelProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        {/* Device selector */}
        {devices.length > 0 && (
          <div className="flex w-full items-center gap-2">
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select
              value={selectedDeviceId}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              disabled={isRecording}
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Big mic button */}
        <button
          onClick={isRecording ? onStop : onStart}
          disabled={isProcessing}
          className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
            isRecording
              ? 'animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          {isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>

        {/* Audio level meter */}
        {isRecording && (
          <div className="flex w-full max-w-xs items-center gap-2">
            <span className="text-xs text-muted-foreground">Level</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  audioLevel > 5 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(audioLevel, 100)}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-xs text-muted-foreground">
              {audioLevel}
            </span>
          </div>
        )}

        {/* Timer */}
        <p className="font-mono text-2xl tabular-nums">
          {formatTime(duration)}
        </p>

        {/* Status text */}
        <p className="text-sm text-muted-foreground">
          {isProcessing
            ? 'Transcribing & grading...'
            : isRecording
              ? audioLevel > 5
                ? 'Recording... Tap to stop'
                : 'Recording but no audio detected - check mic'
              : hasRecording
                ? 'Recording ready'
                : 'Tap to start recording'}
        </p>

        {/* Action buttons */}
        {hasRecording && !isRecording && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Redo
            </Button>
            <Button size="sm" onClick={onSubmit} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grade It
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
