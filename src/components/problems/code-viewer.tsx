"use client"

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { 
  vscDarkPlus, 
  vs, 
  dracula, 
  atomDark, 
  solarizedlight 
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'

interface CodeViewerProps {
  code: string
  language?: string
  title?: string
  showLineNumbers?: boolean
  defaultTheme?: 'light' | 'dark' | 'dracula' | 'atom' | 'solarized'
}

export default function CodeViewer({
  code,
  language = 'javascript',
  title = 'Code',
  showLineNumbers = true,
  defaultTheme = 'dark'
}: CodeViewerProps) {
  const [theme, setTheme] = useState(defaultTheme)
  const [copied, setCopied] = useState(false)
  
  const themeStyles = {
    light: vs,
    dark: vscDarkPlus,
    dracula: dracula,
    atom: atomDark,
    solarized: solarizedlight
  }
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={theme}
            onValueChange={(value: 'light' | 'dark' | 'dracula' | 'atom' | 'solarized') => setTheme(value)}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="dracula">Dracula</SelectItem>
              <SelectItem value="atom">Atom</SelectItem>
              <SelectItem value="solarized">Solarized</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <div className="relative">
          {copied && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Copied!
            </div>
          )}
          <SyntaxHighlighter
            language={language}
            style={themeStyles[theme]}
            showLineNumbers={showLineNumbers}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 0.5rem 0.5rem',
              fontSize: '0.9rem',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </CardContent>
    </Card>
  )
} 
 
 
 