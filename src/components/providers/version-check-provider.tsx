'use client'

import { useEffect } from 'react'
import { getAppVersion } from '@/lib/version'

/**
 * Provider que verifica a versão do sistema na inicialização
 * Complementa o Service Worker para garantir detecção imediata de atualizações
 */
export function VersionCheckProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const checkVersionOnLoad = async () => {
      try {
        const response = await fetch('/api/version', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (response.ok) {
          const { version } = await response.json()
          const currentVersion = getAppVersion()

          if (version !== currentVersion) {
            // Nova versão disponível - força reload após 1 segundo
            // Delay permite que a página carregue antes de recarregar
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          }
        }
      } catch (error) {
        // Silently fail - não bloqueia o app se a verificação falhar
        // O Service Worker continuará verificando periodicamente
        console.warn('[VersionCheck] Failed to check version on load:', error)
      }
    }

    // Verifica versão após um pequeno delay para não bloquear o carregamento inicial
    const timeoutId = setTimeout(checkVersionOnLoad, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return <>{children}</>
}

