'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { Loader2, Calendar as CalendarIcon, Search, ChevronDown, Pencil, Trash2, Users, Building2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

// Format date and time as DD/MM/YYYY HH:mm
function formatBookingDateTime(dateISO: string, timeSlot: string): string {
  const date = new Date(dateISO)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year} ${timeSlot}`
}

interface AdminBookingItem {
  id: string
  reference: string
  dateISO: string
  timeSlot: string
  status: string
  statusBadge: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'
  totalPrice: number
  customer: { id: string; name: string; email: string; image: string | null }
  garage: { id: string; name: string; email: string; image: string | null }
  vehicle: { id: string; registration: string; make: string; model: string } | null
  createdAt: string
}

interface BookingDetail {
  id: string
  reference: string
  dateISO: string
  timeSlot: string
  status: string
  totalPrice: number
  notes: string | null
  paymentStatus: string
  customer: { id: string; name: string | null; email: string; image: string | null }
  garage: { id: string; name: string; email: string }
  vehicle: { id: string; registration: string; make: string; model: string } | null
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState<AdminBookingItem[]>([])
  const [allBookings, setAllBookings] = useState<AdminBookingItem[]>([])
  const [clientMode, setClientMode] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'totalPrice' | 'createdAt'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [searching, setSearching] = useState(false)
  const [customerSuggestions, setCustomerSuggestions] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasFetchedInitial = useRef(false)
  const isFetching = useRef(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewDetail, setViewDetail] = useState<BookingDetail | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [editStatus, setEditStatus] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const recentKey = 'adminBookingsSearchHistory'

  const pagedItems = useMemo(() => {
    if (!clientMode) return bookings
    const sorted = [...allBookings].sort((a, b) => {
      const av = sortBy === 'date' ? new Date(a.dateISO).getTime() : sortBy === 'totalPrice' ? a.totalPrice : sortBy === 'createdAt' ? new Date(a.createdAt).getTime() : a.status.localeCompare(b.status)
      const bv = sortBy === 'date' ? new Date(b.dateISO).getTime() : sortBy === 'totalPrice' ? b.totalPrice : sortBy === 'createdAt' ? new Date(b.createdAt).getTime() : b.status.localeCompare(a.status)
      return sortOrder === 'asc' ? av - bv : bv - av
    })
    const start = (page - 1) * limit
    const end = start + limit
    return sorted.slice(start, end)
  }, [clientMode, bookings, allBookings, sortBy, sortOrder, page, limit])

  const fetchCustomersSuggestions = useCallback(async (q: string) => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '5', search: q })
      const res = await fetch(`/api/admin/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        const list = (data.customers || []).map((c: any) => ({ id: c.id, name: c.name, email: c.email }))
        setCustomerSuggestions(list)
      }
    } catch {}
  }, [])

  async function fetchJSON(url: string, options: RequestInit = {}, retries = 2, timeoutMs = 8000) {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal })
      if (!res.ok) {
        let message = ''
        try {
          const data = await res.json()
          if (data && typeof data === 'object' && 'error' in data) {
            message = String((data as any).error)
          }
        } catch {}
        if (!message) {
          message = await res.text().catch(() => '')
        }
        if ((res.status >= 500 || res.status === 408) && retries > 0) {
          return fetchJSON(url, options, retries - 1, timeoutMs)
        }
        throw new Error(message || `Error ${res.status}`)
      }
      return res.json()
    } finally {
      clearTimeout(id)
    }
  }

  // Verificação de autenticação
  useEffect(() => {
    if (status === 'loading') return
    if (!isAdmin) {
      setInitialLoading(false)
      router.replace('/admin/login')
      return
    }
  }, [status, isAdmin, router])

  // Fetch de dados
  useEffect(() => {
    if (status === 'loading') return
    if (!isAdmin) return
    if (isFetching.current) return // Evitar múltiplas execuções simultâneas
    
    let cancelled = false
    isFetching.current = true
    
    const loadData = async () => {
      const isInitial = !hasFetchedInitial.current
      if (isInitial) {
        setInitialLoading(true)
        hasFetchedInitial.current = true
      } else {
        setLoading(true)
      }
      
      try {
        setErrorMsg(null)
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        params.set('sortBy', sortBy)
        params.set('sortOrder', sortOrder)
        if (searchQuery) params.set('search', searchQuery)
        if (statusFilter) params.set('status', statusFilter)
        if (dateFrom) params.set('dateFrom', dateFrom.toISOString())
        if (dateTo) params.set('dateTo', dateTo.toISOString())
        
        const data = await fetchJSON(`/api/v1/bookings?${params.toString()}`, { cache: 'no-store' })
        
        if (cancelled) return
        
        setBookings(data.bookings)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        
        if (data.pagination.total <= 1000) {
          const allParams = new URLSearchParams()
          allParams.set('page', '1')
          allParams.set('limit', String(Math.min(data.pagination.total, 1000)))
          allParams.set('sortBy', sortBy)
          allParams.set('sortOrder', sortOrder)
          if (searchQuery) allParams.set('search', searchQuery)
          if (statusFilter) allParams.set('status', statusFilter)
          if (dateFrom) allParams.set('dateFrom', dateFrom.toISOString())
          if (dateTo) allParams.set('dateTo', dateTo.toISOString())
          
          const allData = await fetchJSON(`/api/v1/bookings?${allParams.toString()}`, { cache: 'no-store' })
          
          if (cancelled) return
          
          setAllBookings(allData.bookings)
          setClientMode(true)
          setTotalPages(Math.ceil(allData.bookings.length / limit))
        } else {
          setClientMode(false)
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error && e.message ? e.message : 'Failed to load bookings. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false)
          setLoading(false)
        }
        isFetching.current = false
      }
    }
    
    loadData()
    
    return () => {
      cancelled = true
      isFetching.current = false
    }
  }, [status, isAdmin, page, limit, sortBy, sortOrder, searchQuery, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(recentKey)
      if (saved) {
        JSON.parse(saved)
      }
    } catch {}
  }, [])

  const addRecentSearch = useCallback((q: string) => {
    try {
      const saved = localStorage.getItem(recentKey)
      const arr: string[] = saved ? JSON.parse(saved) : []
      const next = [q, ...arr.filter((x) => x !== q)].slice(0, 5)
      localStorage.setItem(recentKey, JSON.stringify(next))
    } catch {}
  }, [])

  const openView = useCallback(async (id: string, editMode = false) => {
    setViewOpen(true)
    setViewLoading(true)
    setIsEditing(editMode)
    try {
      const data = await fetchJSON(`/api/v1/bookings/${id}`)
        setViewDetail({
          id: data.id,
          reference: data.reference,
          dateISO: data.dateISO,
          timeSlot: data.timeSlot,
          status: data.status,
          totalPrice: data.totalPrice,
          notes: data.notes || null,
          paymentStatus: data.paymentStatus,
          customer: data.customer,
          garage: data.garage,
          vehicle: data.vehicle || null
        })
        if (editMode) {
          setEditStatus(data.status)
          setEditNotes(data.notes || '')
        }
    } catch (e) {
      setErrorMsg(e instanceof Error && e.message ? e.message : 'Failed to load booking details.')
    } finally {
      setViewLoading(false)
    }
  }, [])

  const startEdit = useCallback((b: AdminBookingItem) => {
    openView(b.id, true)
  }, [openView])

  const saveEdit = useCallback(async () => {
    if (!viewDetail) return
    try {
      const body: any = {}
      if (editStatus) body.status = editStatus
      if (editNotes !== undefined) body.notes = editNotes
      const res = await fetch(`/api/v1/bookings/${viewDetail.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const d = await res.json()
        setBookings((prev) => prev.map((x) => (x.id === viewDetail.id ? { ...x, status: d.booking.status } : x)))
        setAllBookings((prev) => prev.map((x) => (x.id === viewDetail.id ? { ...x, status: d.booking.status } : x)))
        if (viewDetail) {
          setViewDetail({ ...viewDetail, status: d.booking.status, notes: d.booking.notes || null })
        }
        setIsEditing(false)
        setErrorMsg(null)
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err && err.error ? String(err.error) : 'Failed to save changes.')
      }
    } catch (e) {
      setErrorMsg(e instanceof Error && e.message ? e.message : 'Failed to save changes.')
    }
  }, [viewDetail, editStatus, editNotes])

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/v1/bookings/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setBookings((prev) => prev.filter((x) => x.id !== deleteId))
        setAllBookings((prev) => prev.filter((x) => x.id !== deleteId))
        setDeleteId(null)
        if (viewDetail && viewDetail.id === deleteId) {
          setViewOpen(false)
          setViewDetail(null)
        }
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err && err.error ? String(err.error) : 'Failed to delete booking.')
      }
    } catch (e) {
      setErrorMsg(e instanceof Error && e.message ? e.message : 'Failed to delete booking.')
    }
  }, [deleteId, viewDetail])


  const onSort = useCallback((by: 'date' | 'status' | 'totalPrice' | 'createdAt') => {
    if (sortBy === by) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(by)
      setSortOrder('desc')
    }
    if (!clientMode) setPage(1)
  }, [sortBy, clientMode])

  const onSearchChange = useCallback((v: string) => {
    setSearchQuery(v)
    setPage(1)
    setShowSuggestions(v.length >= 2)
    if (v.length >= 2) {
      setSearching(true)
      fetchCustomersSuggestions(v).finally(() => setSearching(false))
    } else {
      setCustomerSuggestions([])
    }
  }, [fetchCustomersSuggestions])

  const applyFilters = useCallback(() => {
    addRecentSearch(searchQuery)
    setPage(1) // Resetar página vai triggerar o useEffect que faz o fetch
  }, [searchQuery, addRecentSearch])

  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Admin Bookings
          </h1>
          <p className="text-muted-foreground">Manage all bookings</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>All Bookings ({total})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  {searching ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    ref={searchInputRef}
                    placeholder="Search bookings, customers or garages"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                    onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {showSuggestions && (customerSuggestions.length > 0 || (typeof window !== 'undefined' && (JSON.parse(localStorage.getItem(recentKey) || '[]') as string[]).length > 0)) && (
                    <div className="absolute z-50 mt-2 w-full bg-popover border border-border rounded-lg shadow-lg">
                      <div className="p-2">
                        {customerSuggestions.map((c) => (
                          <button key={c.id} onClick={() => { setSearchQuery(c.name || c.email); setShowSuggestions(false) }} className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{c.name || c.email}</span>
                          </button>
                        ))}
                        {typeof window !== 'undefined' && (
                          (JSON.parse(localStorage.getItem(recentKey) || '[]') as string[]).map((r, i) => (
                            <button key={`r-${i}`} onClick={() => { setSearchQuery(r); setShowSuggestions(false) }} className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent">
                              {r}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                    <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    <SelectItem value="NO_SHOW">NO_SHOW</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-48 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? formatDateTime(dateFrom).split(',')[0] : 'Start Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar selected={dateFrom || undefined} onSelect={(d) => { setDateFrom(d || null); setPage(1) }} initialFocus mode="single" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-48 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? formatDateTime(dateTo).split(',')[0] : 'End Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar selected={dateTo || undefined} onSelect={(d) => { setDateTo(d || null); setPage(1) }} initialFocus mode="single" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <Alert className="mb-4">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button className="inline-flex items-center gap-1" onClick={() => onSort('date')}>
                        Date & Time
                        <ChevronDown className={`h-3 w-3 ${sortBy === 'date' ? 'opacity-100' : 'opacity-40'}`} />
                      </button>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Garage</TableHead>
                    <TableHead>
                      <button className="inline-flex items-center gap-1" onClick={() => onSort('totalPrice')}>
                        Price
                        <ChevronDown className={`h-3 w-3 ${sortBy === 'totalPrice' ? 'opacity-100' : 'opacity-40'}`} />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No bookings found</TableCell>
                    </TableRow>
                  ) : (
                    pagedItems.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <span>{formatBookingDateTime(b.dateISO, b.timeSlot)}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[160px]">{b.customer.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{b.customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {b.vehicle ? (
                            <div>
                              <p className="font-medium truncate max-w-[160px]">{b.vehicle.make} {b.vehicle.model}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{b.vehicle.registration}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No vehicle</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[160px]">{b.garage.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{b.garage.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(b.totalPrice)}</TableCell>
                        <TableCell>
                          <StatusBadge className="uppercase" variant={b.statusBadge}>{b.status}</StatusBadge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                Actions
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(b.id, true)} className="gap-2">
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setDeleteId(b.id) }} className="gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="py-2 px-3 text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={viewOpen} onOpenChange={(o) => { 
        if (!o) {
          setViewOpen(false)
          setViewDetail(null)
          setIsEditing(false)
          setEditStatus('')
          setEditNotes('')
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Booking' : 'Booking Details'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update booking information' : 'View booking information'}
            </DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-red-600" /></div>
          ) : viewDetail ? (
            <div className="space-y-4">
              {!isEditing ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-mono text-sm">{viewDetail.reference}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p>{formatBookingDateTime(viewDetail.dateISO, viewDetail.timeSlot)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="uppercase">{viewDetail.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p>{formatCurrency(viewDetail.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment</p>
                      <p className="uppercase">{viewDetail.paymentStatus}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p>{viewDetail.customer.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{viewDetail.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Garage</p>
                      <p>{viewDetail.garage.name}</p>
                      <p className="text-xs text-muted-foreground">{viewDetail.garage.email}</p>
                    </div>
                  </div>
                  {viewDetail.vehicle && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle</p>
                      <p>{viewDetail.vehicle.make} {viewDetail.vehicle.model}</p>
                      <p className="text-xs text-muted-foreground">{viewDetail.vehicle.registration}</p>
                    </div>
                  )}
                  {viewDetail.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{viewDetail.notes}</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                    <Button variant="outline" onClick={() => { setViewOpen(false); setViewDetail(null) }}>Close</Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reference</p>
                    <p className="font-mono text-sm">{viewDetail.reference}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                      <p>{formatBookingDateTime(viewDetail.dateISO, viewDetail.timeSlot)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                          <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                          <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                          <SelectItem value="NO_SHOW">NO_SHOW</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p>{formatCurrency(viewDetail.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment</p>
                      <p className="uppercase">{viewDetail.paymentStatus}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Customer</p>
                      <p>{viewDetail.customer.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{viewDetail.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Garage</p>
                      <p>{viewDetail.garage.name}</p>
                      <p className="text-xs text-muted-foreground">{viewDetail.garage.email}</p>
                    </div>
                  </div>
                  {viewDetail.vehicle && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                      <p>{viewDetail.vehicle.make} {viewDetail.vehicle.model}</p>
                      <p className="text-xs text-muted-foreground">{viewDetail.vehicle.registration}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Add notes..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsEditing(false); setEditStatus(viewDetail.status); setEditNotes(viewDetail.notes || '') }}>Cancel</Button>
                    <Button onClick={saveEdit}>Save Changes</Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
