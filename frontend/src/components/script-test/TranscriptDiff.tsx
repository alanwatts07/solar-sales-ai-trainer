import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DiffSegment {
  type: string
  text: string
  expected?: string
  actual?: string
}

interface TranscriptDiffProps {
  segments: DiffSegment[]
}

const segmentStyles: Record<string, string> = {
  match: 'text-green-400',
  missing: 'bg-red-500/20 text-red-400 line-through',
  incorrect: 'bg-yellow-500/20 text-yellow-400',
  extra: 'bg-blue-500/20 text-blue-400',
}

export function TranscriptDiff({ segments }: TranscriptDiffProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Script Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
          {segments.map((seg, i) => (
            <span
              key={i}
              className={segmentStyles[seg.type] ?? ''}
              title={
                seg.type === 'incorrect'
                  ? `Expected: "${seg.expected}" → Got: "${seg.actual}"`
                  : seg.type === 'missing'
                    ? `Missing: "${seg.text}"`
                    : undefined
              }
            >
              {seg.type === 'incorrect' ? seg.actual : seg.text}{' '}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-400" /> Match
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Missing
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-400" /> Incorrect
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-400" /> Extra
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
