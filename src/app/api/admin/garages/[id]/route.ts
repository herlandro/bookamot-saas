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
    
    // Validate ID
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid garage ID provided' },
        { status: 400 }
      )
    }
    
    let body: any = {}
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }
    
    const { action, reason } = body
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required. Must be: approve, reject, or request_info' },
        { status: 400 }
      )
    }

    // Get garage with owner info
    const garage = await prisma.garage.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } } }
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    // Validate action
    const validActions = ['approve', 'reject', 'request_info']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
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
        // Validate that admin user ID exists
        if (!session.user.id) {
          return NextResponse.json(
            { error: 'Admin user ID is missing. Please log in again.' },
            { status: 401 }
          )
        }
        
        // Verify admin user exists in database
        try {
          const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
          })
          
          if (!adminUser) {
            return NextResponse.json(
              { error: 'Admin user not found. Please log in again.' },
              { status: 401 }
            )
          }
        } catch (userCheckError) {
          console.error('Error checking admin user:', userCheckError)
          return NextResponse.json(
            { error: 'Failed to verify admin user.' },
            { status: 500 }
          )
        }
        
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
    let updatedGarage
    try {
      updatedGarage = await prisma.garage.update({
        where: { id },
        data: updateData
      })
    } catch (dbError: any) {
      console.error('Database error updating garage:', dbError)
      
      // Provide more specific error message
      let errorMessage = 'Failed to update garage. Please try again.'
      if (dbError?.code === 'P2002') {
        errorMessage = 'A garage with this information already exists.'
      } else if (dbError?.code === 'P2025') {
        errorMessage = 'Garage not found in database.'
      } else if (dbError?.code === 'P2003') {
        // Foreign key constraint failed
        const field = dbError?.meta?.field_name || 'related field'
        errorMessage = `Invalid reference: ${field}. Please check that all related records exist.`
      } else if (dbError?.code === 'P2011') {
        // Null constraint violation
        errorMessage = 'Required field is missing. Please check all required fields are provided.'
      } else if (dbError?.message) {
        errorMessage = `Database error: ${dbError.message}`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          success: false,
          details: process.env.NODE_ENV === 'development' ? {
            code: dbError?.code,
            message: dbError?.message,
            meta: dbError?.meta
          } : undefined
        },
        { status: 500 }
      )
    }

    // Create approval log
    try {
      await prisma.garageApprovalLog.create({
        data: {
          garageId: id,
          action: updateData.approvalStatus,
          reason: reason || null,
          adminId: session.user.id
        }
      })
    } catch (logError: any) {
      // Log error but don't fail the request - garage was already updated
      console.error('Failed to create approval log (non-critical):', logError)
    }

    // Send appropriate email
    let emailSent = false
    let emailError: string | null = null
    
    try {
      const ownerName = garage.owner?.name || 'Garage Owner'
      const ownerEmail = garage.owner?.email || garage.email

      if (!ownerEmail) {
        emailError = 'No email address found for garage owner'
      } else {
        switch (action) {
          case 'approve':
            // Get admin name for email
            const admin = await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { name: true, email: true }
            })
            const adminName = admin?.name || admin?.email || 'Administrator'
            
            await sendGarageApprovalEmail(
              ownerEmail, 
              garage.name, 
              ownerName,
              updateData.approvedAt,
              adminName
            )
            emailSent = true
            break

          case 'reject':
            if (!reason) {
              emailError = 'Rejection reason is required for sending email'
            } else {
              await sendGarageRejectionEmail(ownerEmail, garage.name, ownerName, reason)
              emailSent = true
            }
            break

          case 'request_info':
            if (!reason) {
              emailError = 'Information request details are required for sending email'
            } else {
              await sendGarageInfoRequestEmail(ownerEmail, garage.name, ownerName, reason)
              emailSent = true
            }
            break
        }
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Unknown error occurred while sending email'
      console.error('Failed to send email notification:', err)
    }

    // Return success response even if email failed (garage status was updated)
    // but include email status in the response
    const responseMessage = emailSent 
      ? `Garage ${action === 'request_info' ? 'info requested' : action + 'd'} successfully. Email sent to owner.`
      : `Garage ${action === 'request_info' ? 'info requested' : action + 'd'} successfully, but email could not be sent: ${emailError || 'Unknown error'}`

    const responseData = {
      success: true,
      garage: {
        id: updatedGarage.id,
        name: updatedGarage.name,
        approvalStatus: updatedGarage.approvalStatus,
        isActive: updatedGarage.isActive,
        dvlaApproved: updatedGarage.dvlaApproved,
        approvedAt: updatedGarage.approvedAt,
        approvedById: updatedGarage.approvedById,
        rejectionReason: updatedGarage.rejectionReason
      },
      message: responseMessage,
      emailSent,
      emailError: emailError || undefined
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('Unexpected error updating garage:', error)
    
    // Provide more detailed error message
    let errorMessage = 'Internal server error'
    let errorDetails: any = {}
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = error
      if ('message' in error) {
        errorMessage = String(error.message) || errorMessage
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting garage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
