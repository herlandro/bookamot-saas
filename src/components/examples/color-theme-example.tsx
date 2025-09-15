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
              <StatusBadge variant="success">Concluído</StatusBadge>
              <StatusBadge variant="warning">Pendente</StatusBadge>
              <StatusBadge variant="destructive">Cancelado</StatusBadge>
              <StatusBadge variant="info">Confirmado</StatusBadge>
              <StatusBadge variant="outline">Outline</StatusBadge>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Padrão</CardTitle>
                  <CardDescription>Descrição do card</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Conteúdo do card</p>
                </CardContent>
              </Card>
              
              <Card className="border-t-4 border-t-success">
                <CardHeader>
                  <CardTitle>Card Sucesso</CardTitle>
                  <CardDescription>Com borda de sucesso</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Conteúdo do card</p>
                </CardContent>
              </Card>
              
              <Card className="border-t-4 border-t-destructive">
                <CardHeader>
                  <CardTitle>Card Erro</CardTitle>
                  <CardDescription>Com borda de erro</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Conteúdo do card</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Contornos */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Contornos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <p>Contorno padrão (border)</p>
              </div>
              <div className="p-4 border-2 border rounded-md">
                <p>Contorno mais grosso (border-2)</p>
              </div>
              <div className="p-4 ring-2 ring-ring rounded-md">
                <p>Contorno de foco (ring)</p>
              </div>
            </div>
          </div>

          {/* Cores de texto */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Cores de Texto</h3>
            <div className="space-y-1">
              <p className="text-foreground">Texto principal (foreground)</p>
              <p className="text-muted-foreground">Texto secundário (muted-foreground)</p>
              <p className="text-primary">Texto primário (primary)</p>
              <p className="text-success">Texto sucesso (success)</p>
              <p className="text-warning">Texto alerta (warning)</p>
              <p className="text-destructive">Texto erro (destructive)</p>
              <p className="text-info">Texto informativo (info)</p>
            </div>
          </div>

          {/* Cores de fundo */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Cores de Fundo</h3>
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