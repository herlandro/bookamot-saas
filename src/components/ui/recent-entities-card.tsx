'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface RecentEntity {
  id: string
  [key: string]: any
}

interface RecentEntitiesCardProps {
  title: string
  description?: string
  entities: RecentEntity[]
  loading?: boolean
  error?: string | null
  viewAllHref: string
  renderEntity: (entity: RecentEntity) => React.ReactNode
  emptyMessage?: string
}

export function RecentEntitiesCard({
  title,
  description,
  entities,
  loading = false,
  error = null,
  viewAllHref,
  renderEntity,
  emptyMessage = 'No items found'
}: RecentEntitiesCardProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(viewAllHref)}
            aria-label={`View all ${title.toLowerCase()}`}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">{error}</div>
        ) : entities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">{emptyMessage}</div>
        ) : (
          <div className="space-y-3">
            {entities.map((entity) => (
              <div
                key={entity.id}
                className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                role="listitem"
              >
                {renderEntity(entity)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to format dates
export function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd MMM yyyy')
  } catch {
    return dateString
  }
}
