import assert from 'node:assert'
import { readLocalMotJson, transformDVSAData } from '../lib/mot-utils'

;(async () => {
  const dvsa = await readLocalMotJson('WJ11USE')
  assert.ok(dvsa)
  const data = transformDVSAData(dvsa)
  assert.ok(Array.isArray(data))
  assert.ok(data.length >= 3)
  const last = data[0]
  assert.strictEqual(typeof last.mileage, 'number')
  console.log(`✅ test-mot-history-integration-mock: ${data.length} records transformed`)
})()
