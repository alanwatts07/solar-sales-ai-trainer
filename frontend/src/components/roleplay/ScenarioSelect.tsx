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
    color: 'border-amber-500/50 hover:border-amber-500',
  },
  {
    id: 'web',
    label: 'Website & WaaS',
    desc: 'Selling websites and web services to local business owners',
    icon: Globe,
    color: 'border-blue-500/50 hover:border-blue-500',
  },
]

export function ScenarioSelect({ onSelect }: ScenarioSelectProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-center text-lg font-semibold">What are you selling?</h2>
      <div className="space-y-2">
        {scenarios.map((s) => {
          const Icon = s.icon
          return (
            <Card
              key={s.id}
              className={`cursor-pointer border-2 transition-colors ${s.color}`}
              onClick={() => onSelect(s.id)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <Icon className="h-8 w-8 shrink-0 text-muted-foreground" />
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
