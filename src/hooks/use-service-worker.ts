'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAppVersion } from '@/lib/version'

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
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    isInstalled: false,
    isUpdateAvailable: false,
    isInstalling: false,
    registration: null,
  })

  const checkForUpdates = useCallback(async () => {
    if (!state.isSupported || !state.registration) return

    try {
      const registration = await state.registration.update()
      
      if (registration) {
        // Verifica se há um novo Service Worker esperando
        if (registration.waiting) {
          setState((prev) => ({
            ...prev,
            isUpdateAvailable: true,
          }))
        }
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
      window.location.reload()
    }, 100)
  }, [state.registration])

  useEffect(() => {
    if (!state.isSupported) return

    let registration: ServiceWorkerRegistration | null = null

    const registerServiceWorker = async () => {
      try {
        // Registra o Service Worker
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        setState((prev) => ({
          ...prev,
          isInstalled: true,
          registration,
        }))

        // Verifica atualizações periodicamente (a cada 5 minutos)
        const updateInterval = setInterval(() => {
          checkForUpdates()
        }, 5 * 60 * 1000)

        // Listener para quando um novo Service Worker está esperando
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing
          
          if (newWorker) {
            setState((prev) => ({
              ...prev,
              isInstalling: true,
            }))

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (registration?.waiting) {
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
          window.location.reload()
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
  }, [state.isSupported])

  return {
    ...state,
    checkForUpdates,
    skipWaiting,
  }
}

