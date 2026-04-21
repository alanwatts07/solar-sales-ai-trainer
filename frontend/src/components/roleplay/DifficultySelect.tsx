import { Card, CardContent } from '@/components/ui/card'

interface DifficultySelectProps {
  onSelect: (difficulty: string) => void
}

const difficulties = [
  {
    id: 'easy',
    label: 'Easy',
    desc: '1-2 soft objections, light pushback',
    multiplier: '1x XP',
    accent: 'bg-green-500/10 text-green-400 border-green-500/20',
    glow: 'hover:shadow-[0_0_20px_oklch(0.7_0.2_145_/_15%)]',
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: '3-4 mixed objections, moderate pushback',
    multiplier: '1.5x XP',
    accent: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    glow: 'hover:shadow-[0_0_20px_oklch(0.8_0.15_85_/_15%)]',
  },
  {
    id: 'hard',
    label: 'Hard',
    desc: '5-6 tough objections, aggressive pushback',
    multiplier: '2x XP',
    accent: 'bg-red-500/10 text-red-400 border-red-500/20',
    glow: 'hover:shadow-[0_0_20px_oklch(0.65_0.2_25_/_15%)]',
  },
]

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="space-y-4 pt-4">
      <h2 className="text-center text-xl font-light tracking-wide">Choose Difficulty</h2>
      <div className="space-y-3">
        {difficulties.map((d) => (
          <Card
            key={d.id}
            className={`cursor-pointer border border-white/10 transition-all ${d.glow}`}
            onClick={() => onSelect(d.id)}
          >
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${d.accent}`}>
                <span className="text-lg font-bold">{d.label[0]}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{d.label}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${d.accent}`}>
                    {d.multiplier}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
