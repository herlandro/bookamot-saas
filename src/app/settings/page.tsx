'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2, Info } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { ThemeSettingsCard } from '@/components/ui/theme-settings-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAppVersion, getBuildDate } from '@/lib/version'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.push('/signin')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Theme Settings */}
          <ThemeSettingsCard />

          {/* System Information */}
          <Card className="shadow-xl rounded-lg border border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                System version and build information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    System Version
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {getAppVersion()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Build Date
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {getBuildDate()}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  The system automatically checks for updates. 
                  You will be notified when a new version is available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
