'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdvancedFilterPanel, FilterConfig } from '@/components/ui/advanced-filter-panel';
import { exportVehiclesToCSV } from '@/lib/export/csv-export';
import { Search, Filter, Download, Car, User, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  ownerName: string;
  totalBookings: number;
  lastBookingDate: string | null;
  motStatus: 'valid' | 'expiring_soon' | 'expired' | 'failed' | 'unknown';
  lastMotDate: string | null;
}

export default function VehiclesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterConfig>({
    motStatus: '',
    bookingCountMin: undefined,
    bookingCountMax: undefined,
    yearMin: undefined,
    yearMax: undefined,
    make: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'registration',
    sortOrder: 'asc',
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/signin');
      return;
    }

    if (session.user.role !== 'GARAGE_OWNER') {
      router.push('/dashboard');
      return;
    }

    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, currentPage, debouncedSearchTerm, filters]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      let url = `/api/garage-admin/vehicles?page=${currentPage}&limit=10&sortBy=${filters.sortBy || 'registration'}&sortOrder=${filters.sortOrder || 'asc'}`;

      if (debouncedSearchTerm) {
        url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
      }

      if (filters.motStatus) {
        url += `&motStatus=${filters.motStatus}`;
      }

      if (filters.bookingCountMin !== undefined) {
        url += `&bookingCountMin=${filters.bookingCountMin}`;
      }

      if (filters.bookingCountMax !== undefined) {
        url += `&bookingCountMax=${filters.bookingCountMax}`;
      }

      if (filters.yearMin !== undefined) {
        url += `&yearMin=${filters.yearMin}`;
      }

      if (filters.yearMax !== undefined) {
        url += `&yearMax=${filters.yearMax}`;
      }

      if (filters.make) {
        url += `&make=${filters.make}`;
      }

      if (filters.dateFrom) {
        url += `&dateFrom=${filters.dateFrom}`;
      }

      if (filters.dateTo) {
        url += `&dateTo=${filters.dateTo}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getMotStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">MOT Valid</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">MOT Expired</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">MOT Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Unknown</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section - Outside Card */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
                  <Car className="h-6 w-6" />
                  Vehicles
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage all vehicles that have made bookings
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by registration, make or model..."
                    className="pl-9 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const exportData = vehicles.map(v => ({
                      registration: v.registration,
                      make: v.make,
                      model: v.model,
                      year: v.year,
                      ownerName: v.ownerName,
                      totalBookings: v.totalBookings,
                      lastBookingDate: v.lastBookingDate,
                      motStatus: v.motStatus,
                      lastMotDate: v.lastMotDate,
                    }));
                    exportVehiclesToCSV(exportData);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardContent className="space-y-6 pt-6">
              <AdvancedFilterPanel
                type="vehicles"
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(1);
                }}
                onClearFilters={() => {
                  setFilters({
                    motStatus: '',
                    bookingCountMin: undefined,
                    bookingCountMax: undefined,
                    yearMin: undefined,
                    yearMax: undefined,
                    make: '',
                    dateFrom: '',
                    dateTo: '',
                    sortBy: 'registration',
                    sortOrder: 'asc',
                  });
                  setCurrentPage(1);
                }}
                motStatusOptions={[
                  { label: 'MOT Valid', value: 'valid' },
                  { label: 'Expiring Soon', value: 'expiring_soon' },
                  { label: 'MOT Expired', value: 'expired' },
                  { label: 'MOT Failed', value: 'failed' },
                  { label: 'Unknown', value: 'unknown' },
                ]}
                sortOptions={[
                  { label: 'Registration (A-Z)', value: 'registration' },
                  { label: 'Make (A-Z)', value: 'make' },
                  { label: 'Year (New-Old)', value: 'year' },
                  { label: 'Total Bookings', value: 'totalBookings' },
                  { label: 'Last Booking', value: 'lastBookingDate' },
                ]}
              />
            </CardContent>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No vehicles found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-lg">{vehicle.registration}</span>
                            {getMotStatusBadge(vehicle.motStatus)}
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <span>{vehicle.make} {vehicle.model} ({vehicle.year})</span>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Owner: {vehicle.ownerName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Total bookings:</span>
                            <span className="font-medium">{vehicle.totalBookings}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Last booking:</span>
                            <span className="font-medium">{formatDate(vehicle.lastBookingDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Last MOT:</span>
                            <span className="font-medium">{formatDate(vehicle.lastMotDate)}</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="md:self-center"
                          onClick={() => router.push(`/garage-admin/vehicles/${vehicle.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm text-muted-foreground">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </GarageLayout>
  );
}

