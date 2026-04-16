import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Mic } from 'lucide-react'

export function RolePlay() {
  return (
    <>
      <PageHeader title="Training" />
      <div className="flex flex-col items-center justify-center gap-4 p-4 pt-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Mic className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Voice Role-Play</h2>
        <p className="text-center text-sm text-muted-foreground">
          Coming soon. Practice handling objections with AI customers.
        </p>
      </div>
    </>
  )
}
