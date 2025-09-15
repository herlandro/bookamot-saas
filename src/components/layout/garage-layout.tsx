'use client';

import { useState } from 'react';
import { GarageSidebar } from '@/components/ui/garage-sidebar';
import { cn } from '@/lib/utils';

interface GarageLayoutProps {
  children: React.ReactNode;
}

export function GarageLayout({ children }: GarageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <GarageSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "lg:ml-64" : "lg:ml-16"
      )}>
        {/* Top Bar for Mobile */}
        <div className="lg:hidden bg-background border-b border-border p-4">
          <button
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}