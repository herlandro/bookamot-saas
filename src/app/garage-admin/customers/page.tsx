'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterConfig } from '@/components/ui/advanced-filter-panel';
import { exportCustomersToCSV } from '@/lib/export/csv-export';
import { Search, Filter, Download, User, Eye, Edit, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    customerId: string;
    customerName: string;
  }>({
    isOpen: false,
    customerId: '',
    customerName: '',
  });
  const [filters, setFilters] = useState<FilterConfig>({
    status: '',
    bookingCountMin: undefined,
    bookingCountMax: undefined,
    dateFrom: '',
    dateTo: '',
    sortBy: 'name',
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

    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, currentPage, debouncedSearchTerm, filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = `/api/garage-admin/customers?page=${currentPage}&limit=10&sortBy=${filters.sortBy || 'name'}&sortOrder=${filters.sortOrder || 'asc'}`;

      if (debouncedSearchTerm) {
        url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
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

  const toggleCustomerSelection = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Action handlers
  const handleViewCustomer = (customerId: string) => {
    router.push(`/garage-admin/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: string) => {
    router.push(`/garage-admin/customers/${customerId}/edit`);
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      customerId,
      customerName,
    });
  };

  const confirmDeleteCustomer = async () => {
    try {
      const response = await fetch(`/api/garage-admin/customers/${deleteConfirmation.customerId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh the customers list
        fetchCustomers();
        // Remove from selected if it was selected
        const newSelected = new Set(selectedCustomers);
        newSelected.delete(deleteConfirmation.customerId);
        setSelectedCustomers(newSelected);
        // Close the confirmation modal
        setDeleteConfirmation({ isOpen: false, customerId: '', customerName: '' });
      } else {
        alert('Failed to delete customer. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('An error occurred while deleting the customer.');
    }
  };

  const cancelDeleteCustomer = () => {
    setDeleteConfirmation({ isOpen: false, customerId: '', customerName: '' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header - Outside Card */}
          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <User className="h-6 w-6" />
              Customers
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all customers who have made bookings
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="shadow-xl rounded-lg border border-border bg-card">
            {/* Toolbar Section - Inside Card */}
            <CardContent className="pt-6 pb-0">
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <form onSubmit={handleSearch} className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search customer..."
                    className="pl-9 w-full"
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
                  Export
                </Button>
              </div>

              {/* Selection Toolbar */}
              {selectedCustomers.size > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedCustomers.size} Selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setSelectedCustomers(new Set())}
                  >
                    Delete Selected
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Table Section */}
            <CardContent className="pt-0">
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No customers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCustomers.size === customers.length && customers.length > 0}
                            onChange={toggleAllSelection}
                          />
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Bookings</TableHead>
                        <TableHead>Last Booking</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomers.has(customer.id)}
                              onChange={() => toggleCustomerSelection(customer.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(customer.name)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{customer.phone}</TableCell>
                          <TableCell className="text-sm font-medium">{customer.totalBookings}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(customer.lastBookingDate)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(customer.joinedDate)}
                          </TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 hover:bg-muted transition-colors flex items-center gap-1"
                                >
                                  <span className="text-sm">Actions</span>
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem
                                  onClick={() => handleViewCustomer(customer.id)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditCustomer(customer.id)}
                                  className="cursor-pointer"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Pagination Footer */}
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

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => !open && cancelDeleteCustomer()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmation.customerName}</strong>? 
              This action cannot be undone and will permanently remove all customer data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteCustomer}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GarageLayout>
  );
}
