'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { enGB } from '@/lib/i18n/en-GB'

const POLL_INTERVAL_MS = 15000

export function MotBookingsWidget() {
  const router = useRouter()
  const [data, setData] = useState<{
    confirmedCount: number
    purchasedQuota: number
    garageId: string
    isNearLimit: boolean
    isExhausted: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissWarning, setDismissWarning] = useState(false)
  const prevNearLimit = useRef(false)

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/garage-admin/mot-quota', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuota()
    const interval = setInterval(fetchQuota, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span>{enGB['mot.bookings']}: –</span>
      </div>
    )
  }

  const showWarning = (data.isNearLimit || data.isExhausted) && !dismissWarning
  const showToast = data.isNearLimit && !data.isExhausted && !dismissWarning
  if (data.isNearLimit && !prevNearLimit.current) prevNearLimit.current = true
  if (!data.isNearLimit) prevNearLimit.current = false

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={cn(
          'flex items-center gap-2 text-sm transition-all duration-300',
          showWarning && 'animate-pulse-subtle'
        )}
        role="status"
        aria-live="polite"
        aria-label={`${enGB['mot.bookings']}: ${data.purchasedQuota}`}
      >
        <span className="font-medium text-foreground">
          {enGB['mot.bookings']}: {data.purchasedQuota}
        </span>
        <Button
          size="sm"
          variant="default"
          className={cn(
            'shrink-0',
            showWarning && 'animate-pulse-subtle'
          )}
          onClick={() => router.push(`/garage-admin/shopping?garageId=${encodeURIComponent(data.garageId)}`)}
        >
          <ShoppingCart className="h-4 w-4 mr-1" aria-hidden />
          {enGB['mot.purchase']}
        </Button>
      </div>
      {showToast && (
        <div
          className="flex items-center gap-2 rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-xs text-warning-foreground max-w-[280px]"
          role="alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{enGB['toast.motQuotaWarning']}</span>
          <button
            type="button"
            onClick={() => setDismissWarning(true)}
            className="shrink-0 font-medium underline focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Dismiss warning"
          >
            Dismiss
          </button>
        </div>
      )}
      {data.isExhausted && !dismissWarning && (
        <div
          className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive-foreground max-w-[280px]"
          role="alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{enGB['toast.motQuotaExhausted']}</span>
        </div>
      )}
    </div>
  )
}
