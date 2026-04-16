import { Card, CardContent } from '@/components/ui/card'
import type { Personality } from '@/lib/api'

interface VoiceSelectProps {
  personalities: Personality[]
  onSelect: (id: string) => void
}

const icons: Record<string, string> = {
  skeptical_steve: '🤨',
  busy_barbara: '⏱️',
  friendly_frank: '😊',
  hostile_helen: '😤',
  analytical_alex: '🔬',
}

export function VoiceSelect({ personalities, onSelect }: VoiceSelectProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-center text-lg font-semibold">Choose Customer</h2>
      <div className="space-y-2">
        {personalities.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer border-2 border-border transition-colors hover:border-primary"
            onClick={() => onSelect(p.id)}
          >
            <CardContent className="flex items-start gap-3 py-4">
              <span className="text-2xl">{icons[p.id] ?? '👤'}</span>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
