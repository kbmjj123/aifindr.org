import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function loadRewriteSchema() {
  return JSON.parse(readFileSync(resolve(ROOT, 'docs/rewritten/_schema.json'), 'utf8'))
}

export function validateRewriteRow(row, schema) {
  const errors = []
  if (!row || typeof row.slug !== 'string' || !/^[a-z0-9-]+$/.test(row.slug)) {
    errors.push('invalid slug')
    return errors
  }
  for (const field of schema.fields) {
    if (!(field in row)) continue
    const value = row[field]
    if (value == null) continue
    if (field in schema.arrayLimits) {
      if (!Array.isArray(value)) { errors.push(`${field}: expected array`); continue }
      const max = schema.arrayLimits[field]
      if (value.length > max) errors.push(`${field}: ${value.length} items > ${max}`)
      const itemMax = schema.arrayItemLimits[field]
      const isFaq = field === 'rw_faq'
      for (const item of value) {
        if (isFaq) {
          if (!item || typeof item.question !== 'string' || typeof item.answer !== 'string') {
            errors.push(`${field}: item must be { question, answer }`); break
          }
          if (item.question.length + item.answer.length > itemMax) {
            errors.push(`${field}: item exceeds ${itemMax} chars`); break
          }
        } else if (typeof item !== 'string' || item.length > itemMax) {
          errors.push(`${field}: item exceeds ${itemMax} chars or not string`)
          break
        }
      }
    } else {
      if (typeof value !== 'string') { errors.push(`${field}: expected string`); continue }
      const max = schema.textLimits[field]
      if (max && value.length > max) errors.push(`${field}: ${value.length} chars > ${max}`)
    }
    const text = Array.isArray(value)
      ? value.map(v => (v && typeof v === 'object') ? `${v.question || ''} ${v.answer || ''}` : String(v)).join(' ')
      : String(value)
    for (const phrase of schema.forbiddenPhrases) {
      if (text.includes(phrase)) { errors.push(`${field}: contains forbidden phrase "${phrase}"`); break }
    }
  }
  return errors
}

/** 把数组字段归一化为 JSON 字符串，供 seed 写入 */
export function normalizeRewriteRow(row, schema) {
  const out = { ...row }
  for (const field of schema.fields) {
    if (field in out && Array.isArray(out[field])) out[field] = JSON.stringify(out[field])
  }
  return out
}
