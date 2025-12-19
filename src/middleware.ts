import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para cache busting e headers HTTP
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  const isServiceWorker = pathname === '/sw.js'

  if (isServiceWorker) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Headers de cache para recursos estáticos
  if (
    !isServiceWorker &&
    (
      pathname.startsWith('/_next/static/') ||
      pathname.startsWith('/_next/image') ||
      pathname.match(/\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/)
    )
  ) {
    // Cache por 1 ano para recursos estáticos (com validação)
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable, stale-while-revalidate=86400'
    )
  }
  
  // Headers para páginas HTML
  else if (pathname.endsWith('.html') || !pathname.includes('.')) {
    // Sem cache para páginas HTML (sempre buscar versão mais recente)
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate, max-age=0'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  // Headers para API routes
  else if (pathname.startsWith('/api/')) {
    // Cache curto para APIs (5 minutos)
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate, max-age=0'
    )
  }

  // Adiciona header de versão do sistema
  const buildVersion = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'
  const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev'
  response.headers.set('X-App-Version', `${buildVersion}-${buildHash.substring(0, 8)}`)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
