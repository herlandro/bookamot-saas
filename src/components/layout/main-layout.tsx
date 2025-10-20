'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
        sidebarOpen ? "md:ml-64" : "md:ml-16"
      )}>
        {/* Top Bar for Mobile */}
        <div className="md:hidden bg-background border-b border-border p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-foreground">BookaMOT</span>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}