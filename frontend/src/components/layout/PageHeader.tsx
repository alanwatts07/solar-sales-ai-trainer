import { Zap } from 'lucide-react'

interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
        <Zap className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-light tracking-wide">{title}</h1>
      </div>
    </header>
  )
}
