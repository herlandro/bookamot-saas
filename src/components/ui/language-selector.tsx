'use client'

import React, { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  className?: string
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
]

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get language from localStorage or browser preference
    const saved = localStorage.getItem('language')
    if (saved) {
      setCurrentLanguage(saved)
    } else {
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'pt') {
        setCurrentLanguage('pt')
      }
    }
  }, [])

  const handleLanguageChange = (code: string) => {
    setCurrentLanguage(code)
    localStorage.setItem('language', code)
    setIsOpen(false)
    // Dispatch custom event for language change
    window.dispatchEvent(
      new CustomEvent('languageChange', { detail: { language: code } })
    )
  }

  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        disabled
      >
        <Globe className="h-5 w-5 text-muted-foreground" />
      </button>
    )
  }

  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage)

  return (
    <div className={cn('relative', className)}>
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        aria-label="Language selector"
        title="Select language"
      >
        <span className="text-lg">{currentLang?.flag}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    'w-full px-4 py-2 text-sm text-left flex items-center gap-3 transition-colors',
                    currentLanguage === lang.code
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {currentLanguage === lang.code && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

