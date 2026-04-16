import { Sun } from 'lucide-react'

interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
        <Sun className="h-6 w-6 text-amber-500" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  )
}
