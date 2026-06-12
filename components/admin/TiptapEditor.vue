<template>
  <div>
    <!-- Toolbar -->
    <div class="flex items-center gap-1 flex-wrap mb-2 px-3 py-2 rounded-md"
      :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }">
      <button v-for="(btn, i) in toolbar" :key="i"
        class="w-7 h-7 flex items-center justify-center rounded text-[12px] font-body cursor-pointer select-none"
        :style="{ background: isActive(btn) ? 'var(--color-accent-dim)' : 'transparent', color: isActive(btn) ? 'var(--color-accent)' : 'var(--color-text-secondary)', border: 'none' }"
        :title="btn.title"
        @click="execAction(btn.action)"
        v-html="btn.icon"></button>
    </div>

    <!-- Editor content -->
    <div ref="editorRef" class="min-h-[300px] px-4 py-3 rounded-md cursor-text"
      :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }">
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editorRef = ref<HTMLElement>()
const editor = ref<any>(null)
let StarterKit: any = null
let LinkExt: any = null
let ImageExt: any = null
let PlaceholderExt: any = null
let updating = false

type ToolbarAction = (e: any) => any

const isActive = (btn: ToolbarItem) => {
  if (!editor.value) return false
  if (btn.isActiveCheck) return btn.isActiveCheck(editor.value)
  return false  // ← 改这里，不再调用 action
}

function execAction(action: ToolbarAction) {
  if (!editor.value) return
  action(editor.value)
}

interface ToolbarItem {
  icon: string
  title: string
  action: ToolbarAction
  /** Safe active check — action itself may have side effects (prompt, file picker) */
  isActiveCheck?: (e: any) => boolean
}

const toolbar: ToolbarItem[] = [
  {
    icon: '&#x1d41a;', title: 'Bold',
    action: (e) => e.chain().focus().toggleBold().run(),
    isActiveCheck: (e) => e.isActive('bold'),
  },
  {
    icon: '&#x1d43c;', title: 'Italic',
    action: (e) => e.chain().focus().toggleItalic().run(),
    isActiveCheck: (e) => e.isActive('italic'),
  },
  {
    icon: 'H1', title: 'Heading 1',
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    isActiveCheck: (e) => e.isActive('heading', { level: 1 }),
  },
  {
    icon: 'H2', title: 'Heading 2',
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActiveCheck: (e) => e.isActive('heading', { level: 2 }),
  },
  {
    icon: 'H3', title: 'Heading 3',
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActiveCheck: (e) => e.isActive('heading', { level: 3 }),
  },
  {
    icon: '&#x2022;', title: 'Bullet List',
    action: (e) => e.chain().focus().toggleBulletList().run(),
    isActiveCheck: (e) => e.isActive('bulletList'),
  },
  {
    icon: '1.', title: 'Ordered List',
    action: (e) => e.chain().focus().toggleOrderedList().run(),
    isActiveCheck: (e) => e.isActive('orderedList'),
  },
  {
    icon: '&#x21e7;', title: 'Blockquote',
    action: (e) => e.chain().focus().toggleBlockquote().run(),
    isActiveCheck: (e) => e.isActive('blockquote'),
  },
  {
    icon: '_', title: 'Horizontal Rule',
    action: (e) => e.chain().focus().setHorizontalRule().run(),
    // 无状态，不需要高亮
  },
  {
    icon: '&#x2197;', title: 'Link',
    action: toggleLink,
    isActiveCheck: (e) => e.isActive('link'),
  },
  {
    icon: '&#x1f5bc;', title: 'Image',
    action: insertImage,
    // image 通常不需要高亮状态
  },
]

function toggleLink(e: any) {
  const prev = e.getAttributes('link').href
  const url = prompt('Link URL', prev || 'https://')
  if (url === null) return
  if (url === '') {
    e.chain().focus().unsetLink().run()
  } else {
    e.chain().focus().setLink({ href: url }).run()
  }
}

async function insertImage() {
  // Create a hidden file input
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const { uploadFile } = useImageUpload()
    const url = await uploadFile(file, 'blog')
    if (url && editor.value) {
      editor.value.chain().focus().setImage({ src: url }).run()
    }
  }
  input.click()
}

onMounted(async () => {
  const { Editor } = await import('@tiptap/vue-3')
  const StarterKitMod = await import('@tiptap/starter-kit')
  const LinkMod = await import('@tiptap/extension-link')
  const ImageMod = await import('@tiptap/extension-image')
  const PlaceholderMod = await import('@tiptap/extension-placeholder')

  StarterKit = StarterKitMod.default
  LinkExt = LinkMod.default
  ImageExt = ImageMod.default
  PlaceholderExt = PlaceholderMod.default

  editor.value = new Editor({
    element: editorRef.value!,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
      PlaceholderExt.configure({ placeholder: 'Start writing...' }),
    ],
    content: props.modelValue || '',
    onUpdate: ({ editor: ed }: any) => {
      emit('update:modelValue', ed.getHTML())
    },
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// Sync external modelValue changes
watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  // 用 transaction 比较更安全
  const currentHTML = editor.value.getHTML()
  if (val !== currentHTML) {
    editor.value.commands.setContent(val || '', false) // false = 不触发 onUpdate
  }
})
</script>

<style>
/* Tiptap placeholder styling */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-muted);
  pointer-events: none;
  height: 0;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}
</style>
