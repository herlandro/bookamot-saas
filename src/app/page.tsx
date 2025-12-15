'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/main-layout';
import { Info } from 'lucide-react';

// Importar o componente da página de administração de garagem
import GarageAdminPage from './garage-admin/calendar/page';

// Importar o componente Dashboard
import Dashboard from './dashboard/page';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showMessage, setShowMessage] = useState(false);

  // Se o usuário estiver autenticado
  if (status === 'authenticated') {
    // Se for proprietário de garagem, renderizar a página de administração de garagem
    if (session?.user?.role === 'GARAGE_OWNER') {
      return <GarageAdminPage />;
    }
    // Se for cliente, renderizar o dashboard
    return <Dashboard />;
  }

  const handleBookMOT = () => {
    // Show message to user
    setShowMessage(true);

    // Auto-close message and redirect after 3 seconds
    setTimeout(() => {
      setShowMessage(false);
      router.push('/signup');
    }, 3000);
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

      {/* Registration Required Message */}
      {showMessage && (
        <div className="w-full max-w-lg mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground font-medium">Registration Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                To book an MOT, you need to create an account first. Redirecting you to sign in...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Book MOT Button */}
      <div className="w-full max-w-md">
        <Button
          onClick={handleBookMOT}
          disabled={showMessage}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-4 text-lg font-medium"
          size="lg"
        >
          I want to book an MOT
        </Button>
      </div>

      {/* Footer Text */}
      <div className="text-center text-sm text-muted-foreground mt-8">
        Using BookaMOT means you agree to the <Link href="/terms" className="underline hover:text-primary">Terms and Conditions</Link>. See our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link> and <Link href="/cookies" className="underline hover:text-primary">Cookie Policy</Link>.
      </div>
    </>
  );

  // Renderiza com ou sem barra lateral dependendo se o usuário está logado
  if (session) {
    return (
      <MainLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {pageContent}
        </div>
      </MainLayout>
    );
  } else {
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
}