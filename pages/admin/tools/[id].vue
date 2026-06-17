<template>
  <div class="admin-page">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-sans font-extrabold text-[22px] tracking-[-0.5px]"
          :style="{ color: 'var(--color-text-primary)' }">
          Edit Tool
        </h1>
        <p class="font-body text-[12px] mt-1"
          :style="{ color: 'var(--color-text-muted)' }">
          Modify tool details and metadata
        </p>
      </div>
    </div>

    <!-- Nav Tabs -->
    <div class="flex gap-1 mb-6 p-1 rounded-lg w-fit"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <NuxtLink to="/admin"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Review Submissions
      </NuxtLink>
      <NuxtLink to="/admin/intake"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Tool Intake
      </NuxtLink>
      <NuxtLink to="/admin/users"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Users
      </NuxtLink>
    </div>

    <AdminToolEdit
      :tool-id="toolId"
      @close="navigateTo('/admin')"
      @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const toolId = computed(() => Number(route.params.id))

usePageSeo({
  title: 'Edit Tool — Admin',
  template: 'prefix',
  description: 'Admin tool editing page.',
  noOg: true,
})

function onSaved(_id: number) {
  // Navigate back to admin panel after save
  navigateTo('/admin')
}
</script>
