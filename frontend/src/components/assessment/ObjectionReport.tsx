import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ObjectionGrade } from '@/lib/api'

interface ObjectionReportProps {
  objections: ObjectionGrade[]
  score: number
  feedback: string
}

const qualityColor: Record<string, string> = {
  excellent: 'bg-green-500/20 text-green-400',
  good: 'bg-blue-500/20 text-blue-400',
  fair: 'bg-yellow-500/20 text-yellow-400',
  poor: 'bg-red-500/20 text-red-400',
}

export function ObjectionReport({ objections, score, feedback }: ObjectionReportProps) {
  const handled = objections.filter((o) => o.handled).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Objection Handling</span>
          <span className="text-sm font-normal text-muted-foreground">
            {handled}/{objections.length} handled
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{feedback}</p>

        {objections.map((o, i) => (
          <div key={i} className="rounded-md border border-border p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge
                className={`text-xs ${qualityColor[o.quality] ?? ''}`}
                variant="secondary"
              >
                {o.quality}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {o.skill_tested.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-sm">"{o.objection}"</p>
            <p className="mt-1 text-xs text-muted-foreground">{o.notes}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
