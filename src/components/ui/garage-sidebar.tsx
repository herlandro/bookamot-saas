'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Settings, 
  User,
  LogOut,
  Car,
  ClipboardList,
  BarChart2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface GarageSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function GarageSidebar({ isOpen, onToggle }: GarageSidebarProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/garage-admin' },
    { id: 'schedule', label: 'Agenda', icon: Calendar, href: '/garage-admin/schedule' },
    { id: 'bookings', label: 'Reservas', icon: ClipboardList, href: '/garage-admin/bookings' },
    { id: 'settings', label: 'Configurações', icon: Settings, href: '/garage-admin/settings' },
  ];

  const bottomItems = [
    { id: 'profile', label: 'Perfil', icon: User, href: '/profile' },
    { id: 'logout', label: 'Sair', icon: LogOut, action: () => signOut({ callbackUrl: '/signin' }) },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full bg-background border-r border-border z-50 transition-all duration-300 ease-in-out flex flex-col",
        isOpen ? "w-64" : "w-0 lg:w-16"
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
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-2"
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
        <div className="border-t border-border p-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              item.action ? (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                    isActive(item.href || '')
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    !isOpen && "justify-center"
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                  {isOpen && <span>{item.label}</span>}
                </button>
              ) : (
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
              )
            );
          })}
        </div>
      </div>
    </>
  );
}