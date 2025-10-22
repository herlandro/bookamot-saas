'use client';

import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Car,
  CalendarCheck,
  Users,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface GarageSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function GarageSidebar({ isOpen, onToggle }: GarageSidebarProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/garage-admin/dashboard' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/garage-admin/calendar' },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck, href: '/garage-admin/bookings' },
    { id: 'customers', label: 'Customers', icon: Users, href: '/garage-admin/customers' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, href: '/garage-admin/vehicles' },
    { id: 'reviews', label: 'Reviews', icon: Star, href: '/garage-admin/reviews' },
  ];

  const bottomItems: { id: string; label: string; icon: any; href: string }[] = [];

  const isActive = (href: string) => {
    // For other pages, check exact match or if it's a sub-page
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full bg-background border-r border-border z-50 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
        "md:relative md:z-auto",
        isOpen ? "w-64" : "w-0 md:w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">B</span>
              </div>
              <span className="text-foreground font-semibold">BookaMOT</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-muted p-2"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  !isOpen && "justify-center"
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                {isOpen && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-border p-2 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  !isOpen && "justify-center"
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                {isOpen && <span>{item.label}</span>}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}