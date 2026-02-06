'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { enGB } from '@/lib/i18n/en-GB'

function SucessoContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  // Fallback: confirma o pagamento e credita a quota quando o webhook não é chamado (ex.: dev local)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8de4aadb-cb33-4785-b101-b6442ed7baed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'sucesso/page.tsx:useEffect', message: 'confirm effect', data: { sessionId: sessionId ?? null, willCall: Boolean(sessionId?.startsWith('cs_')) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1' }) }).catch(() => {})
    // #endregion
    if (!sessionId?.startsWith('cs_')) return
    fetch(`/api/confirm-stripe-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8de4aadb-cb33-4785-b101-b6442ed7baed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'sucesso/page.tsx:confirmResponse', message: 'confirm API response', data: { status: res.status, ok: res.ok }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1-H2' }) }).catch(() => {})
        // #endregion
      })
      .catch(() => {})
  }, [sessionId])

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
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" aria-hidden />
        </div>
      }
    >
      <SucessoContent />
    </Suspense>
  )
}
