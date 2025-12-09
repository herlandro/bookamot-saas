import fs from 'fs/promises'
import path from 'path'

export async function fetchWithRetries(url: string, headers: Record<string, string>, retries = 2, timeoutMs = 10000): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { method: 'GET', headers, signal: controller.signal })
      clearTimeout(timer)
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10)
        const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(2000 * (attempt + 1), 10000)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      if (!res.ok && res.status >= 500 && attempt < retries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      return res
    } catch (e) {
      clearTimeout(timer)
      if (attempt < retries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      return null
    }
  }
  return null
}

function isValidMotTestDate(testDate: string, vehicleYear: number): boolean {
  const testYear = new Date(testDate).getFullYear()
  const minValidYear = vehicleYear + 3
  return testYear >= minValidYear
}

function getVehicleYear(dvsaData: any): number {
  if (dvsaData.firstUsedDate) {
    const dateMatch = dvsaData.firstUsedDate.match(/\d{4}/)
    if (dateMatch) {
      return parseInt(dateMatch[0], 10)
    }
  }
  if (dvsaData.manufactureYear) {
    return parseInt(dvsaData.manufactureYear, 10)
  }
  return new Date().getFullYear()
}

export function transformDVSAData(dvsaData: any): any[] {
  if (!dvsaData.motTests || !Array.isArray(dvsaData.motTests)) {
    return []
  }
  const vehicleYear = getVehicleYear(dvsaData)
  const validTests = dvsaData.motTests.filter((test: any) => isValidMotTestDate(test.completedDate, vehicleYear))
  return validTests.map((test: any) => {
    const defects = Array.isArray(test.defects) ? test.defects : []
    const dangerousCount = defects.filter((d: any) => d.dangerous === true).length
    const majorCount = defects.filter((d: any) => d.type === 'MAJOR').length
    const minorCount = defects.filter((d: any) => d.type === 'MINOR').length
    const advisoryCount = defects.filter((d: any) => d.type === 'ADVISORY').length
    const prsCount = defects.filter((d: any) => d.type === 'PRS').length
    const rawMileage = test?.odometerValue ? parseInt(test.odometerValue, 10) : null
    const unitStr = (test?.odometerUnit || '').toUpperCase()
    const isMiles = unitStr.startsWith('MI')
    const mileageKm = rawMileage !== null ? (isMiles ? Math.round(rawMileage * 1.60934) : rawMileage) : null
    const normalizedUnit = isMiles ? 'KILOMETRES' : unitStr || null
    return {
      id: test.motTestNumber || `${test.completedDate}-${test.registrationAtTimeOfTest || ''}`,
      testDate: test.completedDate,
      expiryDate: test.expiryDate || null,
      result: test.testResult === 'PASSED' ? 'PASS' : test.testResult === 'FAILED' ? 'FAIL' : 'REFUSED',
      mileage: mileageKm,
      odometerUnit: normalizedUnit,
      odometerResultType: test.odometerResultType,
      testNumber: test.motTestNumber,
      dataSource: test.dataSource,
      registrationAtTimeOfTest: test.registrationAtTimeOfTest,
      defects: { dangerous: dangerousCount, major: majorCount, minor: minorCount, advisory: advisoryCount, prs: prsCount },
      details: defects.map((d: any) => d.text).filter((t: any) => typeof t === 'string')
    }
  })
}

export async function readLocalMotJson(registration: string): Promise<any | null> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'vehicles', '[id]', 'mot-history', `vehicle-${registration}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export function validateMotSchema(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid JSON structure'
  if (!Array.isArray(data.motTests)) return 'motTests must be an array'
  const allowedResults = new Set(['PASSED', 'FAILED', 'REFUSED'])
  for (const t of data.motTests) {
    if (!t || typeof t !== 'object') return 'motTests contains invalid entries'
    if (!t.completedDate || typeof t.completedDate !== 'string') return 'completedDate missing or invalid'
    if (!t.testResult || typeof t.testResult !== 'string' || !allowedResults.has(t.testResult)) return 'testResult missing or invalid'
    if (t.odometerValue != null && isNaN(parseInt(String(t.odometerValue), 10))) return 'odometerValue must be numeric'
    if (t.defects != null && !Array.isArray(t.defects)) return 'defects must be an array'
    if (Array.isArray(t.defects)) {
      for (const d of t.defects) {
        if (!d || typeof d !== 'object' || typeof d.text !== 'string') return 'defect entries must include text'
      }
    }
  }
  return null
}
