'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu } from 'lucide-react'
import { NavigationMenu } from './navigation-menu'
import { AvatarDropdown } from './avatar-dropdown'
import { NotificationsDropdown } from './notifications-dropdown'

interface HeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function Header({ onMenuClick, showMenuButton = true, onBookingClick }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!session?.user) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background border-b border-border">
      <div className="flex items-center h-16 px-4 sm:px-6 lg:px-8">
        {/* Left Side - Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          )}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">B</span>
            </div>
            <span className="text-sm font-semibold text-foreground">BookaMOT</span>
          </div>
        </div>

        {/* Center - Navigation Menu */}
        <div className="flex-1 flex justify-center px-4 overflow-hidden">
          <NavigationMenu />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications - Only for garage owners */}
          {session.user.role === 'GARAGE_OWNER' && (
            <NotificationsDropdown onBookingClick={onBookingClick} />
          )}

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
          )}

          {/* Avatar Dropdown */}
          <AvatarDropdown />
        </div>
      </div>
    </header>
  )
}

