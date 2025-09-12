'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { MapPinIcon, ClockIcon, PhoneIcon, StarIcon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

interface Garage {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  motPrice: number;
  distance?: number;
  rating?: number;
  reviewCount?: number;
  availableSlots: string[];
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postcode = searchParams.get('postcode');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const isQuick = searchParams.get('quick') === 'true';

  useEffect(() => {
    const fetchGarages = async () => {
      try {
        setIsLoading(true);
        
        const params = new URLSearchParams();
        if (postcode) params.append('postcode', postcode);
        if (lat) params.append('lat', lat);
        if (lng) params.append('lng', lng);
        if (date) params.append('date', date);
        if (time) params.append('time', time);
        
        const response = await fetch(`/api/garages/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch garages');
        }
        
        const data = await response.json();
        setGarages(data.garages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGarages();
  }, [postcode, lat, lng, date, time]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBookNow = (garageId: string, timeSlot?: string) => {
    const bookingParams = new URLSearchParams();
    bookingParams.append('garageId', garageId);
    if (date) bookingParams.append('date', date);
    if (timeSlot) bookingParams.append('time', timeSlot);
    
    window.location.href = `/booking?${bookingParams.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for available MOT slots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Link href="/">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-full bg-white dark:bg-gray-900">
        <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isQuick ? 'Quick MOT Booking Results' : 'MOT Test Results'}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
            {postcode && (
              <Badge variant="outline" className="flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <MapPinIcon className="w-3 h-3 mr-1" />
                {postcode}
              </Badge>
            )}
            {(lat && lng) && !postcode && (
              <Badge variant="outline" className="flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <MapPinIcon className="w-3 h-3 mr-1" />
                Current Location
              </Badge>
            )}
            {date && (
              <Badge variant="outline" className="flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <ClockIcon className="w-3 h-3 mr-1" />
                {formatDate(date)}
              </Badge>
            )}
            {time && (
              <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {time}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Found {garages.length} available MOT centre{garages.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Results */}
        {garages.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No MOT centres found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Try adjusting your search criteria or location.
              </p>
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">New Search</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {garages.map((garage) => (
              <Card key={garage.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">{garage.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {garage.address}, {garage.city}, {garage.postcode}
                        {garage.distance && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">
                            ({garage.distance.toFixed(1)} miles away)
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        £{garage.motPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">MOT Test</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {garage.phone}
                      </div>
                      {garage.rating && (
                        <div className="flex items-center text-sm">
                          <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                          {garage.rating.toFixed(1)}
                          {garage.reviewCount && (
                            <span className="text-gray-500 dark:text-gray-400 ml-1">
                              ({garage.reviewCount} reviews)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {garage.availableSlots && garage.availableSlots.length > 0 ? (
                        <>
                          {garage.availableSlots.slice(0, 3).map((slot) => (
                            <Button
                              key={slot}
                              variant="outline"
                              size="sm"
                              onClick={() => handleBookNow(garage.id, slot)}
                              className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                            >
                              {slot}
                            </Button>
                          ))}
                          {garage.availableSlots.length > 3 && (
                            <Button
                              variant="default"
                              onClick={() => handleBookNow(garage.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Book Now
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="default"
                          onClick={() => handleBookNow(garage.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Book Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </main>
      </div>
    </MainLayout>
  );
}