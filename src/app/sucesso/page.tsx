'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { enGB } from '@/lib/i18n/en-GB'

function SucessoContent() {
  const [mounted, setMounted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Confirm + session_id apenas a partir de window (evita Suspense/useSearchParams e hydration)
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('session_id')
    setSessionId(sid)
    setMounted(true)
    if (!sid?.startsWith('cs_')) return
    fetch(`/api/confirm-stripe-session?session_id=${encodeURIComponent(sid)}`).catch(() => {})
  }, [])

  // Evitar hydration mismatch: só mostrar texto após mount (server e cliente pintam igual até lá)
  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 text-3xl text-green-600" aria-hidden>✓</span>
          </div>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mx-auto" aria-hidden />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 text-3xl text-green-600" aria-hidden>✓</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {enGB['success.title']}
        </h1>
        <p className="text-muted-foreground">
          {enGB['success.message']}
        </p>
        {sessionId && (
          <p className="text-xs text-muted-foreground font-mono break-all">
            ID: {sessionId}
          </p>
        )}
        <Link
          href="/garage-admin/shopping"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {enGB['success.back']}
        </Link>
      </div>
    </div>
  )
}

export default function SucessoPage() {
  return <SucessoContent />
}
