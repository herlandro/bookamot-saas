import assert from 'assert'

type DVSADefect = { text?: string; type?: string; dangerous?: boolean }
type DVSATest = {
  completedDate: string
  expiryDate?: string
  testResult?: string
  odometerValue?: string
  odometerUnit?: 'MILES' | 'KILOMETRES'
  odometerResultType?: string
  motTestNumber?: string
  dataSource?: string
  registrationAtTimeOfTest?: string
  defects?: DVSADefect[]
}

function milesToKm(value: number | null): number | null {
  if (value == null) return null
  return Math.round(value * 1.60934)
}

function transform(test: DVSATest) {
  const defects = Array.isArray(test.defects) ? test.defects : []
  const dangerousCount = defects.filter(d => d.dangerous === true).length
  const majorCount = defects.filter(d => d.type === 'MAJOR').length
  const minorCount = defects.filter(d => d.type === 'MINOR').length
  const advisoryCount = defects.filter(d => d.type === 'ADVISORY').length
  const prsCount = defects.filter(d => d.type === 'PRS').length

  const rawMileage = test?.odometerValue ? parseInt(test.odometerValue, 10) : null
  const mileageKm = test?.odometerUnit === 'MILES' ? milesToKm(rawMileage) : rawMileage

  return {
    testDate: test.completedDate,
    expiryDate: test.expiryDate || null,
    result: test.testResult === 'PASSED' ? 'PASS' : test.testResult === 'FAILED' ? 'FAIL' : 'REFUSED',
    mileage: mileageKm,
    defects: { dangerous: dangerousCount, major: majorCount, minor: minorCount, advisory: advisoryCount, prs: prsCount },
    details: defects.map(d => d.text).filter((t): t is string => typeof t === 'string')
  }
}

// Unit tests
const sampleMiles: DVSATest = {
  completedDate: '2024-10-01',
  odometerValue: '1000',
  odometerUnit: 'MILES',
  testResult: 'PASSED',
  defects: [{ type: 'MAJOR' }, { type: 'MINOR' }, { type: 'ADVISORY' }, { dangerous: true }]
}
const sampleKm: DVSATest = {
  completedDate: '2024-09-01',
  odometerValue: '1000',
  odometerUnit: 'KILOMETRES',
  testResult: 'FAILED',
  defects: []
}

const t1 = transform(sampleMiles)
assert.strictEqual(t1.result, 'PASS')
assert.strictEqual(t1.mileage, 1609)
assert.deepStrictEqual(t1.defects, { dangerous: 1, major: 1, minor: 1, advisory: 1, prs: 0 })

const t2 = transform(sampleKm)
assert.strictEqual(t2.result, 'FAIL')
assert.strictEqual(t2.mileage, 1000)
assert.deepStrictEqual(t2.defects, { dangerous: 0, major: 0, minor: 0, advisory: 0, prs: 0 })

console.log('✅ MOT mapping unit tests passed')

