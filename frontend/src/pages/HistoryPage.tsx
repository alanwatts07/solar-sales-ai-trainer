import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { History } from 'lucide-react'

export function HistoryPage() {
  return (
    <>
      <PageHeader title="History" />
      <div className="flex flex-col items-center justify-center gap-4 p-4 pt-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Session History</h2>
        <p className="text-center text-sm text-muted-foreground">
          Coming soon. View past training sessions and scores.
        </p>
      </div>
    </>
  )
}
