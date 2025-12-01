'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LogOut,
  Settings,
  User,
  LayoutDashboard,
  Building2,
  Car,
  Users,
  Star,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarDropdownProps {
  className?: string
}

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { id: 'pending', label: 'Pending Garages', icon: Clock, href: '/admin/garages/pending' },
  { id: 'garages', label: 'Garages', icon: Building2, href: '/admin/garages' },
  { id: 'customers', label: 'Customers', icon: Users, href: '/admin/customers' },
  { id: 'vehicles', label: 'Vehicles', icon: Car, href: '/admin/vehicles' },
  { id: 'reviews', label: 'Reviews', icon: Star, href: '/admin/reviews' },
]

export function AvatarDropdown({ className }: AvatarDropdownProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) {
    return null
  }

  const user = session.user
  const isAdmin = user.role === 'ADMIN'
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

  const handleNavigation = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  const isActive = (href: string) => {
    if (href === '/admin/garages') {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center h-10 w-10 rounded-full font-semibold text-sm transition-colors border",
          isAdmin
            ? "bg-red-600/10 text-red-600 hover:bg-red-600/20 border-red-600/20"
            : "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
        )}
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
          <div className={cn(
            "absolute right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden",
            isAdmin ? "w-64" : "w-56"
          )}>
            {/* User Info */}
            <div className={cn(
              "px-4 py-3 border-b border-border",
              isAdmin ? "bg-red-600/10" : "bg-muted/50"
            )}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.name || 'User'}
                </p>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-600 text-white rounded">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>

            {/* Admin Navigation Items */}
            {isAdmin && (
              <div className="py-2 border-b border-border">
                <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin Panel
                </p>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "w-full px-4 py-2 text-sm transition-colors flex items-center gap-3",
                        active
                          ? "bg-red-600 text-white"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Common Menu Items */}
            <div className="py-1">
              <button
                onClick={() => handleNavigation(isAdmin ? '/admin/profile' : '/profile')}
                className="w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-3"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <button
                onClick={() => handleNavigation(isAdmin ? '/admin/settings' : '/settings')}
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

