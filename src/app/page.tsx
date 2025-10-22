'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, MapPin, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';

// Importar o componente da página de administração de garagem
import GarageAdminPage from './garage-admin/calendar/page';

// Importar o componente Dashboard
import Dashboard from './dashboard/page';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [postcode, setPostcode] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  
  // Se o usuário estiver autenticado
  if (status === 'authenticated') {
    // Se for proprietário de garagem, renderizar a página de administração de garagem
    if (session?.user?.role === 'GARAGE_OWNER') {
      return <GarageAdminPage />;
    }
    // Se for cliente, renderizar o dashboard
    return <Dashboard />;
  }

  const handleSearch = () => {
    // Build search parameters
    const params = new URLSearchParams();
    if (postcode) {
      params.append('location', postcode);
    }
    if (date) {
      params.append('date', format(date, 'yyyy-MM-dd'));
    }
    if (time) {
      params.append('time', time);
    }

    // Redirect to search page
    router.push(`/search?${params.toString()}`);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Here you would typically convert coordinates to a postcode
          // using a geocoding service
          console.log('Location:', position.coords);
          // For demo purposes, just set a placeholder
          setPostcode('Current Location');
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
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

      {/* Search Container */}
      <div className="w-full max-w-4xl">
        {/* Search Form */}
        <div className="bg-card border border-border rounded-full shadow-lg p-2 mb-8">
          <div className="flex items-center">
            {/* Vehicle Registration Input */}
            <div className="flex-1 px-4 py-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                />
              </div>
            </div>

            {/* Date Picker */}
            <div className="flex-1 px-4 py-3 border-l border-border">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left font-normal border-0 p-0 h-auto text-base text-muted-foreground hover:bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="bg-popover text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="flex-1 px-4 py-3 border-l border-border">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left font-normal border-0 p-0 h-auto text-base text-muted-foreground hover:bg-transparent"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {time || 'time'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 bg-popover border-border" align="end">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Select time</label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-muted border-border text-foreground"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-3 ml-2 text-base font-medium"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer Text */}
      <div className="text-center text-sm text-muted-foreground mt-8">
        Using BookaMOT means you agree to the <a href="#" className="underline">Terms of Use</a>. See our <a href="#" className="underline">Privacy Statement</a>.
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