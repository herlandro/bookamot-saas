'use client'

import { useEffect, useState, useCallback } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isInstalled: boolean
  isUpdateAvailable: boolean
  isInstalling: boolean
  registration: ServiceWorkerRegistration | null
}

/**
 * Hook para gerenciar Service Worker e detectar atualizações
 */
export function useServiceWorker() {
  const isProd =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: typeof window !== 'undefined' && isProd && 'serviceWorker' in navigator,
    isInstalled: false,
    isUpdateAvailable: false,
    isInstalling: false,
    registration: null,
  })

  const isDebugEnabled = useCallback(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem('debug:refresh-loop') === '1'
    } catch {
      return false
    }
  }, [])

  const debug = useCallback(
    (...args: unknown[]) => {
      if (isDebugEnabled()) console.debug(...args)
    },
    [isDebugEnabled]
  )

  const reloadOnce = useCallback(
    (reason: string) => {
      try {
        if (typeof window === 'undefined') return
        if (window.sessionStorage.getItem('sw:reloaded') === '1') {
          debug('[SW] reload skipped (already reloaded)', { reason })
          return
        }
        window.sessionStorage.setItem('sw:reloaded', '1')
      } catch {}
      debug('[SW] reloading page', { reason })
      window.location.reload()
    },
    [debug]
  )

  const checkForUpdates = useCallback(async () => {
    if (!state.isSupported || !state.registration) return

    try {
      await state.registration.update()

      if (state.registration.waiting) {
        setState((prev) => ({
          ...prev,
          isUpdateAvailable: true,
        }))
      }
    } catch (error) {
      console.error('[SW] Error checking for updates:', error)
    }
  }, [state.isSupported, state.registration])

  const skipWaiting = useCallback(async () => {
    if (!state.registration?.waiting) return

    // Envia mensagem para o Service Worker pular a espera
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    
    // Recarrega a página após um pequeno delay
    setTimeout(() => {
      reloadOnce('skipWaiting')
    }, 100)
  }, [reloadOnce, state.registration])

  useEffect(() => {
    if (!state.isSupported) return
    if (!state.isSupported) return

    let registration: ServiceWorkerRegistration | null = null

    const registerServiceWorker = async () => {
      try {
        // Registra o Service Worker
        debug('[SW] registering /sw.js')
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        setState((prev) => ({
          ...prev,
          isInstalled: true,
          registration,
        }))

        // Verifica atualizações periodicamente (a cada 5 minutos)
        const checkForUpdatesLocal = async () => {
          if (!registration) return
          try {
            await registration.update()
            if (registration.waiting) {
              setState((prev) => ({
                ...prev,
                isUpdateAvailable: true,
              }))
            }
          } catch (error) {
            console.error('[SW] Error checking for updates:', error)
          }
        }

        const updateInterval = setInterval(() => {
          checkForUpdatesLocal()
        }, 5 * 60 * 1000)

        // Listener para quando um novo Service Worker está esperando
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing
          
          if (newWorker) {
            debug('[SW] updatefound: installing new worker')
            setState((prev) => ({
              ...prev,
              isInstalling: true,
            }))

            newWorker.addEventListener('statechange', () => {
              debug('[SW] worker statechange', { state: newWorker.state })
              if (newWorker.state === 'installed') {
                if (registration?.waiting) {
                  const isFirstInstall =
                    typeof window !== 'undefined' && !navigator.serviceWorker.controller
                  if (isFirstInstall) return

                  // Há um novo Service Worker esperando
                  setState((prev) => ({
                    ...prev,
                    isInstalling: false,
                    isUpdateAvailable: true,
                  }))
                } else {
                  // Service Worker instalado pela primeira vez
                  setState((prev) => ({
                    ...prev,
                    isInstalling: false,
                  }))
                }
              }
            })
          }
        })

        // Listener para quando o Service Worker assume controle
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Nova versão assumiu controle, recarrega a página
          reloadOnce('controllerchange')
        })

        return () => {
          clearInterval(updateInterval)
        }
      } catch (error) {
        console.error('[SW] Error registering service worker:', error)
      }
    }

    registerServiceWorker()

    // Cleanup
    return () => {
      // Não fazemos unregister aqui para manter o SW ativo
    }
  }, [debug, reloadOnce, state.isSupported])

  return {
    ...state,
    canUpdateNow: !!state.registration?.waiting,
    checkForUpdates,
    skipWaiting,
  }
}
