import { Card, CardContent } from '@/components/ui/card'
import { Sun, Globe } from 'lucide-react'

interface ScenarioSelectProps {
  onSelect: (scenario: string) => void
}

const scenarios = [
  {
    id: 'solar',
    label: 'Solar Sales',
    desc: 'Door-to-door solar panel sales to homeowners',
    icon: Sun,
  },
  {
    id: 'web',
    label: 'Website & WaaS',
    desc: 'Selling websites and web services to local business owners',
    icon: Globe,
  },
]

export function ScenarioSelect({ onSelect }: ScenarioSelectProps) {
  return (
    <div className="space-y-4 pt-4">
      <h2 className="text-center text-xl font-light tracking-wide">What are you selling?</h2>
      <div className="space-y-3">
        {scenarios.map((s) => {
          const Icon = s.icon
          return (
            <Card
              key={s.id}
              className="cursor-pointer border border-white/10 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_oklch(0.65_0.25_285_/_15%)]"
              onClick={() => onSelect(s.id)}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
