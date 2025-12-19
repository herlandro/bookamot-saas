import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GarageApprovalStatus } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await prisma.garage.count({
      where: {
        approvalStatus: {
          in: [GarageApprovalStatus.PENDING, GarageApprovalStatus.INFO_REQUESTED]
        }
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching pending garages count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
