'use client';

import { useState } from 'react';
import { GarageSidebar } from '@/components/ui/garage-sidebar';
import { Header } from '@/components/ui/header';
import { cn } from '@/lib/utils';

interface GarageLayoutProps {
  children: React.ReactNode;
  onBookingClick?: (bookingId: string) => void;
}

export function GarageLayout({ children, onBookingClick }: GarageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <Header onMenuClick={toggleSidebar} showMenuButton={true} onBookingClick={onBookingClick} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <GarageSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        {/* Content Area */}
        <main className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-0" : "md:ml-0"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}