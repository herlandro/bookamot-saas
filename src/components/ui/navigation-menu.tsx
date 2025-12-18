'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Calendar,
  BookOpen,
  Users,
  Car,
  Star,
  LayoutDashboard
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const customerNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Account overview'
  },
  {
    name: 'Bookings',
    href: '/bookings',
    icon: BookOpen,
    description: 'Your MOT bookings'
  },
  {
    name: 'Vehicles',
    href: '/vehicles',
    icon: Car,
    description: 'Your vehicles'
  },
  {
    name: 'Reviews',
    href: '/reviews',
    icon: Star,
    description: 'Reviews and comments'
  }
]

const garageNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/garage-admin/dashboard',
    icon: LayoutDashboard,
    description: 'Admin dashboard'
  },
  {
    name: 'Calendar',
    href: '/garage-admin/calendar',
    icon: Calendar,
    description: 'Booking schedule'
  },
  {
    name: 'Bookings',
    href: '/garage-admin/bookings',
    icon: BookOpen,
    description: 'Manage bookings'
  },
  {
    name: 'Customers',
    href: '/garage-admin/customers',
    icon: Users,
    description: 'Garage customers'
  },
  {
    name: 'Vehicles',
    href: '/garage-admin/vehicles',
    icon: Car,
    description: 'Serviced vehicles'
  },
  {
    name: 'Reviews',
    href: '/garage-admin/reviews',
    icon: Star,
    description: 'Received reviews'
  }
]

export function NavigationMenu() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Don't show navigation if user is not authenticated
  if (status === 'loading' || !session?.user) {
    return null
  }

  // Don't show navigation menu for ADMIN users - they have their own sidebar
  if (session.user.role === 'ADMIN') {
    return null
  }

  // Determine navigation items based on user role
  const isGarageOwner = session.user.role === 'GARAGE_OWNER'
  const navigationItems = isGarageOwner ? garageNavigation : customerNavigation

  return (
    <nav className="flex space-x-1 sm:space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'inline-flex items-center px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            title={item.description}
          >
            <item.icon className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}