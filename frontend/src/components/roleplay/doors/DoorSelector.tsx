import { useState, useMemo } from 'react'
import { SuburbanDoor } from './SuburbanDoor'
import { ModernDoor } from './ModernDoor'
import { RusticDoor } from './RusticDoor'
import { ApartmentDoor } from './ApartmentDoor'
import { CreelDoor } from './CreelDoor'

const doors = [SuburbanDoor, ModernDoor, RusticDoor, ApartmentDoor, CreelDoor]

interface DoorSelectorProps {
  onKnock: () => Promise<void>
}

export function DoorSelector({ onKnock }: DoorSelectorProps) {
  const [isKnocking, setIsKnocking] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  const DoorComponent = useMemo(
    () => doors[Math.floor(Math.random() * doors.length)],
    [],
  )

  const handleKnock = async () => {
    if (isKnocking || isOpening) return

    setIsKnocking(true)

    // Play knock sound
    try {
      const audio = new Audio('/sounds/knock.mp3')
      audio.volume = 0.6
      audio.play().catch(() => {})
    } catch {
      // Sound is optional
    }

    // Knock animation duration
    await new Promise((r) => setTimeout(r, 700))
    setIsKnocking(false)
    setIsOpening(true)

    // Fire the callback (requests mic permission + starts session)
    await onKnock()
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div
        className={`transition-all duration-500 ${
          isOpening
            ? 'scale-75 opacity-0 -rotate-12'
            : ''
        }`}
      >
        <DoorComponent onClick={handleKnock} isKnocking={isKnocking} />
      </div>

      {!isOpening && (
        <p className="animate-pulse text-sm text-muted-foreground">
          {isKnocking ? 'Knock knock...' : 'Tap the door to knock'}
        </p>
      )}

      {isOpening && (
        <p className="text-sm text-muted-foreground">
          Door opening...
        </p>
      )}
    </div>
  )
}
