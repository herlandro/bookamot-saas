import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GarageApprovalStatus } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ count: 0, pending: 0, infoRequested: 0 })
    }

    const [pending, infoRequested] = await Promise.all([
      prisma.garage.count({
        where: { approvalStatus: GarageApprovalStatus.PENDING }
      }),
      prisma.garage.count({
        where: { approvalStatus: GarageApprovalStatus.INFO_REQUESTED }
      })
    ])

    return NextResponse.json({ 
      count: pending + infoRequested,
      pending,
      infoRequested 
    })
  } catch (error) {
    console.error('Error fetching pending garages count:', error)
    return NextResponse.json({ count: 0, pending: 0, infoRequested: 0 })
  }
}

