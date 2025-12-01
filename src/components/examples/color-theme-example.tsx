'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

export function ColorThemeExample() {
  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Tema de Cores Padronizado</CardTitle>
          <CardDescription>Exemplos de componentes com as cores padronizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Botões */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Botões</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          {/* Status Badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge variant="default">Default</StatusBadge>
              <StatusBadge variant="success">Completed</StatusBadge>
              <StatusBadge variant="warning">Pending</StatusBadge>
              <StatusBadge variant="destructive">Cancelled</StatusBadge>
              <StatusBadge variant="info">Confirmed</StatusBadge>
              <StatusBadge variant="outline">Outline</StatusBadge>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>Card description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-success">
                <CardHeader>
                  <CardTitle>Success Card</CardTitle>
                  <CardDescription>With success border</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-destructive">
                <CardHeader>
                  <CardTitle>Error Card</CardTitle>
                  <CardDescription>With error border</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Borders */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Borders</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <p>Default border</p>
              </div>
              <div className="p-4 border-2 border rounded-md">
                <p>Thicker border (border-2)</p>
              </div>
              <div className="p-4 ring-2 ring-ring rounded-md">
                <p>Focus ring</p>
              </div>
            </div>
          </div>

          {/* Text colours */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Text Colours</h3>
            <div className="space-y-1">
              <p className="text-foreground">Main text (foreground)</p>
              <p className="text-muted-foreground">Secondary text (muted-foreground)</p>
              <p className="text-primary">Primary text (primary)</p>
              <p className="text-success">Success text (success)</p>
              <p className="text-warning">Warning text (warning)</p>
              <p className="text-destructive">Error text (destructive)</p>
              <p className="text-info">Info text (info)</p>
            </div>
          </div>

          {/* Background colours */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Background Colours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-4 bg-background border rounded-md">Background</div>
              <div className="p-4 bg-muted border rounded-md">Muted</div>
              <div className="p-4 bg-primary text-primary-foreground rounded-md">Primary</div>
              <div className="p-4 bg-secondary text-secondary-foreground rounded-md">Secondary</div>
              <div className="p-4 bg-accent text-accent-foreground rounded-md">Accent</div>
              <div className="p-4 bg-success text-success-foreground rounded-md">Success</div>
              <div className="p-4 bg-warning text-warning-foreground rounded-md">Warning</div>
              <div className="p-4 bg-destructive text-destructive-foreground rounded-md">Destructive</div>
              <div className="p-4 bg-info text-info-foreground rounded-md">Info</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}