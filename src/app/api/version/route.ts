import { NextResponse } from 'next/server'
import { getAppVersion, getBuildTimestamp } from '@/lib/version'

/**
 * API endpoint para verificação de versão do sistema
 * Retorna a versão atual do build para comparação no cliente
 */
export async function GET() {
  try {
    const version = getAppVersion()
    const timestamp = getBuildTimestamp()

    return NextResponse.json(
      {
        version,
        timestamp,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Error getting version:', error)
    return NextResponse.json(
      { error: 'Failed to get version' },
      { status: 500 }
    )
  }
}

