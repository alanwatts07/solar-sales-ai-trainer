interface DoorProps {
  onClick: () => void
  isKnocking: boolean
}

export function ModernDoor({ onClick, isKnocking }: DoorProps) {
  return (
    <div
      onClick={onClick}
      className={`mx-auto w-48 cursor-pointer select-none transition-transform duration-200 ${
        isKnocking ? 'animate-[shake_0.3s_ease-in-out_2]' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Door frame */}
      <div className="rounded-t border-2 border-zinc-600 bg-zinc-700 p-2">
        {/* Door surface */}
        <div className="relative flex h-72 flex-col bg-zinc-900 shadow-inner">
          {/* Frosted glass strip */}
          <div className="ml-3 mt-6 h-40 w-8 rounded bg-zinc-400/20 backdrop-blur" />
          {/* Handle - long bar */}
          <div className="absolute right-6 top-1/3 h-24 w-1 rounded-full bg-zinc-400" />
          {/* Lock */}
          <div className="absolute right-5 bottom-16 h-3 w-3 rounded-full border border-zinc-500 bg-zinc-600" />
          {/* House number */}
          <div className="absolute top-4 right-4 font-mono text-xs text-zinc-500">42</div>
        </div>
      </div>
      {/* Step */}
      <div className="mx-auto h-2 w-52 bg-zinc-600" />
    </div>
  )
}
