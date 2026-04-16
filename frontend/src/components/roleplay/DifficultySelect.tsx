import { Card, CardContent } from '@/components/ui/card'

interface DifficultySelectProps {
  onSelect: (difficulty: string) => void
}

const difficulties = [
  {
    id: 'easy',
    label: 'Easy',
    desc: '1-2 soft objections, light pushback',
    color: 'border-green-500/50 hover:border-green-500',
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: '3-4 mixed objections, moderate pushback',
    color: 'border-yellow-500/50 hover:border-yellow-500',
  },
  {
    id: 'hard',
    label: 'Hard',
    desc: '5-6 tough objections, aggressive pushback',
    color: 'border-red-500/50 hover:border-red-500',
  },
]

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-center text-lg font-semibold">Choose Difficulty</h2>
      <div className="space-y-2">
        {difficulties.map((d) => (
          <Card
            key={d.id}
            className={`cursor-pointer border-2 transition-colors ${d.color}`}
            onClick={() => onSelect(d.id)}
          >
            <CardContent className="py-4">
              <p className="font-medium">{d.label}</p>
              <p className="text-sm text-muted-foreground">{d.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
