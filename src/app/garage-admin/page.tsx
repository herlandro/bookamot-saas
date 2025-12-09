'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Garage Admin Root Page
 *
 * This page redirects to the garage admin dashboard
 * Ensures that /garage-admin always goes to /garage-admin/dashboard
 */
export default function GarageAdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to garage admin dashboard
    router.push('/garage-admin/dashboard');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-red-600" />
    </div>
  );
}
