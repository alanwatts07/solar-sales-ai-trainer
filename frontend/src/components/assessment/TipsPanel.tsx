import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, Star, AlertTriangle } from 'lucide-react'

interface TipsPanelProps {
  tips: string[]
  highlight: string
  biggestMiss: string
}

export function TipsPanel({ tips, highlight, biggestMiss }: TipsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Coaching Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Highlight */}
        {highlight && highlight !== 'None' && (
          <div className="flex gap-3 rounded-md bg-green-500/10 p-3">
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="text-xs font-medium text-green-400">Best Moment</p>
              <p className="text-sm text-muted-foreground">{highlight}</p>
            </div>
          </div>
        )}

        {/* Biggest miss */}
        {biggestMiss && biggestMiss !== 'None' && (
          <div className="flex gap-3 rounded-md bg-red-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <p className="text-xs font-medium text-red-400">Biggest Miss</p>
              <p className="text-sm text-muted-foreground">{biggestMiss}</p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <p className="text-sm text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
