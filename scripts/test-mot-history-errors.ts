import assert from 'node:assert'
import { transformDVSAData } from '../src/lib/mot-utils'

function makeDvsaData(firstUsedDate: string, tests: any[]) {
  return { firstUsedDate, motTests: tests }
}

const dvsaEmpty = makeDvsaData('2011-03-29', [])
const resEmpty = transformDVSAData(dvsaEmpty)
assert.strictEqual(Array.isArray(resEmpty), true)
assert.strictEqual(resEmpty.length, 0)

const dvsaInvalidDates = makeDvsaData('2023-01-01', [
  { completedDate: '2024-01-01T00:00:00.000Z', odometerValue: '100', odometerUnit: 'MI', testResult: 'PASSED', defects: [] }
])
const resInvalid = transformDVSAData(dvsaInvalidDates)
assert.strictEqual(resInvalid.length, 0)

const dvsaValid = makeDvsaData('2011-03-29', [
  { completedDate: '2015-04-01T00:00:00.000Z', expiryDate: '2016-04-01', odometerValue: '100', odometerUnit: 'MI', testResult: 'PASSED', defects: [{ dangerous: false, type: 'ADVISORY', text: 'note' }] }
])
const resValid = transformDVSAData(dvsaValid)
assert.strictEqual(resValid.length, 1)
assert.strictEqual(resValid[0].mileage, 161)
assert.strictEqual(resValid[0].odometerUnit, 'KILOMETRES')
assert.deepStrictEqual(resValid[0].defects, { dangerous: 0, major: 0, minor: 0, advisory: 1, prs: 0 })
assert.deepStrictEqual(resValid[0].details, ['note'])

console.log('✅ test-mot-history-errors: all assertions passed')
