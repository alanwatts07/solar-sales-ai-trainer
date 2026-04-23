import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Brain, TrendingUp, Mic } from 'lucide-react'

interface LandingProps {
  onStart: () => void
}

export function Landing({ onStart }: LandingProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Delay entrance animations by a frame
    requestAnimationFrame(() => setMounted(true))
  }, [])

  return (
    <div className="relative mx-auto min-h-svh max-w-2xl px-6 pb-16">
      {/* Top bar with logo */}
      <div
        className={`flex items-center gap-2 py-6 transition-all duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
      >
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-sm font-light tracking-widest uppercase text-white/80">
          Solar Trainer
        </span>
      </div>

      {/* Hero */}
      <div className="space-y-8 pt-12 md:pt-20">
        {/* Tagline */}
        <div
          className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs backdrop-blur-sm transition-all delay-100 duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-white/80">AI-powered role-play training</span>
        </div>

        {/* Headline */}
        <h1
          className={`text-5xl font-extralight leading-[1.05] tracking-tight text-white md:text-7xl transition-all delay-200 duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          Close more{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            deals.
          </span>
          <br />
          <span className="font-light">Every single day.</span>
        </h1>

        {/* Subhead */}
        <p
          className={`max-w-xl text-lg font-light leading-relaxed text-white/70 md:text-xl transition-all delay-300 duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          Train against AI customers that react, push back, and hide secrets.
          Get instant feedback. Level up your game.
        </p>

        {/* CTA */}
        <div
          className={`flex flex-col gap-3 pt-4 sm:flex-row sm:items-center transition-all delay-400 duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <Button
            size="lg"
            onClick={onStart}
            className="group relative overflow-hidden rounded-full bg-primary px-8 py-6 text-base font-medium shadow-[0_0_40px_oklch(0.65_0.25_285_/_40%)] transition-all hover:shadow-[0_0_60px_oklch(0.65_0.25_285_/_60%)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Training
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Button>
          <span className="text-sm text-white/50">No signup. Just talk.</span>
        </div>
      </div>

      {/* Features */}
      <div
        className={`mt-20 grid grid-cols-1 gap-4 md:grid-cols-3 transition-all delay-500 duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <FeatureCard
          icon={<Brain className="h-5 w-5" />}
          title="Mystery customers"
          desc="Each rep you meet has hidden concerns. Read the signs, adapt your pitch."
        />
        <FeatureCard
          icon={<Mic className="h-5 w-5" />}
          title="Talk like it's real"
          desc="Knock the door, speak your pitch, hear them respond. No scripts to tap."
        />
        <FeatureCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Level up"
          desc="XP, streaks, and AI grades. Get better with every session."
        />
      </div>

      {/* Stats row */}
      <div
        className={`mt-16 flex flex-wrap items-center justify-center gap-8 border-y border-white/10 py-8 text-center transition-all delay-700 duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <Stat value="2" label="sales scenarios" />
        <Stat value="15+" label="objections" />
        <Stat value="10" label="hidden traits" />
        <Stat value="∞" label="AI customers" />
      </div>

      {/* Bottom CTA */}
      <div
        className={`mt-16 text-center transition-all delay-[800ms] duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <p className="mb-4 text-lg font-light text-white/80">
          Your next best session is one knock away.
        </p>
        <Button
          size="lg"
          variant="outline"
          onClick={onStart}
          className="rounded-full border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
        >
          Let's go
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-[oklch(0.15_0.02_240_/_82%)] p-5 backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-[0_0_30px_oklch(0.65_0.25_285_/_15%)]">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-medium text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-white/60">{desc}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-3xl font-light text-transparent md:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/50">
        {label}
      </div>
    </div>
  )
}
