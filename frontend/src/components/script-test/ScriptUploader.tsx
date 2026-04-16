import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Pencil, Check } from 'lucide-react'

interface ScriptUploaderProps {
  onScriptSet: (script: string) => void
  onScriptClear: () => void
  currentScript: string | null
}

export function ScriptUploader({ onScriptSet, onScriptClear, currentScript }: ScriptUploaderProps) {
  const [text, setText] = useState(currentScript ?? '')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      setText(content)
      onScriptSet(content)
    }
    reader.readAsText(file)
  }

  // Collapsed view: script is set, show summary only
  if (currentScript) {
    const wordCount = currentScript.split(/\s+/).length
    const preview = currentScript.length > 80
      ? currentScript.slice(0, 80) + '...'
      : currentScript
    return (
      <Card>
        <CardContent className="flex items-start gap-3 pt-4">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Script loaded</p>
            <p className="truncate text-xs text-muted-foreground">
              {wordCount} words &mdash; {preview}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onScriptClear()
              setText(currentScript)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Expanded view: no script set yet
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Golden Script</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Paste your sales script here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="resize-none text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="relative"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
            <input
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </Button>
          <Button
            size="sm"
            onClick={() => onScriptSet(text)}
            disabled={!text.trim()}
          >
            Set Script
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
