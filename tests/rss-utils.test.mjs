import test from 'node:test'
import assert from 'node:assert/strict'
import {
  escapeXml,
  cdata,
  unixSecondsToRfc822,
  textDateToRfc822,
  resolveUrl,
  safeUrl,
  renderMarkdown,
  buildRss2,
} from '../scripts/lib/rss-utils.mjs'

test('escapeXml escapes all five XML entities', () => {
  assert.equal(escapeXml(`a&b<c>d"e'f`), 'a&amp;b&lt;c&gt;d&quot;e&apos;f')
})

test('escapeXml treats nullish as empty string', () => {
  assert.equal(escapeXml(null), '')
  assert.equal(escapeXml(undefined), '')
})

test('cdata splits the CDATA terminator', () => {
  assert.equal(cdata('a]]>b'), '<![CDATA[a]]]]><![CDATA[>b]]>')
})

test('unixSecondsToRfc822 converts epoch seconds', () => {
  assert.equal(unixSecondsToRfc822(1764000000), 'Mon, 24 Nov 2025 16:00:00 GMT')
})

test('unixSecondsToRfc822 skips invalid values', () => {
  assert.equal(unixSecondsToRfc822(undefined), '')
  assert.equal(unixSecondsToRfc822('not-a-number'), '')
})

test('textDateToRfc822 normalizes SQLite datetime text as UTC', () => {
  assert.equal(textDateToRfc822('2026-11-26 10:00:00'), 'Thu, 26 Nov 2026 10:00:00 GMT')
})

test('textDateToRfc822 skips invalid values', () => {
  assert.equal(textDateToRfc822(''), '')
  assert.equal(textDateToRfc822('garbage'), '')
})

test('resolveUrl keeps absolute URLs and prefixes site-local paths', () => {
  assert.equal(resolveUrl('/guide', 'https://aifindr.org/'), 'https://aifindr.org/guide')
  assert.equal(resolveUrl('https://example.com/a', 'https://aifindr.org'), 'https://example.com/a')
  assert.equal(resolveUrl('#top', 'https://aifindr.org'), '#top')
})

test('safeUrl rejects javascript and data URLs', () => {
  assert.equal(safeUrl('javascript:alert(1)', 'https://aifindr.org'), '')
  assert.equal(safeUrl('data:text/html,x', 'https://aifindr.org'), '')
  assert.equal(safeUrl('/img.png', 'https://aifindr.org'), 'https://aifindr.org/img.png')
})

test('renderMarkdown resolves relative URLs and escapes raw HTML', () => {
  const html = renderMarkdown(
    'See [docs](/guide) and <script>alert(1)</script>\n\n![pic](/img.png)',
    'https://aifindr.org',
  )
  assert.match(html, /href="https:\/\/aifindr.org\/guide"/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(html, /src="https:\/\/aifindr.org\/img.png"/)
  assert.doesNotMatch(html, /<script>/)
})

test('renderMarkdown drops unsafe link targets but keeps link text', () => {
  const html = renderMarkdown('[bad](javascript:alert(1))', 'https://aifindr.org')
  assert.doesNotMatch(html, /href="javascript:/)
  assert.match(html, /bad/)
})

test('buildRss2 emits a valid channel with escaped text and CDATA', () => {
  const xml = buildRss2({
    title: 'T&T',
    link: 'https://aifindr.org/blog',
    description: 'Desc',
    selfUrl: 'https://aifindr.org/rss.xml',
    lastBuildDate: 'Thu, 26 Nov 2026 00:00:00 GMT',
    items: [{
      title: 'A & B',
      link: 'https://aifindr.org/blog/a',
      guid: 'https://aifindr.org/blog/a',
      pubDate: 'Mon, 24 Nov 2025 16:00:00 GMT',
      description: '<p>hi</p>',
      content: '<p>x]]>y</p>',
      categories: ['Blog'],
    }],
  })
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<title>T&amp;T<\/title>/)
  assert.match(xml, /<atom:link href="https:\/\/aifindr.org\/rss\.xml" rel="self" type="application\/rss\+xml" \/>/)
  assert.match(xml, /<guid isPermaLink="true">https:\/\/aifindr.org\/blog\/a<\/guid>/)
  assert.match(xml, /<content:encoded><!\[CDATA\[<p>x\]\]\]\]><!\[CDATA\[>y<\/p>\]\]><\/content:encoded>/)
  assert.match(xml, /<category>Blog<\/category>/)
})
