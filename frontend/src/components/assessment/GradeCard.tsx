import { Card, CardContent } from '@/components/ui/card'

interface GradeCardProps {
  grade: string
  score: number
  summary: string
}

const gradeColors: Record<string, string> = {
  A: 'text-green-400 border-green-500/30',
  B: 'text-blue-400 border-blue-500/30',
  C: 'text-yellow-400 border-yellow-500/30',
  D: 'text-orange-400 border-orange-500/30',
  F: 'text-red-400 border-red-500/30',
}

export function GradeCard({ grade, score, summary }: GradeCardProps) {
  const color = gradeColors[grade] ?? gradeColors['C']

  return (
    <Card className={`border-2 ${color.split(' ')[1]}`}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`text-6xl font-bold ${color.split(' ')[0]}`}>
          {grade}
        </div>
        <div className="flex-1">
          <p className="text-2xl font-semibold tabular-nums">{score}/100</p>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  )
}
