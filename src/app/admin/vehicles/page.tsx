'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Search, Loader2, Car, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  motExpiry: string | null;
  createdAt: string;
  owner: { name: string; email: string };
  _count: { bookings: number };
}

export default function VehiclesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10', search });
      const response = await fetch(`/api/admin/vehicles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    fetchVehicles();
  }, [session, status, router, fetchVehicles]);

  const getMotStatus = (expiry: string | null) => {
    if (!expiry) return { label: 'Unknown', variant: 'secondary' as const };
    const expiryDate = new Date(expiry);
    const now = new Date();
    const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { label: 'Expired', variant: 'destructive' as const };
    if (daysUntil <= 30) return { label: 'Expiring Soon', variant: 'warning' as const };
    return { label: 'Valid', variant: 'default' as const };
  };

  if (status === 'loading' || (loading && vehicles.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Car className="h-6 w-6" />
            Vehicles Management
          </h1>
          <p className="text-muted-foreground">View all registered vehicles</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>All Vehicles ({total})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>MOT Expiry</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const motStatus = getMotStatus(vehicle.motExpiry);
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-mono font-bold">{vehicle.registration}</TableCell>
                      <TableCell>
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.color} • {vehicle.fuelType}</p>
                      </TableCell>
                      <TableCell>
                        <p>{vehicle.owner.name}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.owner.email}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={motStatus.variant}>{motStatus.label}</Badge>
                          {vehicle.motExpiry && <span className="text-xs text-muted-foreground">{format(new Date(vehicle.motExpiry), 'dd MMM yyyy')}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                          {vehicle._count.bookings}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(vehicle.createdAt), 'dd MMM yyyy')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="py-2 px-3 text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

