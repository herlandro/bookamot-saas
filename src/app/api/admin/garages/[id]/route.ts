import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GarageApprovalStatus } from '@prisma/client'
import { 
  sendGarageApprovalEmail, 
  sendGarageRejectionEmail, 
  sendGarageInfoRequestEmail 
} from '@/lib/email'

// GET - Get single garage details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const garage = await prisma.garage.findUnique({
      where: { id },
      include: {
        owner: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            phone: true,
            emailVerified: true,
            createdAt: true 
          } 
        },
        approvalLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            admin: { select: { name: true, email: true } }
          }
        },
        _count: {
          select: { bookings: true, reviews: true }
        }
      }
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    return NextResponse.json(garage)
  } catch (error) {
    console.error('Error fetching garage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update garage (approve, reject, request info)
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
    const { action, reason } = body

    // Get garage with owner info
    const garage = await prisma.garage.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } } }
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    let updateData: {
      approvalStatus: GarageApprovalStatus
      isActive: boolean
      dvlaApproved: boolean
      approvedAt?: Date
      approvedById?: string
      rejectionReason?: string | null
    }

    switch (action) {
      case 'approve':
        updateData = {
          approvalStatus: GarageApprovalStatus.APPROVED,
          isActive: true,
          dvlaApproved: true,
          approvedAt: new Date(),
          approvedById: session.user.id,
          rejectionReason: null
        }
        break

      case 'reject':
        if (!reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          )
        }
        updateData = {
          approvalStatus: GarageApprovalStatus.REJECTED,
          isActive: false,
          dvlaApproved: false,
          rejectionReason: reason
        }
        break

      case 'request_info':
        if (!reason) {
          return NextResponse.json(
            { error: 'Information request details are required' },
            { status: 400 }
          )
        }
        updateData = {
          approvalStatus: GarageApprovalStatus.INFO_REQUESTED,
          isActive: false,
          dvlaApproved: false,
          rejectionReason: reason // Store the info request in this field
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: approve, reject, or request_info' },
          { status: 400 }
        )
    }

    // Update garage
    const updatedGarage = await prisma.garage.update({
      where: { id },
      data: updateData
    })

    // Create approval log
    await prisma.garageApprovalLog.create({
      data: {
        garageId: id,
        action: updateData.approvalStatus,
        reason: reason || null,
        adminId: session.user.id
      }
    })

    // Send appropriate email
    try {
      const ownerName = garage.owner?.name || 'Garage Owner'
      const ownerEmail = garage.owner?.email || garage.email

      switch (action) {
        case 'approve':
          await sendGarageApprovalEmail(ownerEmail, garage.name, ownerName)
          console.log(`📧 Approval email sent to ${ownerEmail}`)
          break

        case 'reject':
          await sendGarageRejectionEmail(ownerEmail, garage.name, ownerName, reason)
          console.log(`📧 Rejection email sent to ${ownerEmail}`)
          break

        case 'request_info':
          await sendGarageInfoRequestEmail(ownerEmail, garage.name, ownerName, reason)
          console.log(`📧 Info request email sent to ${ownerEmail}`)
          break
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    console.log(`✅ Garage "${garage.name}" ${action}ed by admin ${session.user.email}`)

    return NextResponse.json({
      success: true,
      garage: updatedGarage,
      message: `Garage ${action === 'request_info' ? 'info requested' : action + 'd'} successfully`
    })
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

    // Get garage info for logging
    const garage = await prisma.garage.findUnique({
      where: { id },
      include: { owner: { select: { id: true } } }
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    // Delete the garage (this will cascade delete related records based on schema)
    await prisma.garage.delete({
      where: { id }
    })

    // Optionally delete the owner user as well (if they only owned this garage)
    // Uncomment if you want this behavior:
    // if (garage.owner?.id) {
    //   await prisma.user.delete({ where: { id: garage.owner.id } })
    // }

    console.log(`🗑️ Garage "${garage.name}" deleted by admin ${session.user.email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting garage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
