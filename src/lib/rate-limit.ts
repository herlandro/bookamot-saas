import { NextRequest } from 'next/server'

// In-memory storage for rate limiting (in production, use Redis)
const attempts = new Map<string, { count: number; resetTime: number }>()

// Limpar tentativas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of attempts.entries()) {
    if (now > value.resetTime) {
      attempts.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): { success: boolean; remaining?: number; resetTime?: number } => {
    // Usar IP como identificador
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const key = `rate_limit:${ip}`
    const now = Date.now()
    
    const current = attempts.get(key)
    
    if (!current || now > current.resetTime) {
      // Primeira tentativa ou janela expirada
      attempts.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return {
        success: true,
        remaining: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      }
    }
    
    if (current.count >= config.maxAttempts) {
      // Limite excedido
      return {
        success: false,
        remaining: 0,
        resetTime: current.resetTime
      }
    }
    
    // Incrementar contador
    current.count++
    attempts.set(key, current)
    
    return {
      success: true,
      remaining: config.maxAttempts - current.count,
      resetTime: current.resetTime
    }
  }
}

// Rate limiter specific for forgot password (3 attempts per hour)
export const forgotPasswordRateLimit = rateLimit({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000 // 1 hora
})

// Rate limiter para reset password (5 tentativas por 15 minutos)
export const resetPasswordRateLimit = rateLimit({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000 // 15 minutos
})