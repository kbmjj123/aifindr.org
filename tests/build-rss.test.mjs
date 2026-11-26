import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateRss } from '../scripts/build-rss.mjs'

function jsonFetch(payloads) {
  return async (url) => {
    const key = Object.keys(payloads).find(k => url.includes(k))
    if (!key) throw new Error(`unexpected URL: ${url}`)
    return { ok: true, json: async () => payloads[key] }
  }
}

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'aifindr-rss-'))
  mkdirSync(join(root, 'public'), { recursive: true })
  return root
}

const silent = { warn() {}, log() {} }

function okFetch() {
  return jsonFetch({
    '/api/blog?pageSize=': {
      posts: [{ slug: 'hello', published_at: 1764000000 }],
    },
    '/api/blog/hello': {
      translations: { en: { title: 'Hello', content: 'Body', meta_desc: 'Desc' } },
    },
    '/api/tools?sort=latest': {
      tools: [{ slug: 'writer', category: 'writing', name: 'Writer', submitted_at: '2026-11-26 10:00:00' }],
    },
  })
}

test('generateRss writes both feeds and returns item counts', async () => {
  const root = makeRoot()
  const counts = await generateRss({
    siteUrl: 'https://aifindr.org',
    fetchImpl: okFetch(),
    root,
    now: new Date('2026-11-26T00:00:00Z'),
    logger: silent,
  })
  assert.deepEqual(counts, { blog: 1, tools: 1 })
  const blogXml = readFileSync(join(root, 'public/rss.xml'), 'utf8')
  const toolsXml = readFileSync(join(root, 'public/tools.rss.xml'), 'utf8')
  assert.match(blogXml, /<title>Hello<\/title>/)
  assert.match(blogXml, /<atom:link href="https:\/\/aifindr.org\/rss.xml"/)
  assert.match(toolsXml, /<title>Writer<\/title>/)
  assert.match(toolsXml, /<lastBuildDate>Thu, 26 Nov 2026 00:00:00 GMT<\/lastBuildDate>/)
})

test('generateRss keeps the previous blog file when its list request fails', async () => {
  const root = makeRoot()
  const previous = '<!-- previous -->'
  writeFileSync(join(root, 'public/rss.xml'), previous, 'utf8')
  const fetchImpl = async (url) => {
    if (url.includes('/api/tools?sort=latest')) {
      return { ok: true, json: async () => ({ tools: [] }) }
    }
    return { ok: false, status: 503 }
  }
  const counts = await generateRss({ siteUrl: 'https://aifindr.org', fetchImpl, root, logger: silent })
  assert.deepEqual(counts, { blog: null, tools: 0 })
  assert.equal(readFileSync(join(root, 'public/rss.xml'), 'utf8'), previous)
})

test('generateRss writes an empty feed when failing with no previous file', async () => {
  const root = makeRoot()
  const fetchImpl = async () => ({ ok: false, status: 500 })
  await generateRss({ siteUrl: 'https://aifindr.org', fetchImpl, root, logger: silent })
  const xml = readFileSync(join(root, 'public/rss.xml'), 'utf8')
  assert.match(xml, /<rss version="2.0"/)
  assert.doesNotMatch(xml, /<item>/)
})

test('generateRss throws in strict mode', async () => {
  const root = makeRoot()
  const fetchImpl = async () => ({ ok: false, status: 500 })
  await assert.rejects(
    generateRss({ siteUrl: 'https://aifindr.org', fetchImpl, root, strict: true, logger: silent }),
    /HTTP 500/,
  )
})
