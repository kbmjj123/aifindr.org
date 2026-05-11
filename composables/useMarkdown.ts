/**
 * 轻量 Markdown → HTML 渲染（不依赖第三方库）
 * 覆盖详情页常见语法：标题、粗体、列表、表格、代码、链接
 */
export function useMarkdown() {
  function render(md: string): string {
    if (!md) return ''

    let html = md
      // 转义 HTML 特殊字符
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // 代码块（先处理，避免内部语法被转译）
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const cls = lang ? ` class="language-${lang}"` : ''
        return `<pre><code${cls}>${code.trim()}</code></pre>`
      })
      // 内联代码
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // 粗体 + 斜体
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // 删除线
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')

    // 按行处理表格、标题、列表
    const lines = html.split('\n')
    const result: string[] = []
    let inTable = false
    let inList = false
    let tableRows: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 表格分隔行（|---|---|）
      if (/^\|[\s:-]+\|/.test(line) && !line.includes('| ---')) {
        // 分隔符行，一般是表头下面的那行，不做输出（表头已作为 th 处理）
        continue
      }

      // 表格行
      if (/^\|.+\|$/.test(line.trim())) {
        if (!inTable) {
          inTable = true
          tableRows = []
        }
        const cells = line.trim().split('|').filter(c => c.trim()).map(c => c.trim())
        // 第一行是表头
        tableRows.push(cells.map(c => `<td>${c}</td>`).join(''))
        continue
      } else if (inTable) {
        // 表格结束
        if (tableRows.length > 0) {
          result.push('<table>')
          // 第一行作为表头
          result.push(`<thead><tr>${tableRows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>')}</tr></thead>`)
          if (tableRows.length > 1) {
            result.push(`<tbody>${tableRows.slice(1).map(r => `<tr>${r}</tr>`).join('')}</tbody>`)
          }
          result.push('</table>')
        }
        inTable = false
        tableRows = []
      }

      if (inTable) continue

      // 标题
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        result.push(`<h${level}>${headingMatch[2]}</h${level}>`)
        inList = false
        continue
      }

      // 无序列表
      if (/^[-*]\s+(.+)$/.test(line.trim())) {
        if (!inList) {
          result.push('<ul>')
          inList = true
        }
        result.push(`<li>${line.trim().replace(/^[-*]\s+/, '')}</li>`)
        continue
      } else if (inList) {
        result.push('</ul>')
        inList = false
      }

      // 空行
      if (!line.trim()) {
        if (inList) { result.push('</ul>'); inList = false }
        continue
      }

      // 普通段落
      result.push(`<p>${line.trim()}</p>`)
    }

    // 关闭未闭合的列表
    if (inList) result.push('</ul>')
    if (inTable && tableRows.length > 0) {
      result.push('<table>')
      result.push(`<thead><tr>${tableRows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>')}</tr></thead>`)
      if (tableRows.length > 1) {
        result.push(`<tbody>${tableRows.slice(1).map(r => `<tr>${r}</tr>`).join('')}</tbody>`)
      }
      result.push('</table>')
    }

    return result.join('\n')
  }

  return { render }
}
