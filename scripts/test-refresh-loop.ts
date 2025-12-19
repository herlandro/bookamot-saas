import assert from 'node:assert/strict'

const baseUrl = process.env.TEST_BASE_URL || process.env.BASE_URL || 'http://localhost:3000'

async function fetchOnce(path: string) {
  const url = new URL(path, baseUrl).toString()
  const res = await fetch(url, { cache: 'no-store' })
  return { res, url }
}

async function main() {
  const sw1 = await fetchOnce('/sw.js')
  assert.equal(sw1.res.ok, true, `Expected GET ${sw1.url} to succeed`)
  const sw1Etag = sw1.res.headers.get('etag')
  const sw1CacheControl = sw1.res.headers.get('cache-control') || ''
  const sw1Body = await sw1.res.text()
  assert.equal(
    sw1CacheControl.includes('immutable'),
    false,
    `Expected /sw.js Cache-Control to not include immutable, got: ${sw1CacheControl}`
  )
  assert.equal(
    /no-cache|no-store|max-age=0/.test(sw1CacheControl),
    true,
    `Expected /sw.js Cache-Control to include no-cache/no-store/max-age=0, got: ${sw1CacheControl}`
  )
  const buildVersionMatch = sw1Body.match(/const BUILD_VERSION = '([^']+)'/)
  assert.equal(!!buildVersionMatch, true, 'Expected /sw.js to contain BUILD_VERSION constant')
  const cacheNameMatch = sw1Body.match(/const CACHE_NAME = '([^']+)'/)
  assert.equal(!!cacheNameMatch, true, 'Expected /sw.js to contain CACHE_NAME constant')
  if (buildVersionMatch && cacheNameMatch) {
    assert.equal(
      cacheNameMatch[1].includes(buildVersionMatch[1]),
      true,
      `Expected CACHE_NAME to include BUILD_VERSION, got: ${cacheNameMatch[1]} / ${buildVersionMatch[1]}`
    )
  }

  const sw2 = await fetchOnce('/sw.js')
  assert.equal(sw2.res.ok, true, `Expected GET ${sw2.url} to succeed`)
  const sw2Etag = sw2.res.headers.get('etag')
  if (sw1Etag && sw2Etag) {
    assert.equal(sw1Etag, sw2Etag, `Expected /sw.js ETag to be stable, got: ${sw1Etag} -> ${sw2Etag}`)
  }

  const v1 = await fetchOnce('/api/version')
  assert.equal(v1.res.ok, true, `Expected GET ${v1.url} to succeed`)
  const v1Json = (await v1.res.json()) as { version?: string }
  assert.equal(typeof v1Json.version, 'string', `Expected /api/version to return a version string`)

  const v2 = await fetchOnce('/api/version')
  assert.equal(v2.res.ok, true, `Expected GET ${v2.url} to succeed`)
  const v2Json = (await v2.res.json()) as { version?: string }
  assert.equal(v1Json.version, v2Json.version, `Expected /api/version.version to be stable between requests`)

  const home = await fetchOnce('/')
  assert.equal(home.res.ok, true, `Expected GET ${home.url} to succeed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
