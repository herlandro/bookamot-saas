import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMotReport, generateJsonReport, generateCsvReport } from '@/lib/services/mot-report-service'

/**
 * GET /api/vehicles/[id]/mot-report
 * Generate MOT report for a vehicle
 * Query params:
 *   - format: 'json' (default) or 'csv'
 *   - download: 'true' to download as file
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicleId = (await params).id
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json'
    const download = searchParams.get('download') === 'true'

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: session.user.id
      }
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Generate report
    const report = await generateMotReport(vehicleId)

    if (!report) {
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      )
    }

    let content: string
    let contentType: string
    let filename: string

    if (format === 'csv') {
      content = generateCsvReport(report)
      contentType = 'text/csv'
      filename = `MOT_Report_${vehicle.registration}_${new Date().toISOString().split('T')[0]}.csv`
    } else {
      content = generateJsonReport(report)
      contentType = 'application/json'
      filename = `MOT_Report_${vehicle.registration}_${new Date().toISOString().split('T')[0]}.json`
    }

    if (download) {
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    // Return as JSON response
    if (format === 'csv') {
      return NextResponse.json({
        success: true,
        format: 'csv',
        data: content,
        filename
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('❌ Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

