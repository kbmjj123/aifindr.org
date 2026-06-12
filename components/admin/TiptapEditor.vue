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
let EditorClass: any = null
let StarterKit: any = null
let LinkExt: any = null
let ImageExt: any = null
let PlaceholderExt: any = null

type ToolbarAction = (e: any) => any

const isActive = (btn: ToolbarItem) => {
  if (!editor.value) return false
  if (btn.isActiveCheck) return btn.isActiveCheck(editor.value)
  return btn.action(editor.value)
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
  { icon: '&#x1d41a;', title: 'Bold', action: (e: any) => e.chain().focus().toggleBold().run() },
  { icon: '&#x1d43c;', title: 'Italic', action: (e: any) => e.chain().focus().toggleItalic().run() },
  { icon: 'H1', title: 'Heading 1', action: (e: any) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { icon: 'H2', title: 'Heading 2', action: (e: any) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { icon: 'H3', title: 'Heading 3', action: (e: any) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { icon: '&#x2022;', title: 'Bullet List', action: (e: any) => e.chain().focus().toggleBulletList().run() },
  { icon: '1.', title: 'Ordered List', action: (e: any) => e.chain().focus().toggleOrderedList().run() },
  { icon: '&#x21e7;', title: 'Blockquote', action: (e: any) => e.chain().focus().toggleBlockquote().run() },
  { icon: '_', title: 'Horizontal Rule', action: (e: any) => e.chain().focus().setHorizontalRule().run() },
  { icon: '&#x2197;', title: 'Link', action: toggleLink, isActiveCheck: (e: any) => e.isActive('link') },
  { icon: '&#x1f5bc;', title: 'Image', action: insertImage },
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
  if (editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val || '')
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
