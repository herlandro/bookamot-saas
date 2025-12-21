'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Search, Loader2, Building2, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Garage {
  id: string;
  name: string;
  email: string;
  city: string;
  postcode: string;
  motPrice: number;
  isActive: boolean;
  dvlaApproved: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  rating: number;
  createdAt: string;
  owner: { name: string; email: string };
  _count: { bookings: number; reviews: number };
}

export default function GaragesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const [garages, setGarages] = useState<Garage[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchGarages = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setSearching(true);
    }
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10', search, status: statusFilter });
      const response = await fetch(`/api/admin/garages?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Garantir que approvalStatus está presente em todas as garagens
        const garagesWithStatus = data.garages.map((garage: any) => ({
          ...garage,
          approvalStatus: garage.approvalStatus || 'PENDING'
        }));
        setGarages(garagesWithStatus);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching garages:', error);
    } finally {
      setInitialLoading(false);
      setSearching(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId || userRole !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    // Only show initial loading spinner on first load
    const isInitial = initialLoading && garages.length === 0;
    fetchGarages(isInitial);
  }, [userId, userRole, status, router, fetchGarages]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      await fetch(`/api/admin/garages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      setGarages(prev => prev.map(g => g.id === id ? { ...g, isActive: !currentActive } : g));
    } catch (error) {
      console.error('Error toggling garage status:', error);
    } finally {
      setTogglingId(null);
    }
  };

  if (status === 'loading' || initialLoading) {
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
            Gerenciamento de Garagens
          </h1>
          <p className="text-muted-foreground">Visualize e gerencie todas as garagens registradas</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Todas as Garagens ({total})</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as garagens</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="INFO_REQUESTED">Info Requested</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  {searching ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar garagens..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Garagem</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estatísticas</TableHead>
                  <TableHead>Status DVLA</TableHead>
                  <TableHead>Approval Status</TableHead>
                  <TableHead>Ativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {garages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {search || statusFilter !== 'all'
                        ? 'Nenhuma garagem encontrada com os critérios de busca.'
                        : 'Nenhuma garagem registrada ainda.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  garages.map((garage) => (
                    <TableRow key={garage.id}>
                      <TableCell>
                        <p className="font-medium">{garage.name}</p>
                        <p className="text-sm text-muted-foreground">{garage.email}</p>
                      </TableCell>
                      <TableCell>
                        <p>{garage.owner.name}</p>
                        <p className="text-sm text-muted-foreground">{garage.owner.email}</p>
                      </TableCell>
                      <TableCell>{garage.city}, {garage.postcode}</TableCell>
                      <TableCell>£{garage.motPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{garage._count.bookings} bookings</p>
                          <p className="flex items-center gap-1">{garage._count.reviews} reviews</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={garage.dvlaApproved ? 'default' : 'destructive'}>
                          {garage.dvlaApproved ? 'Aprovado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!garage.approvalStatus || garage.approvalStatus === 'PENDING' ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                        ) : garage.approvalStatus === 'APPROVED' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Approved
                          </Badge>
                        ) : garage.approvalStatus === 'REJECTED' ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Rejected
                          </Badge>
                        ) : garage.approvalStatus === 'INFO_REQUESTED' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Info Requested
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {garage.approvalStatus}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={garage.isActive}
                          onCheckedChange={() => toggleActive(garage.id, garage.isActive)}
                          disabled={togglingId === garage.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

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
      </div>
    </AdminLayout>
  );
}
