interface DoorProps {
  onClick: () => void
  isKnocking: boolean
}

export function ApartmentDoor({ onClick, isKnocking }: DoorProps) {
  return (
    <div
      onClick={onClick}
      className={`mx-auto w-48 cursor-pointer select-none transition-transform duration-200 ${
        isKnocking ? 'animate-[shake_0.3s_ease-in-out_2]' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Door frame */}
      <div className="border-2 border-gray-500 bg-gray-600 p-2">
        {/* Door surface - metal */}
        <div className="relative h-72 bg-gradient-to-b from-gray-700 to-gray-800">
          {/* Unit number */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <div className="rounded border border-yellow-600 bg-yellow-700/80 px-4 py-1 text-center font-mono text-lg font-bold text-yellow-200 shadow-sm">
              204
            </div>
          </div>
          {/* Peephole */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2">
            <div className="h-4 w-4 rounded-full border-2 border-gray-500 bg-gray-900 shadow-inner" />
          </div>
          {/* Handle */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="h-10 w-2.5 rounded bg-gray-400 shadow-md" />
          </div>
          {/* Deadbolt */}
          <div className="absolute right-5 top-1/3">
            <div className="h-5 w-5 rounded-full border-2 border-gray-400 bg-gray-500" />
            <div className="mx-auto h-2 w-1 bg-gray-400" />
          </div>
          {/* Bottom kick plate */}
          <div className="absolute bottom-0 left-0 h-12 w-full border-t border-gray-600 bg-gray-750" />
        </div>
      </div>
      {/* Floor */}
      <div className="mx-auto h-2 w-52 bg-gray-500" />
    </div>
  )
}
