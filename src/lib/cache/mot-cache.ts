/**
 * MOT History Cache with TTL (Time To Live)
 * Stores MOT data in memory with automatic expiration
 */

interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum number of entries
}

class MotCache {
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig

  constructor(ttlMinutes: number = 60, maxSize: number = 1000) {
    this.config = {
      ttl: ttlMinutes * 60 * 1000, // Convert minutes to milliseconds
      maxSize
    }
    
    // Cleanup expired entries every 5 minutes
    this.startCleanupInterval()
  }

  /**
   * Get data from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      console.log(`📭 Cache miss for key: ${key}`)
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      console.log(`⏰ Cache expired for key: ${key}`)
      this.cache.delete(key)
      return null
    }

    console.log(`✅ Cache hit for key: ${key}`)
    return entry.data
  }

  /**
   * Set data in cache
   */
  set(key: string, data: any): void {
    // Check cache size
    if (this.cache.size >= this.config.maxSize) {
      console.log(`⚠️  Cache size limit reached. Clearing oldest entries...`)
      this.clearOldest()
    }

    const now = Date.now()
    const entry: CacheEntry = {
      data,
      timestamp: now,
      expiresAt: now + this.config.ttl
    }

    this.cache.set(key, entry)
    console.log(`💾 Cached data for key: ${key} (expires in ${this.config.ttl / 1000 / 60} minutes)`)
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    console.log(`🗑️  Clearing all cache entries`)
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    ttl: number
    maxSize: number
    entries: Array<{ key: string; expiresIn: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, entry.expiresAt - now)
    }))

    return {
      size: this.cache.size,
      ttl: this.config.ttl,
      maxSize: this.config.maxSize,
      entries
    }
  }

  /**
   * Clear oldest entries when cache is full
   */
  private clearOldest(): void {
    const entriesToRemove = Math.ceil(this.config.maxSize * 0.2) // Remove 20% of entries
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, entriesToRemove)

    sortedEntries.forEach(([key]) => {
      this.cache.delete(key)
    })

    console.log(`🧹 Removed ${entriesToRemove} oldest cache entries`)
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      let removedCount = 0

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key)
          removedCount++
        }
      }

      if (removedCount > 0) {
        console.log(`🧹 Cleanup: Removed ${removedCount} expired cache entries`)
      }
    }, 5 * 60 * 1000) // Run every 5 minutes
  }
}

// Create singleton instance with 60 minute TTL
export const motCache = new MotCache(60, 1000)

/**
 * Generate cache key for vehicle MOT history
 */
export function generateMotCacheKey(vehicleId: string): string {
  return `mot_history_${vehicleId}`
}

/**
 * Generate cache key for DVSA API response
 */
export function generateDvsaCacheKey(registration: string): string {
  return `dvsa_api_${registration.toUpperCase()}`
}

