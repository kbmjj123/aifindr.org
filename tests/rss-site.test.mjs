import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('nuxt config declares both alternate feed links', () => {
  const source = read('nuxt.config.ts')
  assert.match(source, /href: '\/rss\.xml'/)
  assert.match(source, /href: '\/tools\.rss\.xml'/)
  assert.match(source, /rel: 'alternate'/)
})

test('blog and tools pages expose visible subscription links', () => {
  assert.match(read('pages/blog/index.vue'), /href="\/rss\.xml"/)
  assert.match(read('pages/tools/index.vue'), /href="\/tools\.rss\.xml"/)
})

test('footer exposes both feeds', () => {
  const footer = read('components/layout/AppFooter.vue')
  assert.match(footer, /href="\/rss\.xml"/)
  assert.match(footer, /href="\/tools\.rss\.xml"/)
})
