import assert from 'node:assert'
import { fetchWithRetries } from '../src/lib/mot-utils'

class MockResponse {
  status: number
  ok: boolean
  statusText: string
  private body: string
  private hdrs: Map<string, string>
  constructor(status: number, body = '', headers: Record<string, string> = {}) {
    this.status = status
    this.ok = status >= 200 && status < 300
    this.statusText = ''
    this.body = body
    this.hdrs = new Map(Object.entries(headers))
  }
  async text() { return this.body }
  async json() { return JSON.parse(this.body || '{}') }
  headers = { get: (k: string) => this.hdrs.get(k) || null }
}

let calls = 0
// @ts-ignore
global.fetch = async () => {
  calls += 1
  if (calls === 1) return new MockResponse(429, '', { 'Retry-After': '1' })
  return new MockResponse(200, JSON.stringify([{ motTests: [] }]))
}

const url = 'https://example.com/test'
const headers = { Accept: 'application/json' }

;(async () => {
  const res = await fetchWithRetries(url, headers, 2, 2000)
  assert.ok(res)
  assert.strictEqual(calls >= 2, true)
  console.log('✅ test-mot-history-rate-limit: retries handled')
})()
