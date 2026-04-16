import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface AccuracyScoreProps {
  score: number
  matchedKeywords: string[]
  missedKeywords: string[]
  semanticFeedback: string
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-400'
  if (score >= 70) return 'text-yellow-400'
  return 'text-red-400'
}

export function AccuracyScore({
  score,
  matchedKeywords,
  missedKeywords,
  semanticFeedback,
}: AccuracyScoreProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Accuracy Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big score */}
        <div className="flex items-center gap-4">
          <span className={`text-5xl font-bold tabular-nums ${getScoreColor(score)}`}>
            {score}%
          </span>
          <div className="flex-1">
            <Progress value={score} className="h-3" />
          </div>
        </div>

        {/* Missed keywords */}
        {missedKeywords.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Missed Keywords
            </p>
            <div className="flex flex-wrap gap-1">
              {missedKeywords.map((kw) => (
                <Badge key={kw} variant="destructive" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Matched keywords */}
        {matchedKeywords.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Matched Keywords
            </p>
            <div className="flex flex-wrap gap-1">
              {matchedKeywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Semantic feedback */}
        {semanticFeedback && (
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            {semanticFeedback}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
