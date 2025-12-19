/**
 * Service Worker para cache busting e atualizações
 * Este arquivo é gerado automaticamente pelo script build-sw.js
 * NÃO edite este arquivo diretamente - edite o template e execute o build
 */

const CACHE_NAME = 'bookamot-cache-0.1.0-07490d88'
const BUILD_VERSION = '0.1.0-07490d88'
const BUILD_TIMESTAMP = '1766143488916'

// Recursos que devem ser sempre buscados da rede
const NETWORK_FIRST = [
  '/api/',
  '/auth/',
]

// Recursos que podem ser servidos do cache
const CACHE_FIRST = [
  '/_next/static/',
  '/_next/image',
]

/**
 * Instalação do Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker, version:', BUILD_VERSION)
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened')
      return cache.addAll([
        '/',
        '/offline',
      ])
    })
  )
  
  // Força a ativação imediata do novo Service Worker
  self.skipWaiting()
})

/**
 * Ativação do Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker, version:', BUILD_VERSION)
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  
  // Assume controle imediato de todas as páginas
  return self.clients.claim()
})

/**
 * Intercepta requisições
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Ignora requisições que não são GET
  if (request.method !== 'GET') {
    return
  }
  
  // Estratégia Network First para APIs
  if (NETWORK_FIRST.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(networkFirstStrategy(request))
    return
  }
  
  // Estratégia Cache First para recursos estáticos
  if (CACHE_FIRST.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }
  
  // Estratégia Network First para páginas
  event.respondWith(networkFirstStrategy(request))
})

/**
 * Estratégia Network First
 * Tenta buscar da rede primeiro, usa cache se falhar
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request)
    
    // Cache apenas respostas válidas
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Se for uma navegação e não houver cache, retorna página offline
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline')
      if (offlinePage) {
        return offlinePage
      }
    }
    
    throw error
  }
}

/**
 * Estratégia Cache First
 * Tenta buscar do cache primeiro, usa rede se não encontrar
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Verifica se o cache não está muito antigo (24 horas)
    const cacheDate = cachedResponse.headers.get('date')
    if (cacheDate) {
      const cacheAge = Date.now() - new Date(cacheDate).getTime()
      const maxAge = 24 * 60 * 60 * 1000 // 24 horas
      
      if (cacheAge < maxAge) {
        return cachedResponse
      }
    } else {
      return cachedResponse
    }
  }
  
  try {
    const response = await fetch(request)
    
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

/**
 * Mensagens do Service Worker
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({
      version: BUILD_VERSION,
      timestamp: BUILD_TIMESTAMP,
    })
  }
})
