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
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'rep'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted text-foreground rounded-bl-md'
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      {isWaiting && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2 text-sm text-muted-foreground">
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
