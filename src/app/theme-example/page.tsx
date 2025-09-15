'use client';

import { ColorThemeExample } from '@/components/examples/color-theme-example';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ThemeExamplePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold mt-4 text-foreground">Exemplo de Tema de Cores</h1>
          <p className="text-muted-foreground">Esta página demonstra as cores padronizadas do sistema</p>
        </div>

        <ColorThemeExample />
      </div>
    </div>
  );
}