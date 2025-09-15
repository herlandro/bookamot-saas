'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, MapPin, CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function HomePage() {
  const [postcode, setPostcode] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    // If no filters are provided, get user's location automatically
    if (!postcode && !date && !time) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            router.push(`/search-results?lat=${latitude}&lng=${longitude}`);
          },
          (error) => {
            console.error('Error getting location:', error);
            // Fallback to general search
            router.push('/search-results');
          }
        );
      } else {
        // Fallback to general search
        router.push('/search-results');
      }
    } else {
      // Build search query with provided filters
      const searchParams = new URLSearchParams();
      if (postcode) searchParams.append('postcode', postcode);
      if (date) searchParams.append('date', format(date, 'yyyy-MM-dd'));
      if (time) searchParams.append('time', time);
      
      router.push(`/search-results?${searchParams.toString()}`);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo purposes, we'll just trigger the search with coordinates
          const { latitude, longitude } = position.coords;
          router.push(`/search-results?lat=${latitude}&lng=${longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter a postcode manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

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
                <Input
                  placeholder="vehicle registration"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="border-0 focus:ring-0 text-base bg-transparent placeholder-muted-foreground text-foreground font-medium"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div className="w-px h-8 bg-border mx-2"></div>
              
              {/* Post Code Input */}
              <div className="flex-1 px-4 py-3">
                <Input
                  placeholder="post code"
                  className="border-0 focus:ring-0 text-base bg-transparent placeholder-muted-foreground text-foreground"
                />
              </div>
              
              <div className="w-px h-8 bg-border mx-2"></div>
              
              {/* Date Picker */}
              <div className="flex-1 px-4 py-3">
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="w-px h-8 bg-border mx-2"></div>
              
              {/* Time Picker */}
              <div className="flex-1 px-4 py-3">
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
      </div>
    </div>
  );
}