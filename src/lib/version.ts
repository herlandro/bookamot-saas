/**
 * Sistema de versionamento do build
 * Gera uma versão única baseada no timestamp e hash do build
 */

// System version (automatically updated on build)
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'

// Build timestamp (gerado no build)
export const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || Date.now().toString()

// Build hash (gerado no build)
export const BUILD_HASH = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev'

/**
 * Retorna a versão completa do sistema
 */
export function getAppVersion(): string {
  return `${APP_VERSION}-${BUILD_HASH.substring(0, 8)}`
}

/**
 * Retorna o timestamp do build
 */
export function getBuildTimestamp(): number {
  return parseInt(BUILD_TIMESTAMP, 10)
}

/**
 * Retorna a data do build formatada
 */
export function getBuildDate(): string {
  const timestamp = getBuildTimestamp()
  return new Date(timestamp).toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Gera um query string para cache busting
 */
export function getCacheBustingQuery(): string {
  return `?v=${BUILD_HASH}&t=${BUILD_TIMESTAMP}`
}

/**
 * Verifica se há uma nova versão disponível
 * Compara a versão atual com a versão armazenada no localStorage
 */
export function checkForNewVersion(): boolean {
  if (typeof window === 'undefined') return false
  
  const storedVersion = localStorage.getItem('app_version')
  const currentVersion = getAppVersion()
  
  if (!storedVersion || storedVersion !== currentVersion) {
    localStorage.setItem('app_version', currentVersion)
    localStorage.setItem('app_version_timestamp', BUILD_TIMESTAMP)
    return storedVersion !== null // Returns true only if there was a previous version
  }
  
  return false
}

