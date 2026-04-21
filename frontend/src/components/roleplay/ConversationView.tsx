import { useRef, useEffect } from 'react'

interface Message {
  role: 'rep' | 'customer'
  text: string
}

interface ConversationViewProps {
  messages: Message[]
  isWaiting: boolean
}

export function ConversationView({ messages, isWaiting }: ConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isWaiting])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-1">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'rep' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'rep'
                ? 'rounded-br-md bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.65_0.25_285_/_20%)]'
                : 'rounded-bl-md border border-white/10 bg-white/5 text-foreground backdrop-blur-sm'
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      {isWaiting && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="inline-flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
