'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleDetail {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  engineSize: string;
  mileage: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  totalBookings: number;
  totalRevenue: number;
  completedBookings: number;
  motStatus: string;
  daysUntilExpiry: number | null;
  latestMot: {
    testDate: string;
    result: string;
    certificateNumber: string;
    expiryDate: string | null;
    mileage: number;
    testLocation: string;
    defects: {
      dangerous: number;
      major: number;
      minor: number;
      advisory: number;
    };
  } | null;
  bookings: Array<{
    id: string;
    reference: string;
    date: string;
    timeSlot: string;
    status: string;
    totalPrice: number;
    customer: {
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
  motHistory: Array<{
    id: string;
    testDate: string;
    result: string;
    certificateNumber: string;
    expiryDate: string | null;
    mileage: number;
    testLocation: string;
    defects: {
      dangerous: number;
      major: number;
      minor: number;
      advisory: number;
    };
  }>;
}

export default function VehicleDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

    fetchVehicleDetails();
  }, [session, status, router, vehicleId]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/garage-admin/vehicles/${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        setVehicle(data.vehicle);
      } else {
        console.error('Failed to fetch vehicle details');
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  const getMotStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getMotResultBadge = (result: string) => {
    switch (result) {
      case 'PASS':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Passed</Badge>;
      case 'FAIL':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'ADVISORY':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Advisory</Badge>;
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <GarageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </GarageLayout>
    );
  }

  if (!vehicle) {
    return (
      <GarageLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button
              onClick={() => router.push('/garage-admin/vehicles')}
              variant="outline"
              className="flex items-center gap-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Vehicle not found</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </GarageLayout>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    onClick={() => router.push('/garage-admin/vehicles')}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-2xl font-bold text-foreground">{vehicle.registration}</h1>
                </div>
                <p className="text-muted-foreground text-sm">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
              </div>
              <div>
                {getMotStatusBadge(vehicle.motStatus)}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color:</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuel Type:</span>
                  <span className="font-medium">{vehicle.fuelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engine Size:</span>
                  <span className="font-medium">{vehicle.engineSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mileage:</span>
                  <span className="font-medium">{vehicle.mileage} km</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Name</p>
                  <p className="font-medium">{vehicle.owner.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vehicle.owner.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vehicle.owner.phone}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => router.push(`/garage-admin/customers/${vehicle.owner.id}`)}
                >
                  View Customer Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* MOT Status */}
          {vehicle.latestMot && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Latest MOT</span>
                  {getMotResultBadge(vehicle.latestMot.result)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Test Date</p>
                    <p className="font-medium">{formatDate(vehicle.latestMot.testDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Expiry Date</p>
                    <p className="font-medium">{vehicle.latestMot.expiryDate ? formatDate(vehicle.latestMot.expiryDate) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Days Until Expiry</p>
                    <p className={`font-medium ${vehicle.daysUntilExpiry && vehicle.daysUntilExpiry <= 30 ? 'text-red-600' : ''}`}>
                      {vehicle.daysUntilExpiry !== null ? `${vehicle.daysUntilExpiry} days` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Dangerous Defects</p>
                    <p className="text-2xl font-bold text-red-600">{vehicle.latestMot.defects.dangerous}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Major Defects</p>
                    <p className="text-2xl font-bold text-orange-600">{vehicle.latestMot.defects.major}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Minor Defects</p>
                    <p className="text-2xl font-bold text-yellow-600">{vehicle.latestMot.defects.minor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Advisory</p>
                    <p className="text-2xl font-bold text-blue-600">{vehicle.latestMot.defects.advisory}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{vehicle.totalBookings}</p>
                <p className="text-sm text-muted-foreground mt-1">{vehicle.completedBookings} completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(vehicle.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {vehicle.totalBookings > 0 ? ((vehicle.completedBookings / vehicle.totalBookings) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bookings History */}
          {vehicle.bookings.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>All bookings for this vehicle at this garage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">Reference</th>
                        <th className="text-left py-3 px-4 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicle.bookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{booking.reference}</td>
                          <td className="py-3 px-4">{booking.customer.name}</td>
                          <td className="py-3 px-4">{formatDate(booking.date)}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{booking.status}</Badge>
                          </td>
                          <td className="py-3 px-4">{formatCurrency(booking.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* MOT History */}
          {vehicle.motHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>MOT History</CardTitle>
                <CardDescription>All MOT tests for this vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicle.motHistory.map((mot) => (
                    <div key={mot.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{formatDate(mot.testDate)}</p>
                          <p className="text-sm text-muted-foreground">{mot.testLocation}</p>
                        </div>
                        {getMotResultBadge(mot.result)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Certificate:</span> {mot.certificateNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expiry:</span> {mot.expiryDate ? formatDate(mot.expiryDate) : 'N/A'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mileage:</span> {mot.mileage} km
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </GarageLayout>
  );
}

