<template>
  <!-- 根容器：黑底，1200×630，全 flex -->
  <div style="display: flex; flex-direction: row; width: 1200px; height: 630px; background: #080808; font-family: Inter, sans-serif; overflow: hidden;">

    <!-- ═══ 左侧内容区 ═══ -->
    <div style="display: flex; flex-direction: column; justify-content: space-between; flex: 1; padding: 72px 64px;">

      <!-- 顶部：Logo -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #c8ff00; border-radius: 8px; flex-shrink: 0;">
          <div style="display: flex; width: 10px; height: 10px; background: #080808; border-radius: 2px;" />
        </div>
        <span style="display: flex; font-size: 22px; font-weight: 700; color: #f0f0f0; letter-spacing: -0.5px;">aifindr</span>
        <span style="display: flex; font-size: 22px; font-weight: 400; color: #444;">.org</span>
      </div>

      <!-- 中部：主内容 -->
      <div style="display: flex; flex-direction: column; gap: 20px;">

        <!-- Type badge -->
        <div style="display: flex; align-items: center; gap: 8px; width: fit-content; padding: 6px 14px; background: #111; border: 1px solid #2a2a2a; border-radius: 100px;">
          <div style="display: flex; width: 6px; height: 6px; background: #c8ff00; border-radius: 50%; flex-shrink: 0;" />
          <span style="display: flex; font-size: 11px; font-weight: 600; color: #c8ff00; letter-spacing: 0.12em; text-transform: uppercase;">{{ truncatedType }}</span>
        </div>

        <!-- Title -->
        <div style="display: flex; font-size: 52px; font-weight: 800; color: #f2f2f2; line-height: 1.08; letter-spacing: -2px;">
          {{ truncatedTitle }}
        </div>

        <!-- Description -->
        <div style="display: flex; font-size: 18px; font-weight: 400; color: #666; line-height: 1.5; letter-spacing: -0.2px;">
          {{ truncatedDescription }}
        </div>

      </div>

      <!-- 底部：域名 + 装饰线 -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; gap: 6px;">
          <div style="display: flex; width: 40px; height: 3px; background: #c8ff00; border-radius: 2px;" />
          <div style="display: flex; width: 20px; height: 3px; background: #c8ff00; border-radius: 2px; opacity: 0.4;" />
          <div style="display: flex; width: 10px; height: 3px; background: #c8ff00; border-radius: 2px; opacity: 0.15;" />
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: flex; font-size: 13px; font-weight: 500; color: #444; letter-spacing: 0.04em;">aifindr.org</span>
          <span style="display: flex; font-size: 13px; color: #2a2a2a;">·</span>
          <span style="display: flex; font-size: 13px; color: #333; letter-spacing: 0.04em;">Open Source AI Directory</span>
        </div>
      </div>

    </div>

    <!-- ═══ 右侧装饰区 ═══ -->
    <div style="display: flex; flex-direction: column; width: 340px; flex-shrink: 0; overflow: hidden;">

      <!-- 竖向分隔线 + 内容 -->
      <div style="display: flex; flex-direction: row; flex: 1;">

        <!-- 分隔线 -->
        <div style="display: flex; width: 1px; background: #1e1e1e; margin: 80px 0;" />

        <!-- 装饰卡片区 -->
        <div style="display: flex; flex-direction: column; justify-content: center; gap: 10px; flex: 1; padding: 48px 36px 48px 40px;">

          <!-- 卡片 1 -->
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #111; border: 1px solid #222; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #c8ff00; border-radius: 7px; flex-shrink: 0;">
              <span style="display: flex; font-size: 13px; font-weight: 800; color: #080808;">AI</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="display: flex; font-size: 13px; font-weight: 600; color: #d0d0d0;">Writing</span>
              <span style="display: flex; font-size: 11px; color: #3a3a3a;">48 tools</span>
            </div>
          </div>

          <!-- 卡片 2 -->
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #0e0e0e; border: 1px solid #1a1a1a; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #161616; border: 1px solid #252525; border-radius: 7px; flex-shrink: 0;">
              <span style="display: flex; font-size: 13px;">⚡</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="display: flex; font-size: 13px; font-weight: 600; color: #d0d0d0;">Code & Dev</span>
              <span style="display: flex; font-size: 11px; color: #3a3a3a;">63 tools</span>
            </div>
          </div>

          <!-- 卡片 3 -->
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #0e0e0e; border: 1px solid #1a1a1a; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #161616; border: 1px solid #252525; border-radius: 7px; flex-shrink: 0;">
              <span style="display: flex; font-size: 13px;">🎨</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="display: flex; font-size: 13px; font-weight: 600; color: #d0d0d0;">Image & Art</span>
              <span style="display: flex; font-size: 11px; color: #3a3a3a;">37 tools</span>
            </div>
          </div>

          <!-- 卡片 4 -->
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #0e0e0e; border: 1px solid #1a1a1a; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #161616; border: 1px solid #252525; border-radius: 7px; flex-shrink: 0;">
              <span style="display: flex; font-size: 13px;">🔍</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="display: flex; font-size: 13px; font-weight: 600; color: #d0d0d0;">Research</span>
              <span style="display: flex; font-size: 11px; color: #3a3a3a;">29 tools</span>
            </div>
          </div>

          <!-- 统计数字 -->
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; padding: 12px 8px; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px;">
              <span style="display: flex; font-size: 20px; font-weight: 800; color: #c8ff00; letter-spacing: -1px;">500+</span>
              <span style="display: flex; font-size: 10px; color: #3a3a3a; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 3px;">Tools</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; padding: 12px 8px; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px;">
              <span style="display: flex; font-size: 20px; font-weight: 800; color: #f0f0f0; letter-spacing: -1px;">12</span>
              <span style="display: flex; font-size: 10px; color: #3a3a3a; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 3px;">Categories</span>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string
  description?: string
  type?: string
}>()

// Satori 不支持 CSS 文字截断，在 JS 层面处理
const truncatedTitle = computed(() => {
  const t = props.title || 'Discover AI Tools Built for Makers'
  return t.length > 48 ? t.slice(0, 48).trimEnd() + '…' : t
})

const truncatedDescription = computed(() => {
  const d = props.description || 'Open-source AI tool directory. Submit your tool, get 3 free dofollow backlinks.'
  return d.length > 80 ? d.slice(0, 80).trimEnd() + '…' : d
})

const truncatedType = computed(() => {
  return props.type || 'AI Tools Directory'
})
</script>