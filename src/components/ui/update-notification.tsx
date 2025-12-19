'use client'

import { useEffect, useState } from 'react'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, X } from 'lucide-react'
import { getAppVersion } from '@/lib/version'

/**
 * Componente de notificação de atualização disponível
 */
export function UpdateNotification() {
  const { isUpdateAvailable, canUpdateNow, skipWaiting } = useServiceWorker()
  const [isVisible, setIsVisible] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<string>('')

  useEffect(() => {
    if (isUpdateAvailable && canUpdateNow) {
      setCurrentVersion(getAppVersion())
      setIsVisible(true)
      return
    }
    if (!isUpdateAvailable) setIsVisible(false)
  }, [canUpdateNow, isUpdateAvailable])

  const handleUpdate = () => {
    skipWaiting()
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert variant="primary" className="shadow-lg">
        <RefreshCw className="h-4 w-4" />
        <AlertTitle className="font-semibold">
          New version available!
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground mb-3">
            A new version of the system is available (v{currentVersion}).
            Update to get the latest improvements and fixes.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="bg-primary hover:bg-primary/90"
              disabled={!canUpdateNow}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Update Now
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
            >
              <X className="h-3 w-3 mr-2" />
              Later
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
