'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GarageLayout } from '@/components/layout/garage-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, ShoppingCart } from 'lucide-react'
import { enGB } from '@/lib/i18n/en-GB'
import { format } from 'date-fns'

type PurchaseRow = {
  id: string
  dateRequested: string
  dateApprovedRejected: string | null
  bankReference: string
  quotaAdded: number
  status: string
  consumed: number | null
  remaining: number | null
}

function ShoppingPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const _searchParams = useSearchParams() // required for Suspense; garageId query from MOT widget link
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bankDetails, setBankDetails] = useState<{
    sortCode: string
    accountNumber: string
  } | null>(null)
  const [garageId, setGarageId] = useState<string | null>(null)
  const [bankReference, setBankReference] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
      router.push('/signin')
      return
    }
    fetchPurchases()
  }, [session, status, router])

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/garage-admin/purchase-requests')
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchaseRequests ?? [])
      }
      const quotaRes = await fetch('/api/garage-admin/mot-quota')
      if (quotaRes.ok) {
        const q = await quotaRes.json()
        setGarageId(q.garageId ?? null)
      }
    } catch {
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  const openModal = async () => {
    setModalOpen(true)
    if (!bankDetails) {
      try {
        const res = await fetch('/api/garage-admin/bank-details')
        if (res.ok) {
          const d = await res.json()
          setBankDetails({ sortCode: d.sortCode, accountNumber: d.accountNumber })
        }
      } catch {
        setBankDetails({ sortCode: '00-00-00', accountNumber: '00000000' })
      }
    }
    let gid = garageId
    if (!gid) {
      try {
        const qRes = await fetch('/api/garage-admin/mot-quota')
        if (qRes.ok) {
          const q = await qRes.json()
          gid = q.garageId
          setGarageId(gid)
        }
      } catch {
        // ignore
      }
    }
    if (gid) {
      setBankReference(`${String(gid).slice(-6)}-${Date.now()}`)
    }
  }

  const submitPurchase = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/garage-admin/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankReference: bankReference || undefined }),
      })
      if (res.ok) {
        setModalOpen(false)
        await fetchPurchases()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <GarageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </GarageLayout>
    )
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{enGB['shopping.title']}</h1>
            <p className="text-muted-foreground">
              Purchase MOT booking quota for your garage.
            </p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{enGB['shopping.product.motb10']}</CardTitle>
                <CardDescription>{enGB['shopping.product.description']}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{enGB['shopping.product.price']}</p>
                <p className="text-sm text-muted-foreground">{enGB['shopping.product.quantity']}</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={openModal} className="w-full sm:w-auto">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {enGB['shopping.buyNow']}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{enGB['shopping.previousPurchases']}</CardTitle>
              <CardDescription>History of your MOT booking purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{enGB['shopping.table.dateRequested']}</TableHead>
                    <TableHead>{enGB['shopping.table.dateApprovedRejected']}</TableHead>
                    <TableHead>{enGB['shopping.table.bankReference']}</TableHead>
                    <TableHead>{enGB['shopping.table.quotaAdded']}</TableHead>
                    <TableHead>{enGB['shopping.table.consumed']}</TableHead>
                    <TableHead>{enGB['shopping.table.remaining']}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No purchases yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{format(new Date(row.dateRequested), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell>
                          {row.dateApprovedRejected
                            ? format(new Date(row.dateApprovedRejected), 'dd MMM yyyy')
                            : enGB['shopping.table.pending']}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{row.bankReference}</TableCell>
                        <TableCell>{row.quotaAdded}</TableCell>
                        <TableCell>{row.consumed ?? '–'}</TableCell>
                        <TableCell>{row.remaining ?? '–'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{enGB['shopping.purchaseIntent.title']}</DialogTitle>
            <DialogDescription>
              Pay £10 via UK bank transfer using the details below. Use the reference shown when you pay, then click Submit to record your request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{enGB['shopping.bank.sortCode']}</span>
              <span className="col-span-2 font-mono">{bankDetails?.sortCode ?? '–'}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{enGB['shopping.bank.accountNumber']}</span>
              <span className="col-span-2 font-mono">{bankDetails?.accountNumber ?? '–'}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{enGB['shopping.bank.reference']}</span>
              <span className="col-span-2 break-all font-mono text-sm">{bankReference || '–'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              {enGB['shopping.cancel']}
            </Button>
            <Button onClick={submitPurchase} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {enGB['shopping.submit']}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GarageLayout>
  )
}

export default function ShoppingPage() {
  return (
    <Suspense
      fallback={
        <GarageLayout>
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </GarageLayout>
      }
    >
      <ShoppingPageContent />
    </Suspense>
  )
}
