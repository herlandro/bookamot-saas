import assert from 'assert'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const vehicle = await prisma.vehicle.findFirst()
  if (!vehicle) {
    console.log('⚠️ No vehicles in database to test')
    process.exit(0)
  }

  const res = await fetch(`http://localhost:3000/api/vehicles/${vehicle.id}`)
  if (res.status === 200) {
    const data = await res.json()
    assert.ok(data.id && data.registration, 'Response should include id and registration')
    assert.ok(Array.isArray(data.motTests), 'Response should include motTests array')
    if (data.motTests.length > 0) {
      const t = data.motTests[0]
      assert.ok(t.testDate, 'motTests item should have testDate')
      assert.ok(typeof t.mileage === 'number' || t.mileage === null, 'motTests item mileage should be number or null')
      assert.ok(t.result, 'motTests item should have result')
      assert.ok(t.defects && typeof t.defects === 'object', 'motTests item should have defects object')
    }
    console.log('✅ Vehicle details API integration test passed')
  } else if (res.status === 401) {
    console.log('ℹ️ Vehicle details API requires authentication (received 401). Integration test skipped.')
  } else {
    assert.fail(`Unexpected status code ${res.status}`)
  }
}

main().catch((e) => {
  console.error('❌ Integration test failed', e)
  process.exit(1)
})
