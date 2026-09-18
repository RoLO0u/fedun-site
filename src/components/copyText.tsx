'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from '@/lib/utils'

interface CopyTextProps {
  text: string
  label?: string
  className?: string
}

export function CopyText({ text, label, className }: CopyTextProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    if (!text) return
    
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div className={cn("flex items-center justify-between space-x-2 bg-muted px-3 py-2 rounded-md", className)}>
      <code className="text-sm truncate">
        {label || text}
      </code>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0" 
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">Copy</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <p className="text-sm">{isCopied ? "Copied!" : "Copy to clipboard"}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}