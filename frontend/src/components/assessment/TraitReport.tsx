import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TraitDetection } from '@/lib/api'

interface TraitReportProps {
  traits: TraitDetection[]
  score: number
  feedback: string
}

export function TraitReport({ traits, score, feedback }: TraitReportProps) {
  const detected = traits.filter((t) => t.detected).length
  const total = traits.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Hidden Trait Detection</span>
          <span className="text-sm font-normal text-muted-foreground">
            {detected}/{total} detected
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{feedback}</p>

        {traits.map((t) => (
          <div
            key={t.trait}
            className={`rounded-md p-3 ${
              t.detected ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <Badge variant={t.detected ? 'default' : 'destructive'} className="text-xs">
                {t.detected ? 'Detected' : 'Missed'}
              </Badge>
              <span className="text-sm font-medium capitalize">
                {t.trait.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t.evidence}</p>
            {t.detected && (
              <p className="mt-1 text-xs text-muted-foreground italic">
                Handling: {t.handling}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
