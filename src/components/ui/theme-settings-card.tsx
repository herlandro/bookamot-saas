'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="shadow-xl rounded-lg border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how BookaMOT looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Loading...</Label>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-xl rounded-lg border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize how BookaMOT looks on your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label className="text-sm font-medium">Theme Mode</Label>
          <div className="grid grid-cols-3 gap-4">
            {/* Light Mode */}
            <button
              onClick={() => setTheme('light')}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${theme === 'light' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border">
                <Sun className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Light</p>
                <p className="text-xs text-muted-foreground">Day theme</p>
              </div>
              {theme === 'light' && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => setTheme('dark')}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${theme === 'dark' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border">
                <Moon className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Dark</p>
                <p className="text-xs text-muted-foreground">Night theme</p>
              </div>
              {theme === 'dark' && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>

            {/* System Mode */}
            <button
              onClick={() => setTheme('system')}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${theme === 'system' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border">
                <Monitor className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">System</p>
                <p className="text-xs text-muted-foreground">Auto theme</p>
              </div>
              {theme === 'system' && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <Label className="text-sm font-medium mb-3 block">Preview</Label>
            <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm">Background</span>
                <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: 'var(--background)' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Foreground</span>
                <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: 'var(--foreground)' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Primary</span>
                <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: 'var(--primary)' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Muted</span>
                <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: 'var(--muted)' }} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

