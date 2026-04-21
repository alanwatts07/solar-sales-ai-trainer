import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-svh max-w-lg pb-20">
      {children}
    </div>
  )
}
