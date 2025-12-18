import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">You are offline</CardTitle>
            <CardDescription>
              Unable to connect to the internet. Please check your connection and try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

