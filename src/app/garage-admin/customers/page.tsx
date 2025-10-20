'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdvancedFilterPanel, FilterConfig } from '@/components/ui/advanced-filter-panel';
import { exportCustomersToCSV } from '@/lib/export/csv-export';
import { ArrowLeft, Search, Filter, Download, User, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastBookingDate: string | null;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterConfig>({
    status: '',
    bookingCountMin: undefined,
    bookingCountMax: undefined,
    dateFrom: '',
    dateTo: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });

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

    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, currentPage, searchTerm, filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = `/api/garage-admin/customers?page=${currentPage}&limit=10&sortBy=${filters.sortBy || 'name'}&sortOrder=${filters.sortOrder || 'asc'}`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (filters.status) {
        url += `&status=${filters.status}`;
      }

      if (filters.bookingCountMin !== undefined) {
        url += `&bookingCountMin=${filters.bookingCountMin}`;
      }

      if (filters.bookingCountMax !== undefined) {
        url += `&bookingCountMax=${filters.bookingCountMax}`;
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
        setCustomers(data.customers || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
      : <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Inactive</Badge>;
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
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Customers Management</h1>
                <p className="text-muted-foreground text-sm">View all customers who have made bookings at your garage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customers
                  </CardTitle>
                  <CardDescription>
                    Manage all customers who have made bookings
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name, email or phone..."
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
                      const exportData = customers.map(c => ({
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        totalBookings: c.totalBookings,
                        lastBookingDate: c.lastBookingDate,
                        status: c.status,
                        joinedDate: c.joinedDate,
                      }));
                      exportCustomersToCSV(exportData);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdvancedFilterPanel
                type="customers"
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(1);
                }}
                onClearFilters={() => {
                  setFilters({
                    status: '',
                    bookingCountMin: undefined,
                    bookingCountMax: undefined,
                    dateFrom: '',
                    dateTo: '',
                    sortBy: 'name',
                    sortOrder: 'asc',
                  });
                  setCurrentPage(1);
                }}
                statusOptions={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
                sortOptions={[
                  { label: 'Name (A-Z)', value: 'name' },
                  { label: 'Total Bookings', value: 'totalBookings' },
                  { label: 'Last Booking', value: 'lastBookingDate' },
                  { label: 'Join Date', value: 'joinedDate' },
                ]}
              />
            </CardContent>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No customers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{customer.name}</span>
                            {getStatusBadge(customer.status)}
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Member since:</span>
                            <span className="font-medium">{formatDate(customer.joinedDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Total bookings:</span>
                            <span className="font-medium">{customer.totalBookings}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Last booking:</span>
                            <span className="font-medium">{formatDate(customer.lastBookingDate)}</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="md:self-center"
                          onClick={() => router.push(`/garage-admin/customers/${customer.id}`)}
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

