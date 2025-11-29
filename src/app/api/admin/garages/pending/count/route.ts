import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.garage.count({
      where: {
        isActive: false
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching pending garages count:', error)
    return NextResponse.json({ count: 0 })
  }
}

