'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, X, ShoppingBag, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'
import { enGB } from '@/lib/i18n/en-GB'

type PurchaseRequestRow = {
  id: string
  garageName: string
  garageOwner: string
  garageOwnerEmail: string
  requestedOn: string
  bankReference: string
  amountFormatted: string
  status: string
  rejectionReason: string | null
}

function SalesPageFallback() {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AdminLayout>
  )
}

function AdminSalesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestIdFromUrl = searchParams.get('requestId')

  const [rows, setRows] = useState<PurchaseRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(requestIdFromUrl ? 'ALL' : 'PENDING')
  const [sortBy, setSortBy] = useState('requestedOn')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [actionModal, setActionModal] = useState<{
    row: PurchaseRequestRow
    action: 'approve' | 'reject'
  } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchSales = useCallback(async () => {
    const params = new URLSearchParams()
    if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)
    if (requestIdFromUrl) params.set('requestId', requestIdFromUrl)
    params.set('sortBy', sortBy === 'requestedOn' ? 'requestedAt' : sortBy === 'garageName' ? 'garageName' : sortBy)
    params.set('sortOrder', sortOrder)
    const res = await fetch(`/api/admin/sales?${params}`)
    if (res.ok) {
      const data = await res.json()
      setRows(data.purchaseRequests ?? [])
    }
  }, [statusFilter, sortBy, sortOrder, requestIdFromUrl])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.push('/admin/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/admin/dashboard')
      return
    }
    setLoading(true)
    fetchSales().finally(() => setLoading(false))
  }, [session, status, router, fetchSales])

  const handleApprove = async () => {
    if (!actionModal) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/sales/${actionModal.row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        setActionModal(null)
        await fetchSales()
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!actionModal) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/sales/${actionModal.row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: rejectionReason || undefined }),
      })
      if (res.ok) {
        setActionModal(null)
        setRejectionReason('')
        await fetchSales()
      }
    } finally {
      setProcessing(false)
    }
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                {enGB['sales.title']}
              </h1>
              <p className="text-muted-foreground">Approve or reject MOT booking purchase requests.</p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <CardTitle>Purchase requests</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-muted-foreground text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="PENDING">{enGB['sales.status.pending']}</SelectItem>
                    <SelectItem value="APPROVED">{enGB['sales.status.approved']}</SelectItem>
                    <SelectItem value="REJECTED">{enGB['sales.status.rejected']}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1 font-medium"
                          onClick={() => toggleSort('garageName')}
                        >
                          {enGB['sales.garageName']}
                          {sortBy === 'garageName' ? sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                        </button>
                      </TableHead>
                      <TableHead>{enGB['sales.garageOwner']}</TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1 font-medium"
                          onClick={() => toggleSort('requestedOn')}
                        >
                          {enGB['sales.requestedOn']}
                          {sortBy === 'requestedOn' ? sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                        </button>
                      </TableHead>
                      <TableHead>{enGB['sales.bankReference']}</TableHead>
                      <TableHead>{enGB['sales.amount']}</TableHead>
                      <TableHead>{enGB['sales.status']}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No purchase requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.garageName}</TableCell>
                          <TableCell>{row.garageOwner}</TableCell>
                          <TableCell>{format(new Date(row.requestedOn), 'dd MMM yyyy HH:mm')}</TableCell>
                          <TableCell className="font-mono text-sm">{row.bankReference}</TableCell>
                          <TableCell>{row.amountFormatted}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === 'APPROVED'
                                  ? 'default'
                                  : row.status === 'REJECTED'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {row.status === 'PENDING'
                                ? enGB['sales.status.pending']
                                : row.status === 'APPROVED'
                                  ? enGB['sales.status.approved']
                                  : enGB['sales.status.rejected']}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.status === 'PENDING' && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setActionModal({ row, action: 'approve' })}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  {enGB['sales.approve']}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setActionModal({ row, action: 'reject' })}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  {enGB['sales.reject']}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!actionModal} onOpenChange={(open) => !open && setActionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal?.action === 'approve' ? enGB['sales.approve'] : enGB['sales.reject']} – {actionModal?.row.garageName}
            </DialogTitle>
            <DialogDescription>
              {actionModal?.action === 'approve'
                ? 'This will add 10 MOT bookings to the garage quota and set the garage to active.'
                : 'Optionally provide a reason for the rejection (sent to the garage owner by email).'}
            </DialogDescription>
          </DialogHeader>
          {actionModal?.action === 'reject' && (
            <div className="grid gap-2 py-2">
              <Label>{enGB['sales.rejectionReason']}</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)} disabled={processing}>
              Cancel
            </Button>
            {actionModal?.action === 'approve' ? (
              <Button onClick={handleApprove} disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {enGB['sales.approve']}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {enGB['sales.reject']}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

export default function AdminSalesPage() {
  return (
    <Suspense fallback={<SalesPageFallback />}>
      <AdminSalesContent />
    </Suspense>
  )
}
