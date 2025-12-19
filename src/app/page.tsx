'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Import the garage admin page component
import GarageAdminPage from './garage-admin/calendar/page';

// Import the Dashboard component
import Dashboard from './dashboard/page';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated
  if (status === 'authenticated') {
    // If garage owner, render the garage admin page
    if (session?.user?.role === 'GARAGE_OWNER') {
      return <GarageAdminPage />;
    }
    // If customer, render the dashboard
    return <Dashboard />;
  }

  const handleBookMOT = () => {
    router.push('/signup');
  };

  const handleRegisterGarage = () => {
    router.push('/garage-admin/signup');
  };

  // Conteúdo principal da página
  const pageContent = (
    <>
      {/* Welcome Section */}
      <div className="text-center mb-12 max-w-4xl">
        <h1 className="text-6xl font-normal text-foreground mb-6 tracking-tight">
          Find Your Perfect MOT Test
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Book your MOT test quickly and easily with trusted garages in your area
        </p>
      </div>

      {/* Book MOT Button */}
      <div className="w-full max-w-md space-y-3">
        <Button
          onClick={handleBookMOT}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-4 text-lg font-medium"
          size="lg"
        >
          I want to book an MOT
        </Button>
        <Button
          onClick={handleRegisterGarage}
          variant="outline"
          className="w-full border-border text-foreground hover:bg-muted rounded-full px-8 py-4 text-lg font-medium"
          size="lg"
        >
          I want to register my garage
        </Button>
      </div>

      {/* Footer Text */}
      <div className="text-center text-sm text-muted-foreground mt-8">
        Using BookaMOT means you agree to the <Link href="/terms" className="underline hover:text-primary">Terms and Conditions</Link>. See our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link> and <Link href="/cookies" className="underline hover:text-primary">Cookie Policy</Link>.
      </div>
    </>
  );

  // Render pre-login page (status is 'unauthenticated')
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex justify-end p-6">
        <Button 
          variant="outline" 
          className="border-border text-foreground hover:bg-muted"
          onClick={() => router.push('/signin')}
        >
          Sign in
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {pageContent}
      </div>
    </div>
  );
}
