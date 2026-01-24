'use client'

import { useEffect } from 'react'
import { getAppVersion } from '@/lib/version'

/**
 * Provider que verifica a versão do sistema na inicialização
 * Complementa o Service Worker para garantir detecção imediata de atualizações
 */
export function VersionCheckProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      return
    }

    const isDebugEnabled = () => {
      try {
        return typeof window !== 'undefined' && window.localStorage.getItem('debug:refresh-loop') === '1'
      } catch {
        return false
      }
    }

    const debug = (...args: unknown[]) => {
      if (isDebugEnabled()) console.debug(...args)
    }

    const reloadOnce = (reason: string) => {
      try {
        if (typeof window === 'undefined') return
        if (window.sessionStorage.getItem('version:reloaded') === '1') {
          debug('[VersionCheck] reload skipped (already reloaded)', { reason })
          return
        }
        window.sessionStorage.setItem('version:reloaded', '1')
      } catch {}
      debug('[VersionCheck] reloading page', { reason })
      window.location.reload()
    }

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
          debug('[VersionCheck] versions', { version, currentVersion })

          if (version !== currentVersion) {
            // New version available - force reload after 1 second
            // Delay allows page to load before reloading
            setTimeout(() => {
              reloadOnce('version-mismatch')
            }, 1000)
          }
        }
      } catch (error) {
        // Silently fail - doesn't block app if verification fails
        // Service Worker will continue checking periodically
        console.warn('[VersionCheck] Failed to check version on load:', error)
      }
    }

    // Check version after a short delay to not block initial loading
    const timeoutId = setTimeout(checkVersionOnLoad, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return <>{children}</>
}
