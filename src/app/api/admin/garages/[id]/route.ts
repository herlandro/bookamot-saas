import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive, dvlaApproved } = body

    // Build update data dynamically
    const updateData: { isActive?: boolean; dvlaApproved?: boolean } = {}

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    if (typeof dvlaApproved === 'boolean') {
      updateData.dvlaApproved = dvlaApproved
    }

    // If activating a garage, also approve DVLA (unless explicitly set to false)
    if (isActive === true && dvlaApproved === undefined) {
      updateData.dvlaApproved = true
    }

    const garage = await prisma.garage.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(garage)
  } catch (error) {
    console.error('Error updating garage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.garage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting garage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

