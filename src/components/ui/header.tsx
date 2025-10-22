'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Bell, Sun, Moon, LogOut, Settings, User, Menu } from 'lucide-react'
import { NavigationMenu } from './navigation-menu'

interface HeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function Header({ onMenuClick, showMenuButton = true }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!session?.user) {
    return null
  }

  const user = session.user
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U'

  const handleSignOut = async () => {
    setAvatarOpen(false)
    await signOut({ redirect: false })
    router.push('/signin')
  }

  const handleProfile = () => {
    setAvatarOpen(false)
    router.push('/profile')
  }

  const handleSettings = () => {
    setAvatarOpen(false)
    router.push('/settings')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New booking request', time: '5 minutes ago' },
    { id: 2, message: 'Your MOT is due soon', time: '1 hour ago' },
    { id: 3, message: 'Review received', time: '2 hours ago' },
  ]

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
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>

            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/50">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="px-4 py-3 border-b border-border hover:bg-accent transition-colors cursor-pointer"
                      >
                        <p className="text-sm text-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-border bg-muted/50">
                    <button className="text-xs text-primary hover:text-primary/80 font-semibold">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

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
          <div className="relative">
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors border border-primary/20"
              aria-label="User menu"
              title={user.name || user.email}
            >
              {initials}
            </button>

            {avatarOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAvatarOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/50">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleProfile}
                      className="w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-3"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>

                    <button
                      onClick={handleSettings}
                      className="w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-3"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>

                    <div className="border-t border-border my-1" />

                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

