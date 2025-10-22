'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarDropdownProps {
  className?: string
}

export function AvatarDropdown({ className }: AvatarDropdownProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

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
    setIsOpen(false)
    await signOut({ redirect: false })
    router.push('/signin')
  }

  const handleProfile = () => {
    setIsOpen(false)
    router.push('/profile')
  }

  const handleSettings = () => {
    setIsOpen(false)
    router.push('/settings')
  }

  return (
    <div className={cn('relative', className)}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors border border-primary/20"
        aria-label="User menu"
        title={user.name || user.email}
      >
        {initials}
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
          <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <p className="text-sm font-semibold text-foreground truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
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
  )
}

