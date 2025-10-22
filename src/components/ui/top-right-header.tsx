'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { AvatarDropdown } from './avatar-dropdown'
import { ThemeToggle } from './theme-toggle'
import { LanguageSelector } from './language-selector'

interface TopRightHeaderProps {
  className?: string
}

export function TopRightHeader({ className }: TopRightHeaderProps) {
  const { data: session, status } = useSession()

  // Don't show header if not authenticated
  if (status === 'loading' || !session?.user) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3',
        className
      )}
    >
      {/* Language Selector */}
      <LanguageSelector />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Avatar Dropdown */}
      <AvatarDropdown />
    </div>
  )
}

