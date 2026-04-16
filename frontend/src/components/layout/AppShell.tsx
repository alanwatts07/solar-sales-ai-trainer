import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-svh max-w-lg bg-background pb-20">
      {children}
    </div>
  )
}
