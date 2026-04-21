interface DoorProps {
  onClick: () => void
  isKnocking: boolean
}

export function CreelDoor({ onClick, isKnocking }: DoorProps) {
  return (
    <div
      onClick={onClick}
      className={`mx-auto w-48 cursor-pointer select-none transition-transform duration-200 ${
        isKnocking ? 'animate-[shake_0.3s_ease-in-out_2]' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Ornate frame */}
      <div className="rounded-t-lg border-4 border-red-950 bg-red-950 p-3">
        {/* Door surface - deep red */}
        <div className="relative flex h-72 flex-col items-center bg-gradient-to-b from-red-900 to-red-950 shadow-inner">
          {/* Stained glass rose window */}
          <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-800 bg-red-950/80 shadow-inner">
            {/* Rose petals */}
            <div className="relative h-12 w-12">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <div
                  key={deg}
                  className="absolute left-1/2 top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/70"
                  style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-6px)` }}
                />
              ))}
              {/* Center */}
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-sm" />
            </div>
          </div>

          {/* Ornate panels */}
          <div className="mt-4 flex w-full gap-2 px-3">
            <div className="h-12 flex-1 rounded border border-red-800 bg-red-900/50" />
            <div className="h-12 flex-1 rounded border border-red-800 bg-red-900/50" />
          </div>

          {/* Iron door knocker - lion ring */}
          <div className="mt-4 flex flex-col items-center">
            <div className="h-2 w-4 rounded-t bg-gray-500" />
            <div className="h-6 w-6 rounded-full border-3 border-gray-500 bg-transparent" />
          </div>

          {/* Handle */}
          <div className="absolute right-4 bottom-20">
            <div className="h-10 w-2 rounded bg-gray-500/80 shadow" />
          </div>

          {/* Bottom panels */}
          <div className="absolute bottom-4 flex w-full gap-2 px-3">
            <div className="h-14 flex-1 rounded border border-red-800 bg-red-900/50" />
            <div className="h-14 flex-1 rounded border border-red-800 bg-red-900/50" />
          </div>
        </div>
      </div>
      {/* Dark stone step */}
      <div className="mx-auto h-4 w-52 rounded-b bg-stone-800" />
    </div>
  )
}
