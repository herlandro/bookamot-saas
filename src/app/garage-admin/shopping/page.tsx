'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GarageLayout } from '@/components/layout/garage-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
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
  void Dialog // keep Dialog in bundle for shared layout/chunk (avoids Turbopack ReferenceError)
  const { data: session, status } = useSession()
  const router = useRouter()
  const _searchParams = useSearchParams() // required for Suspense; garageId query from MOT widget link
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

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
      await fetch('/api/garage-admin/mot-quota')
    } catch {
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  const goToCheckout = async () => {
    setCheckoutError(null)
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCheckoutError(data?.error ?? enGB['shopping.paymentError'])
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setCheckoutError(enGB['shopping.paymentError'])
    } catch {
      setCheckoutError(enGB['shopping.paymentError'])
    } finally {
      setCheckoutLoading(false)
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
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <ShoppingCart className="h-6 w-6" />
              {enGB['shopping.title']}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {enGB['shopping.subtitle']}
            </p>
          </div>

          <Card className="rounded-lg border border-border bg-card shadow-xl">
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
            <CardContent className="space-y-2">
              <Button
                type="button"
                onClick={goToCheckout}
                disabled={checkoutLoading}
                className="w-full sm:w-auto"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {enGB['shopping.paymentRedirect']}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {enGB['shopping.comprar']}
                  </>
                )}
              </Button>
              {checkoutError && (
                <p className="text-sm text-destructive">{checkoutError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {enGB['shopping.paymentNote']}
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6 rounded-lg border border-border bg-card shadow-xl">
            <CardHeader>
              <CardTitle>{enGB['shopping.previousPurchases']}</CardTitle>
              <CardDescription>{enGB['shopping.previousPurchasesDescription']}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{enGB['shopping.table.dateRequested']}</TableHead>
                    <TableHead>{enGB['shopping.table.dateApprovedRejected']}</TableHead>
                    <TableHead>{enGB['shopping.table.bankReference']}</TableHead>
                    <TableHead>{enGB['shopping.table.quotaAdded']}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {enGB['shopping.noPurchasesYet']}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
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
