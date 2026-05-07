/**
 * Sync Markdown Content to D1
 * Reads all content/tools/**\/*.md files and upserts them into D1
 * Intended to run as a GitHub Action after content changes
 */

import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { parse as parseYaml } from 'yaml'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const CONTENT_DIR = join(__dirname, '..', 'content', 'tools')

function findMarkdownFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath))
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

function parseMarkdown(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

  if (!match) {
    console.warn(`Skipping ${filePath}: no frontmatter found`)
    return null
  }

  const frontmatter = parseYaml(match[1])
  const body = match[2].trim()

  // Derive category from directory path
  const relPath = relative(CONTENT_DIR, filePath)
  const category = relPath.split('/')[0]

  return {
    ...frontmatter,
    category,
    body,
    filePath: relPath,
  }
}

async function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.log('No content directory found. Skipping sync.')
    return
  }

  const files = findMarkdownFiles(CONTENT_DIR)
  console.log(`Found ${files.length} tool files`)

  const tools = files.map(parseMarkdown).filter(Boolean)

  // In production, this would connect to D1 via wrangler
  // and run INSERT OR REPLACE statements
  console.log(`\nReady to sync ${tools.length} tools to D1:`)
  for (const tool of tools) {
    console.log(`  ${tool.slug} (${tool.category})`)
  }

  console.log('\nDone. (D1 sync not implemented — run with wrangler in CI)')
}

main().catch(console.error)
