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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Search, Check, X, Loader2, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Garage {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  postcode: string;
  address: string;
  motPrice: number;
  createdAt: string;
  owner: { name: string; email: string; phone: string };
}

export default function PendingGaragesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionGarage, setActionGarage] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchGarages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10', search });
      const response = await fetch(`/api/admin/garages/pending?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGarages(data.garages);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching garages:', error);
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
    fetchGarages();
  }, [session, status, router, fetchGarages]);

  const handleAction = async () => {
    if (!actionGarage) return;
    setProcessing(true);
    try {
      if (actionGarage.action === 'approve') {
        await fetch(`/api/admin/garages/${actionGarage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true })
        });
      } else {
        await fetch(`/api/admin/garages/${actionGarage.id}`, { method: 'DELETE' });
      }
      fetchGarages();
    } catch (error) {
      console.error('Error processing garage:', error);
    } finally {
      setProcessing(false);
      setActionGarage(null);
    }
  };

  if (status === 'loading' || (loading && garages.length === 0)) {
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
            <Building2 className="h-6 w-6" />
            Pending Garage Activations
          </h1>
          <p className="text-muted-foreground">Review and approve new garage registrations</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Garages ({garages.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search garages..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {garages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending garages</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Garage</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>MOT Price</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {garages.map((garage) => (
                    <TableRow key={garage.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{garage.name}</p>
                          <p className="text-sm text-muted-foreground">{garage.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{garage.owner.name}</p>
                        <p className="text-sm text-muted-foreground">{garage.owner.email}</p>
                      </TableCell>
                      <TableCell>
                        <p>{garage.city}</p>
                        <p className="text-sm text-muted-foreground">{garage.postcode}</p>
                      </TableCell>
                      <TableCell>£{garage.motPrice.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(garage.createdAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => setActionGarage({ id: garage.id, action: 'approve' })}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setActionGarage({ id: garage.id, action: 'reject' })}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="py-2 px-3 text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!actionGarage} onOpenChange={() => setActionGarage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionGarage?.action === 'approve' ? 'Approve Garage' : 'Reject Garage'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionGarage?.action === 'approve'
                  ? 'This will activate the garage and allow them to receive bookings.'
                  : 'This will permanently delete the garage registration.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAction}
                disabled={processing}
                className={actionGarage?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {actionGarage?.action === 'approve' ? 'Approve' : 'Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

