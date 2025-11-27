/**
 * MOT Report Service
 * Generates reports for MOT history
 */

import { prisma } from '@/lib/prisma'

interface MotReportData {
  vehicle: {
    id: string
    registration: string
    make: string
    model: string
    year: number
    fuelType: string
    engineSize?: string
  }
  motHistory: Array<{
    testDate: string
    expiryDate: string | null
    result: string
    mileage: number
    testNumber: string
    defects: {
      dangerous: number
      major: number
      minor: number
      advisory: number
      prs: number
    }
    details: Array<{
      text: string
      type: string
      dangerous: boolean
    }>
  }>
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    passRate: number
    averageMileage: number
    latestTestDate: string | null
    nextMotDate: string | null
    daysUntilExpiry: number | null
  }
}

/**
 * Generate MOT report for a vehicle
 */
export async function generateMotReport(vehicleId: string): Promise<MotReportData | null> {
  try {
    // Get vehicle with MOT history
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        motHistory: {
          orderBy: { testDate: 'desc' }
        }
      }
    })

    if (!vehicle) {
      console.log(`⚠️  Vehicle ${vehicleId} not found`)
      return null
    }

    // Format MOT history
    const motHistory = vehicle.motHistory.map(record => ({
      testDate: record.testDate.toISOString().split('T')[0],
      expiryDate: record.expiryDate ? record.expiryDate.toISOString().split('T')[0] : null,
      result: record.result,
      mileage: record.mileage || 0,
      testNumber: record.testNumber || record.certificateNumber || 'N/A',
      defects: {
        dangerous: record.dangerousDefects || 0,
        major: record.majorDefects || 0,
        minor: record.minorDefects || 0,
        advisory: record.advisoryDefects || 0,
        prs: record.prsDefects || 0
      },
      details: record.defectDetails ? JSON.parse(record.defectDetails) : []
    }))

    // Calculate summary statistics
    const passedTests = vehicle.motHistory.filter(m => m.result === 'PASS').length
    const failedTests = vehicle.motHistory.filter(m => m.result === 'FAIL').length
    const totalTests = vehicle.motHistory.length
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    const averageMileage = totalTests > 0 
      ? Math.round(vehicle.motHistory.reduce((sum, m) => sum + (m.mileage || 0), 0) / totalTests)
      : 0

    const latestMot = vehicle.motHistory[0]
    const latestTestDate = latestMot ? latestMot.testDate.toISOString().split('T')[0] : null
    const nextMotDate = latestMot?.expiryDate ? latestMot.expiryDate.toISOString().split('T')[0] : null
    
    let daysUntilExpiry = null
    if (latestMot?.expiryDate) {
      const now = new Date()
      const expiryDate = new Date(latestMot.expiryDate)
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    const report: MotReportData = {
      vehicle: {
        id: vehicle.id,
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        engineSize: vehicle.engineSize ?? undefined,
      },
      motHistory,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        passRate,
        averageMileage,
        latestTestDate,
        nextMotDate,
        daysUntilExpiry
      }
    }

    console.log(`📊 Generated MOT report for ${vehicle.registration}`)
    return report
  } catch (error) {
    console.error('❌ Error generating MOT report:', error)
    throw error
  }
}

/**
 * Generate JSON report
 */
export function generateJsonReport(report: MotReportData): string {
  return JSON.stringify(report, null, 2)
}

/**
 * Generate CSV report
 */
export function generateCsvReport(report: MotReportData): string {
  let csv = 'MOT History Report\n'
  csv += `Vehicle: ${report.vehicle.registration} (${report.vehicle.make} ${report.vehicle.model})\n`
  csv += `Year: ${report.vehicle.year}, Fuel Type: ${report.vehicle.fuelType}\n\n`

  csv += 'Summary\n'
  csv += `Total Tests,${report.summary.totalTests}\n`
  csv += `Passed,${report.summary.passedTests}\n`
  csv += `Failed,${report.summary.failedTests}\n`
  csv += `Pass Rate,${report.summary.passRate}%\n`
  csv += `Average Mileage,${report.summary.averageMileage} miles\n`
  csv += `Latest Test,${report.summary.latestTestDate}\n`
  csv += `Next MOT,${report.summary.nextMotDate}\n`
  csv += `Days Until Expiry,${report.summary.daysUntilExpiry}\n\n`

  csv += 'MOT History\n'
  csv += 'Test Date,Expiry Date,Result,Mileage,Test Number,Dangerous,Major,Minor,Advisory,PRS\n'
  
  report.motHistory.forEach(test => {
    csv += `${test.testDate},${test.expiryDate},${test.result},${test.mileage},${test.testNumber},`
    csv += `${test.defects.dangerous},${test.defects.major},${test.defects.minor},${test.defects.advisory},${test.defects.prs}\n`
  })

  return csv
}

