import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with garage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        emailVerified: true,
        garage: {
          select: {
            id: true,
            name: true,
            isActive: true,
            approvalStatus: true,
            rejectionReason: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.garage) {
      return NextResponse.json({ error: 'No garage found for this user' }, { status: 404 })
    }

    return NextResponse.json({
      emailVerified: !!user.emailVerified,
      garageId: user.garage.id,
      garageName: user.garage.name,
      isActive: user.garage.isActive,
      approvalStatus: user.garage.approvalStatus,
      rejectionReason: user.garage.rejectionReason,
    })
  } catch (error) {
    console.error('Error fetching garage status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

