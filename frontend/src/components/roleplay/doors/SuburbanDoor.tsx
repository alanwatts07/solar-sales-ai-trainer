interface DoorProps {
  onClick: () => void
  isKnocking: boolean
}

export function SuburbanDoor({ onClick, isKnocking }: DoorProps) {
  return (
    <div
      onClick={onClick}
      className={`mx-auto w-48 cursor-pointer select-none transition-transform duration-200 ${
        isKnocking ? 'animate-[shake_0.3s_ease-in-out_2]' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Door frame */}
      <div className="rounded-t-lg border-4 border-amber-900 bg-amber-800 p-3">
        {/* Door surface */}
        <div className="relative flex h-72 flex-col items-center justify-between rounded bg-white p-4 shadow-inner">
          {/* Top panels */}
          <div className="flex w-full gap-2">
            <div className="h-16 flex-1 rounded border-2 border-gray-200 bg-gray-50" />
            <div className="h-16 flex-1 rounded border-2 border-gray-200 bg-gray-50" />
          </div>
          {/* Middle window */}
          <div className="h-20 w-full rounded border-2 border-gray-200 bg-blue-100/50" />
          {/* Knocker */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 rounded-full bg-yellow-600 shadow-md" />
            <div className="mx-auto h-5 w-2 rounded-b bg-yellow-700" />
          </div>
          {/* Handle */}
          <div className="absolute right-5 bottom-20">
            <div className="h-8 w-2 rounded-full bg-yellow-600 shadow-md" />
          </div>
          {/* Bottom panels */}
          <div className="flex w-full gap-2">
            <div className="h-16 flex-1 rounded border-2 border-gray-200 bg-gray-50" />
            <div className="h-16 flex-1 rounded border-2 border-gray-200 bg-gray-50" />
          </div>
        </div>
      </div>
      {/* Welcome mat */}
      <div className="mx-auto h-4 w-32 rounded-b bg-amber-700/60" />
      {/* Step */}
      <div className="mx-auto h-3 w-52 rounded-b bg-gray-400" />
    </div>
  )
}
