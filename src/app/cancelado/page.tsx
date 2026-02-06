'use client'

import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enGB } from '@/lib/i18n/en-GB'

export default function CanceladoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {enGB['cancel.title']}
        </h1>
        <p className="text-muted-foreground">
          {enGB['cancel.message']}
        </p>
        <Button asChild variant="outline">
          <Link href="/garage-admin/shopping">{enGB['cancel.back']}</Link>
        </Button>
      </div>
    </div>
  )
}
