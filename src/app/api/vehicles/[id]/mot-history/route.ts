import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Configuração da API do DVSA MOT History
const DVSA_CONFIG = {
  clientId: process.env.DVSA_CLIENT_ID!,
  clientSecret: process.env.DVSA_CLIENT_SECRET!,
  apiKey: process.env.DVSA_API_KEY!,
  scope: process.env.DVSA_SCOPE!,
  tokenUrl: process.env.DVSA_TOKEN_URL!,
  apiBaseUrl: process.env.DVSA_API_BASE_URL!
}

// Função para obter token de acesso
async function getAccessToken() {
  const params = new URLSearchParams()
  params.append('client_id', DVSA_CONFIG.clientId)
  params.append('client_secret', DVSA_CONFIG.clientSecret)
  params.append('scope', DVSA_CONFIG.scope)
  params.append('grant_type', 'client_credentials')

  try {
    const response = await fetch(DVSA_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    throw error
  }
}

// Função para buscar histórico MOT na API DVSA
async function fetchMotHistory(registration: string, accessToken: string) {
  try {
    const response = await fetch(`${DVSA_CONFIG.apiBaseUrl}/mot-history/${registration}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': DVSA_CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return [] // Nenhum histórico encontrado
      }
      throw new Error(`DVSA MOT API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching MOT history from DVSA:', error)
    throw error
  }
}

// Função para processar e formatar dados do MOT
function processMotData(motData: any[]) {
  return motData.map(mot => ({
    testDate: mot.completedDate,
    expiryDate: mot.expiryDate,
    testResult: mot.testResult,
    odometerValue: mot.odometerValue,
    odometerUnit: mot.odometerUnit,
    motTestNumber: mot.motTestNumber,
    defects: mot.rfrAndComments || [],
    advisoryText: mot.advisoryText || []
  }))
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicleId = params.id

    // Verificar se o veículo existe e pertence ao usuário
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: session.user.id,
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Buscar histórico MOT na API DVSA
    try {
      const accessToken = await getAccessToken()
      const motData = await fetchMotHistory(vehicle.registration, accessToken)
      
      const processedMotData = processMotData(motData)
      
      return NextResponse.json({
        vehicleId: vehicle.id,
        registration: vehicle.registration,
        motHistory: processedMotData
      })
    } catch (dvsaError) {
      console.error('DVSA MOT lookup failed:', dvsaError)
      return NextResponse.json(
        { error: 'Failed to fetch MOT history from DVSA' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('MOT history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}