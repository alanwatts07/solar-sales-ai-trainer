interface DoorProps {
  onClick: () => void
  isKnocking: boolean
}

export function RusticDoor({ onClick, isKnocking }: DoorProps) {
  return (
    <div
      onClick={onClick}
      className={`mx-auto w-48 cursor-pointer select-none transition-transform duration-200 ${
        isKnocking ? 'animate-[shake_0.3s_ease-in-out_2]' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Stone frame */}
      <div className="rounded-t-xl border-4 border-stone-500 bg-stone-400 p-3">
        {/* Arch top */}
        <div className="mx-auto -mt-1 mb-1 h-6 w-36 rounded-t-full bg-amber-950" />
        {/* Door surface - wood planks */}
        <div className="relative flex h-64 gap-0.5 bg-amber-950 p-1">
          <div className="flex-1 rounded-sm bg-amber-800" />
          <div className="flex-1 rounded-sm bg-amber-900" />
          <div className="flex-1 rounded-sm bg-amber-800" />
          <div className="flex-1 rounded-sm bg-amber-900" />
          <div className="flex-1 rounded-sm bg-amber-800" />
          {/* Iron hardware */}
          <div className="absolute left-4 top-8 h-12 w-12 rounded-full border-4 border-gray-600 bg-transparent" />
          <div className="absolute left-8 top-14 h-0.5 w-8 bg-gray-600" />
          {/* Handle ring */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="h-8 w-8 rounded-full border-4 border-gray-500 bg-transparent" />
          </div>
          {/* Iron straps */}
          <div className="absolute top-4 left-0 h-1.5 w-full bg-gray-600/60" />
          <div className="absolute bottom-4 left-0 h-1.5 w-full bg-gray-600/60" />
        </div>
      </div>
      {/* Stone step */}
      <div className="mx-auto h-4 w-52 rounded-b bg-stone-500" />
    </div>
  )
}
