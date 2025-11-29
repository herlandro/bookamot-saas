'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { Header } from '@/components/ui/header';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <Header onMenuClick={toggleSidebar} showMenuButton={true} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

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

