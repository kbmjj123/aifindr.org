import test from 'node:test'
import assert from 'node:assert/strict'
import { collectBlogItems, collectToolItems, fetchJson, FEED_LIMIT } from '../scripts/lib/rss-data.mjs'

function jsonFetch(payloads) {
  return async (url) => {
    const key = Object.keys(payloads).find(k => url.includes(k))
    if (!key) throw new Error(`unexpected URL: ${url}`)
    return { ok: true, json: async () => payloads[key] }
  }
}

const silent = { warn() {}, log() {} }

test('FEED_LIMIT is 50', () => {
  assert.equal(FEED_LIMIT, 50)
})

test('collectBlogItems maps en translation into a full-content item', async () => {
  const fetchImpl = jsonFetch({
    '/api/blog?pageSize=50': {
      posts: [{ slug: 'hello', title: 'Old', meta_desc: 'Old desc', published_at: 1764000000 }],
      total: 1,
    },
    '/api/blog/hello': {
      translations: {
        en: { title: 'Hello', content: '# Hi\n\n[docs](/guide)', meta_desc: 'Desc', cover_image: '/cover.png' },
        zh: { title: '你好' },
      },
    },
  })
  const items = await collectBlogItems({ siteUrl: 'https://aifindr.org', fetchImpl, logger: silent })
  assert.equal(items.length, 1)
  assert.equal(items[0].title, 'Hello')
  assert.equal(items[0].link, 'https://aifindr.org/blog/hello')
  assert.equal(items[0].guid, items[0].link)
  assert.equal(items[0].pubDate, 'Mon, 24 Nov 2025 16:00:00 GMT')
  assert.equal(items[0].description, 'Desc')
  assert.match(items[0].content, /<img src="https:\/\/aifindr.org\/cover.png" alt="" \/>/)
  assert.match(items[0].content, /href="https:\/\/aifindr.org\/guide"/)
  assert.deepEqual(items[0].categories, ['Blog'])
})

test('collectBlogItems skips a post whose detail request fails', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('/api/blog?pageSize=')) {
      return { ok: true, json: async () => ({ posts: [{ slug: 'bad', published_at: 1764000000 }] }) }
    }
    throw new Error('boom')
  }
  const warnings = []
  const items = await collectBlogItems({
    siteUrl: 'https://aifindr.org',
    fetchImpl,
    logger: { warn: msg => warnings.push(msg), log() {} },
  })
  assert.equal(items.length, 0)
  assert.match(warnings[0], /skip blog post bad/)
})

test('collectBlogItems propagates list request failure', async () => {
  const fetchImpl = async () => ({ ok: false, status: 503 })
  await assert.rejects(
    collectBlogItems({ siteUrl: 'https://aifindr.org', fetchImpl, logger: silent }),
    /HTTP 503/,
  )
})

test('collectToolItems maps active tool response into a full-content item', async () => {
  const fetchImpl = jsonFetch({
    '/api/tools?sort=latest&pageSize=50': {
      tools: [{
        slug: 'writer', category: 'writing', name: 'Writer AI',
        submitted_at: '2026-11-26 10:00:00',
        short_description: 'Write faster', body: '**Bold** text',
      }],
      total: 1,
    },
  })
  const items = await collectToolItems({ siteUrl: 'https://aifindr.org', fetchImpl })
  assert.equal(items.length, 1)
  assert.equal(items[0].link, 'https://aifindr.org/tools/writing/writer')
  assert.equal(items[0].pubDate, 'Thu, 26 Nov 2026 10:00:00 GMT')
  assert.equal(items[0].description, 'Write faster')
  assert.match(items[0].content, /<strong>Bold<\/strong>/)
  assert.deepEqual(items[0].categories, ['writing'])
})

test('fetchJson retries then succeeds', async () => {
  let calls = 0
  const fetchImpl = async () => {
    calls += 1
    if (calls === 1) throw new Error('network')
    return { ok: true, json: async () => ({ ok: true }) }
  }
  const data = await fetchJson('https://aifindr.org/api/blog?pageSize=50', fetchImpl, {
    retries: 1,
    timeoutMs: 1000,
    sleep: async () => {},
  })
  assert.equal(calls, 2)
  assert.deepEqual(data, { ok: true })
})
