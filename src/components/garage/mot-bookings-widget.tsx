'use client'

// MOT quota widget – header badge and purchase CTA
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { enGB } from '@/lib/i18n/en-GB'

const POLL_INTERVAL_MS = 15000

export function MotBookingsWidget() {
  const router = useRouter()
  const [data, setData] = useState<{
    consumedCount: number
    purchasedQuota: number
    remaining: number
    garageId: string
    isNearLimit: boolean
    isExhausted: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

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
        <span>{enGB['mot.bookings']} –</span>
      </div>
    )
  }

  const remaining = data.remaining ?? Math.max(0, (data.purchasedQuota ?? 0) - (data.consumedCount ?? 0))
  const isLowQuota = remaining <= 2
  const isInactive = remaining === 0
  const isWarning = remaining > 0 && remaining <= 2

  const statusConfig =
    isInactive
      ? { circle: 'bg-destructive', label: 'Inactive', quotaBg: 'bg-destructive/20', quotaText: 'text-destructive' }
      : isWarning
        ? { circle: 'bg-yellow-500', label: 'Active', quotaBg: 'bg-yellow-500/20', quotaText: 'text-yellow-700 dark:text-yellow-400' }
        : { circle: 'bg-green-500', label: 'Active', quotaBg: 'bg-green-500/20', quotaText: 'text-green-700 dark:text-green-400' }

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5"
        role="status"
        aria-live="polite"
        aria-label={`${enGB['mot.bookings']} ${remaining} remaining, ${statusConfig.label}`}
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-semibold text-foreground text-sm leading-tight">
            {enGB['mot.bookings']}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', statusConfig.circle)}
              aria-hidden
            />
            {isWarning && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-600 dark:text-yellow-400" aria-hidden />}
            <span className="text-xs font-medium text-muted-foreground">{statusConfig.label}</span>
          </div>
        </div>
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full tabular-nums text-sm font-bold',
            statusConfig.quotaBg,
            statusConfig.quotaText
          )}
        >
          {remaining}
        </span>
        <Button
          size="sm"
          variant="default"
          className="shrink-0 bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600"
          onClick={() => router.push(`/garage-admin/shopping?garageId=${encodeURIComponent(data.garageId)}`)}
        >
          {enGB['mot.purchase']}
        </Button>
      </div>
    </div>
  )
}
