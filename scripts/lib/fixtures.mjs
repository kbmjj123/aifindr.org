#!/usr/bin/env node
// aifindr.org — 合成测试素材生成器
//
// 红线要求：不上传任何私人文件到未知站点。所有测试输入必须本地合成，
// 且合成内容要「像真的」——否则工具本身的处理路径可能与真实场景不同。
//
// 零第三方依赖：PNG 用 zlib + CRC32 手写，WAV 用 RIFF 头手写。

import zlib from 'node:zlib'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const FIXTURE_DIR = resolve(__dirname, '../../reports/.fixtures')

// ── PNG ────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** 生成一张带纹理的 RGB PNG。纯色图会让「去背景 / 超分 / 降噪」类工具走捷径 */
export function makePng(width = 512, height = 512) {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let o = 0
  for (let y = 0; y < height; y++) {
    raw[o++] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      // 棋盘 + 渐变 + 噪点：保证图像有真实的边缘与高频信息
      const checker = ((x >> 5) + (y >> 5)) & 1 ? 40 : 0
      const r = (x * 255 / width) | 0
      const g = (y * 255 / height) | 0
      const b = ((x ^ y) & 0x3f) + 60
      raw[o++] = Math.min(255, (r + checker) | 0)
      raw[o++] = Math.min(255, (g + checker) | 0)
      raw[o++] = Math.min(255, b | 0)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── WAV ────────────────────────────────────────────────────
/** 生成含人声频段 + 一段静音的 16bit 单声道 WAV，给音频类工具做分离测试 */
export function makeWav(seconds = 6, rate = 22050) {
  const n = seconds * rate
  const data = Buffer.alloc(n * 2)
  for (let i = 0; i < n; i++) {
    const t = i / rate
    // 基频 + 三次谐波，模拟有泛音结构的信号；后 1/3 留静音段便于检测 VAD
    let v = 0
    if (t < seconds * 2 / 3) {
      v = 0.5 * Math.sin(2 * Math.PI * 220 * t) + 0.25 * Math.sin(2 * Math.PI * 660 * t)
      v *= Math.min(1, t * 8) // 淡入，避免咔哒声
    }
    data.writeInt16LE(Math.max(-32768, Math.min(32767, (v * 32767) | 0)), i * 2)
  }
  const head = Buffer.alloc(44)
  head.write('RIFF', 0)
  head.writeUInt32LE(36 + data.length, 4)
  head.write('WAVE', 8)
  head.write('fmt ', 12)
  head.writeUInt32LE(16, 16)
  head.writeUInt16LE(1, 20)          // PCM
  head.writeUInt16LE(1, 22)          // mono
  head.writeUInt32LE(rate, 24)
  head.writeUInt32LE(rate * 2, 28)   // byte rate
  head.writeUInt16LE(2, 32)          // block align
  head.writeUInt16LE(16, 34)         // bits
  head.write('data', 36)
  head.writeUInt32LE(data.length, 40)
  return Buffer.concat([head, data])
}

// ── 提示词 ─────────────────────────────────────────────────
// 故意用「中等复杂度」的描述：太简单触发不了完整生成流程，太复杂容易超时
export const PROMPTS = [
  'a red bicycle leaning against a brick wall at dusk, cinematic lighting',
  'write a short polite email declining a meeting invitation without giving a reason',
]

const CATEGORY_FIXTURE = {
  image: 'png',
  video: 'png',
  audio: 'wav',
  code: 'text',
  productivity: 'text',
  marketing: 'text',
  business: 'text',
  research: 'text',
  education: 'text',
}

export function fixtureKindFor(category) {
  return CATEGORY_FIXTURE[category] || 'png'
}

/** 按需生成并返回本地路径；已存在则复用（保证多次运行输入一致） */
export async function ensureFixture(kind) {
  if (kind === 'text') return { kind: 'text', path: '', text: PROMPTS[0], bytes: 0 }
  await mkdir(FIXTURE_DIR, { recursive: true })
  const name = kind === 'wav' ? 'sample.wav' : 'sample.png'
  const path = resolve(FIXTURE_DIR, name)
  if (!existsSync(path)) {
    const buf = kind === 'wav' ? makeWav() : makePng()
    await writeFile(path, buf)
  }
  const { size } = await import('node:fs').then(m => m.statSync(path))
  return { kind, path, text: '', bytes: size }
}

// ── CLI：node scripts/lib/fixtures.mjs ─────────────────────
if (process.argv[2] === '--build') {
  const png = await ensureFixture('png')
  const wav = await ensureFixture('wav')
  console.log('PNG', png.path, png.bytes, 'bytes')
  console.log('WAV', wav.path, wav.bytes, 'bytes')
}
