import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface CriteriaItem {
  label: string
  score: number
  grade: string
  feedback: string
}

interface CriteriaBreakdownProps {
  criteria: CriteriaItem[]
}

const gradeColor: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
}

export function CriteriaBreakdown({ criteria }: CriteriaBreakdownProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Performance Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {criteria.map((c) => (
          <div key={c.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">{c.label}</span>
              <span className={`text-sm font-bold ${gradeColor[c.grade] ?? ''}`}>
                {c.grade} ({c.score})
              </span>
            </div>
            <Progress value={c.score} className="mb-1 h-2" />
            <p className="text-xs text-muted-foreground">{c.feedback}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
