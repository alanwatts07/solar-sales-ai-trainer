import { Card, CardContent } from '@/components/ui/card'

interface GradeCardProps {
  grade: string
  score: number
  summary: string
}

const gradeStyles: Record<string, { text: string; glow: string }> = {
  A: { text: 'text-green-400', glow: 'shadow-[0_0_30px_oklch(0.7_0.2_145_/_25%)]' },
  B: { text: 'text-blue-400', glow: 'shadow-[0_0_30px_oklch(0.6_0.2_250_/_25%)]' },
  C: { text: 'text-yellow-400', glow: 'shadow-[0_0_30px_oklch(0.8_0.15_85_/_25%)]' },
  D: { text: 'text-orange-400', glow: 'shadow-[0_0_30px_oklch(0.7_0.18_55_/_25%)]' },
  F: { text: 'text-red-400', glow: 'shadow-[0_0_30px_oklch(0.65_0.2_25_/_25%)]' },
}

export function GradeCard({ grade, score, summary }: GradeCardProps) {
  const style = gradeStyles[grade] ?? gradeStyles['C']

  return (
    <Card className={`border border-white/10 ${style.glow}`}>
      <CardContent className="flex items-center gap-5 pt-6">
        <div className={`text-6xl font-extralight ${style.text}`}>
          {grade}
        </div>
        <div className="flex-1">
          <p className="text-2xl font-light tabular-nums">{score}/100</p>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  )
}
