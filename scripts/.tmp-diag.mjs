import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
const b = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })

// ── A: vocalseparator 的勾选框到底在不在 ──
let p = await (await b.newContext({ viewport:{width:1440,height:900}, userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' })).newPage()
await p.goto('https://vocalseparator.com', { waitUntil:'domcontentloaded', timeout:25000 })
await p.waitForTimeout(2500)
console.log('上传前 checkbox 数:', await p.locator('input[type=checkbox]').count())
await p.setInputFiles('input[type=file]', 'reports/.fixtures/sample.wav')
await p.waitForTimeout(2000)
console.log('上传后 checkbox 数:', await p.locator('input[type=checkbox]').count())
console.log('复选框明细:', await p.evaluate(()=>[...document.querySelectorAll('input[type=checkbox]')].map(e=>{
  const wrap=e.closest('label')
  return `checked=${e.checked} disabled=${e.disabled} id="${e.id}" text="${(wrap?.innerText||e.parentElement?.innerText||'').replace(/\s+/g,' ').slice(0,50)}"`
})))
const ticked = await p.evaluate(() => {
  const MARKETING = /newsletter|subscribe|marketing|promotion|email me|offers|keep me/i
  const ticked = []
  const label = el => {
    if (el.id) { try { const l=document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if(l&&l.innerText.trim()) return l.innerText } catch{} }
    const wrap = el.closest('label'); if (wrap && wrap.innerText.trim()) return wrap.innerText
    return el.getAttribute('aria-label') || el.parentElement?.innerText || ''
  }
  for (const el of document.querySelectorAll('input[type=checkbox]')) {
    if (el.disabled) continue
    const t = (label(el)||'').replace(/\s+/g,' ').trim()
    if (MARKETING.test(t)) continue
    if (!el.checked) { el.click(); ticked.push(t.slice(0,60)) }
  }
  return ticked
})
console.log('ticked:', JSON.stringify(ticked))
await p.waitForTimeout(1000)
console.log('remove vocals disabled?', await p.locator('button', { hasText:'Remove vocals' }).isDisabled().catch(e=>'err'))
await p.close()

// ── B: imagedescriber 按钮打分明细 ──
p = await (await b.newContext({ viewport:{width:1440,height:900}, userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' })).newPage()
await p.goto('https://imagedescriber.dev', { waitUntil:'domcontentloaded', timeout:25000 })
await p.waitForTimeout(2500)
await p.setInputFiles('input[type=file]', 'reports/.fixtures/sample.png')
await p.waitForTimeout(2000)
console.log('\n== imagedescriber 按钮 ==')
console.log(await p.evaluate(()=>[...document.querySelectorAll('button, input[type=submit], [role=button], a.btn, a[class*=btn]')].map((el,i)=>{
  const r=el.getBoundingClientRect()
  const vis=r.width>4&&r.height>4
  const t=((el.getAttribute('aria-label')||'')+' '+(el.innerText||el.value||'')).replace(/\s+/g,' ').trim().slice(0,70)
  const inChrome=!!el.closest('nav, header, footer, [role=navigation], [class*=navbar], [class*=header], [class*=footer]')
  return `${i} vis=${vis} ${el.disabled?'DISABLED ':''}inChrome=${inChrome} box=${Math.round(r.x)},${Math.round(r.y+r.height/2)} "${t}"`
}).filter((s,i)=>true).join('\n')))
await p.close()
await b.close()
