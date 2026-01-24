'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { 
  Search, Check, X, Loader2, Building2, Eye, Mail, Phone, MapPin, 
  Calendar, Clock, MessageSquare, History, AlertCircle, CheckCircle2, HelpCircle,
  Globe, FileText, Map
} from 'lucide-react';
import { format } from 'date-fns';

interface ApprovalLog {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
  admin: { name: string | null; email: string };
}

interface Garage {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  postcode: string;
  address: string;
  description: string | null;
  website: string | null;
  motLicenseNumber: string;
  motPrice: number;
  retestPrice: number;
  latitude: number | null;
  longitude: number | null;
  openingHours: any; // JSON object
  createdAt: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  rejectionReason: string | null;
  owner: { 
    id: string;
    name: string | null; 
    email: string; 
    phone: string | null;
    emailVerified: string | null;
    createdAt: string;
  };
  approvalLogs: ApprovalLog[];
}

export default function PendingGaragesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const [garages, setGarages] = useState<Garage[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [region, setRegion] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'city' | 'postcode' | 'id'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detail modal state
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    garage: Garage;
    action: 'approve' | 'reject' | 'request_info';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchGarages = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setSearching(true);
    }
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status: statusFilter,
        region,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      });
      const response = await fetch(`/api/admin/garages/pending?${params}`);
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        setErrorMessage(err?.error || 'Failed to fetch pending garages');
        setGarages([]);
        setTotalPages(1);
        setTotal(0);
        return;
      }
      const data = await response.json();
      setGarages(data.garages || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      setErrorMessage('Failed to fetch pending garages');
      setGarages([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setInitialLoading(false);
      setSearching(false);
    }
  }, [page, search, statusFilter, region, dateFrom, dateTo, sortBy, sortOrder]);

  const toggleSort = (column: 'createdAt' | 'name' | 'city' | 'postcode' | 'id') => {
    setPage(1);
    setSortBy((prev) => {
      if (prev === column) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('asc');
      return column;
    });
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId || userRole !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    const isInitial = initialLoading && garages.length === 0;
    fetchGarages(isInitial);
  }, [userId, userRole, status, router, fetchGarages]);

  const handleAction = async () => {
    if (!actionModal) {
      return;
    }
    
    // Validate required fields
    if ((actionModal.action === 'reject' || actionModal.action === 'request_info') && !actionReason.trim()) {
      setErrorMessage(`${actionModal.action === 'reject' ? 'Rejection reason' : 'Information request'} is required`);
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/admin/garages/${actionModal.garage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: actionModal.action,
          reason: actionReason.trim() || undefined
        })
      });

      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setErrorMessage('Invalid response from server. Please try again.');
        return;
      }

      if (response.ok) {
        // Check if email was sent successfully
        if (data.emailSent === false && data.emailError) {
          // Show warning but still proceed with success
          setErrorMessage(`Garage ${actionModal.action === 'request_info' ? 'info requested' : actionModal.action + 'd'} successfully, but email could not be sent: ${data.emailError}`);
          // Still proceed with the action
        }
        
        // If action was reject, redirect to main listing
        if (actionModal.action === 'reject') {
          router.push('/admin/garages');
        } else {
          // Refresh the list
          await fetchGarages();
        }
        
        // Close modals and reset state
        setActionModal(null);
        setActionReason('');
        setShowDetailModal(false);
        setSelectedGarage(null);
      } else {
        // Handle error response
        const errorMsg = data.error || data.message || data.details || `Failed to ${actionModal.action} garage. Please try again.`;
        setErrorMessage(errorMsg);
        console.error('Error processing garage:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setErrorMessage(errorMsg);
      console.error('Error processing garage:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openDetailModal = (garage: Garage) => {
    setSelectedGarage(garage);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'INFO_REQUESTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info Requested</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            Garage Approvals
          </h1>
          <p className="text-muted-foreground">Review and approve new garage registrations</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                Pending Garages
                <Badge variant="secondary">{total}</Badge>
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Pending</SelectItem>
                      <SelectItem value="PENDING">New</SelectItem>
                      <SelectItem value="INFO_REQUESTED">Info Requested</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Region (city/postcode)"
                    value={region}
                    onChange={(e) => { setRegion(e.target.value); setPage(1); }}
                    className="w-full sm:w-52"
                  />

                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="w-full sm:w-40"
                  />

                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="w-full sm:w-40"
                  />
                </div>

                <div className="relative w-full sm:w-64">
                  {searching ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchGarages(true)}>
                  Tentar novamente
                </Button>
              </div>
            )}

            {garages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No pending garages</p>
                <p className="text-sm">
                  {search 
                    ? 'No garages found matching your search criteria.' 
                    : 'All garage registrations have been processed.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden md:table-cell">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort('id')}
                      >
                        ID
                        {sortBy === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort('name')}
                      >
                        Nome
                        {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort('city')}
                      >
                        Address
                        {sortBy === 'city' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort('createdAt')}
                      >
                        Submitted on
                        {sortBy === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {garages.map((garage) => (
                    <TableRow key={garage.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailModal(garage)}>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">{garage.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium leading-tight">{garage.name}</p>
                            {getStatusBadge(garage.approvalStatus)}
                          </div>
                          <p className="text-xs text-muted-foreground md:hidden font-mono">{garage.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{garage.address}</p>
                          <p className="text-xs text-muted-foreground">{garage.city}, {garage.postcode}</p>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(garage.createdAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => openDetailModal(garage)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:bg-green-50" 
                            onClick={() => setActionModal({ garage, action: 'approve' })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50" 
                            onClick={() => setActionModal({ garage, action: 'reject' })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedGarage && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    {selectedGarage.name}
                    {getStatusBadge(selectedGarage.approvalStatus)}
                  </DialogTitle>
                  <DialogDescription>
                    Registered on {format(new Date(selectedGarage.createdAt), 'dd MMMM yyyy \'at\' HH:mm')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Garage Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </p>
                      <p className="text-sm">{selectedGarage.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </p>
                      <p className="text-sm">{selectedGarage.phone}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Address
                      </p>
                      <p className="text-sm">{selectedGarage.address}</p>
                      <p className="text-sm text-muted-foreground">{selectedGarage.city}, {selectedGarage.postcode}</p>
                      {selectedGarage.latitude && selectedGarage.longitude && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Map className="h-3 w-3" />
                          Coordinates: {selectedGarage.latitude.toFixed(6)}, {selectedGarage.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                    {selectedGarage.website && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Website
                        </p>
                        <a 
                          href={selectedGarage.website.startsWith('http') ? selectedGarage.website : `https://${selectedGarage.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedGarage.website}
                        </a>
                      </div>
                    )}
                    {selectedGarage.description && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Description
                        </p>
                        <p className="text-sm">{selectedGarage.description}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">MOT License Number</p>
                      <p className="text-sm font-mono">{selectedGarage.motLicenseNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">MOT Price</p>
                      <p className="text-sm">£{selectedGarage.motPrice.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Retest Price</p>
                      <p className="text-sm">£{selectedGarage.retestPrice.toFixed(2)}</p>
                    </div>
                    {selectedGarage.openingHours && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Opening Hours
                        </p>
                        <div className="text-sm space-y-1">
                          {Object.entries(selectedGarage.openingHours as Record<string, any>).map(([day, hours]: [string, any]) => (
                            <div key={day} className="flex justify-between">
                              <span className="capitalize font-medium">{day}:</span>
                              <span>
                                {hours?.open && hours?.close 
                                  ? `${hours.open} - ${hours.close}`
                                  : 'Closed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Owner Info */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Owner Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-sm">{selectedGarage.owner.name || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm">{selectedGarage.owner.email}</p>
                          {selectedGarage.owner.emailVerified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">Unverified</Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-sm">{selectedGarage.owner.phone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                        <p className="text-sm">{format(new Date(selectedGarage.owner.createdAt), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Previous Info Request */}
                  {selectedGarage.approvalStatus === 'INFO_REQUESTED' && selectedGarage.rejectionReason && (
                    <div className="border-t pt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800">Information Requested</h4>
                            <p className="text-sm text-blue-700 mt-1">{selectedGarage.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approval History */}
                  {selectedGarage.approvalLogs && selectedGarage.approvalLogs.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <History className="h-4 w-4" /> Approval History
                      </h4>
                      <div className="space-y-3">
                        {selectedGarage.approvalLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{log.action.replace('_', ' ')}</span>
                                <span className="text-muted-foreground">
                                  by {log.admin.name || log.admin.email}
                                </span>
                              </div>
                              {log.reason && (
                                <p className="text-muted-foreground mt-1">&ldquo;{log.reason}&rdquo;</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(log.createdAt), 'dd MMM yyyy \'at\' HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => setActionModal({ garage: selectedGarage, action: 'request_info' })}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Info
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setActionModal({ garage: selectedGarage, action: 'reject' })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setActionModal({ garage: selectedGarage, action: 'approve' })}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Confirmation Modal */}
        <Dialog open={!!actionModal} onOpenChange={() => { 
          setActionModal(null); 
          setActionReason(''); 
          setErrorMessage(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionModal?.action === 'approve' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {actionModal?.action === 'reject' && <AlertCircle className="h-5 w-5 text-red-600" />}
                {actionModal?.action === 'request_info' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                {actionModal?.action === 'approve' && 'Approve Garage'}
                {actionModal?.action === 'reject' && 'Reject Garage'}
                {actionModal?.action === 'request_info' && 'Request Additional Information'}
              </DialogTitle>
              <DialogDescription>
                {actionModal?.action === 'approve' && (
                  <>This will activate <strong>{actionModal.garage.name}</strong> and allow them to receive bookings. An approval email will be sent to the owner.</>
                )}
                {actionModal?.action === 'reject' && (
                  <>This will reject the registration of <strong>{actionModal?.garage.name}</strong>. Please provide a reason for rejection.</>
                )}
                {actionModal?.action === 'request_info' && (
                  <>Request additional information from <strong>{actionModal?.garage.name}</strong> before making a decision.</>
                )}
              </DialogDescription>
            </DialogHeader>

            {(actionModal?.action === 'reject' || actionModal?.action === 'request_info') && (
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">
                  {actionModal.action === 'reject' ? 'Rejection Reason *' : 'Information Needed *'}
                </label>
                <Textarea
                  placeholder={actionModal.action === 'reject' 
                    ? 'Please explain why this garage registration is being rejected...'
                    : 'Specify what additional information you need from this garage...'}
                  value={actionReason}
                  onChange={(e) => {
                    setActionReason(e.target.value);
                    // Clear error message when user starts typing
                    if (errorMessage) setErrorMessage(null);
                  }}
                  rows={4}
                />
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionModal(null); setActionReason(''); }} disabled={processing}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={processing || ((actionModal?.action === 'reject' || actionModal?.action === 'request_info') && !actionReason.trim())}
                className={
                  actionModal?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionModal?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {actionModal?.action === 'approve' && 'Approve'}
                {actionModal?.action === 'reject' && 'Reject'}
                {actionModal?.action === 'request_info' && 'Send Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
