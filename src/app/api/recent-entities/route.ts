'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch recent customers (last 5)
    const recentCustomers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Fetch recent vehicles (last 5)
    const recentVehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        make: true,
        model: true,
        registration: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Fetch recent garages (last 5)
    const recentGarages = await prisma.garage.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        postcode: true,
        description: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json({
      customers: recentCustomers.map(c => ({
        id: c.id,
        name: c.name || 'Unknown',
        email: c.email,
        createdAt: c.createdAt.toISOString()
      })),
      vehicles: recentVehicles.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        registration: v.registration,
        owner: {
          id: v.owner.id,
          name: v.owner.name || 'Unknown',
          email: v.owner.email
        }
      })),
      garages: recentGarages.map(g => ({
        id: g.id,
        name: g.name,
        location: `${g.city}, ${g.postcode}`,
        specialty: g.description || 'MOT Testing'
      }))
    })
  } catch (error) {
    console.error('Error fetching recent entities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
