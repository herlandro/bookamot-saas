'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Car,
  Star,
  Clock,
  BookOpen,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface AdminMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [pendingGaragesCount, setPendingGaragesCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/garages/pending/count')
      .then(res => res.ok ? res.json() : { count: 0 })
      .then(data => setPendingGaragesCount(data.count))
      .catch(() => setPendingGaragesCount(0));
  }, []);

  // Este sidebar só é usado em páginas /admin; Sales sempre visível. Acesso a /admin/sales é protegido na própria página.
  const menuItems: AdminMenuItem[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'pending', label: 'Pending Garages', icon: Clock, href: '/admin/garages/pending', badge: pendingGaragesCount },
    { id: 'garages', label: 'Garages', icon: Building2, href: '/admin/garages' },
    { id: 'sales', label: 'Sales', icon: ShoppingBag, href: '/admin/sales' },
    { id: 'bookings', label: 'Bookings', icon: BookOpen, href: '/admin/bookings' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, href: '/admin/vehicles' },
    { id: 'reviews', label: 'Reviews', icon: Star, href: '/admin/reviews' },
  ], [pendingGaragesCount]);

  const isActive = (href: string) => {
    if (href === '/admin/garages') {
      return pathname === href;
    }
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
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-foreground font-semibold">Admin Panel</span>
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
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-red-600 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  !isOpen && "justify-center"
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                {isOpen && (
                  <span className="flex-1">{item.label}</span>
                )}
                {isOpen && item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

