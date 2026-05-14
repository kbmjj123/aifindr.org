<template>
  <div class="settings-page">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="font-sans font-extrabold text-[22px] tracking-[-0.5px]"
        :style="{ color: 'var(--color-text-primary)' }">
        Settings
      </h1>
      <p class="font-body text-[12px] mt-1"
        :style="{ color: 'var(--color-text-muted)' }">
        Manage your notification preferences
      </p>
    </div>

    <!-- Needs Contact Email Banner -->
    <div v-if="user?.needs_contact_email" class="mb-6 px-5 py-4 rounded-lg"
      :style="{ background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)' }">
      <p class="font-body text-[13px]"
        :style="{ color: 'var(--color-text-primary)' }">
        Your GitHub email is private. Add a contact email to receive submission status updates and review results.
      </p>
    </div>

    <!-- Email Section -->
    <section class="max-w-lg">
      <h2 class="font-sans font-bold text-[15px] tracking-[-0.3px] mb-5"
        :style="{ color: 'var(--color-text-primary)' }">
        Email Notifications
      </h2>

      <!-- GitHub Email (read-only) -->
      <div class="mb-5">
        <label class="block font-body text-[10px] uppercase tracking-[0.1em] mb-1.5"
          :style="{ color: 'var(--color-text-muted)' }">
          GitHub Email
        </label>
        <div class="flex items-center gap-2">
          <span class="font-body text-[13px]"
            :style="{ color: user?.email ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }">
            {{ user?.email || 'Not available' }}
          </span>
          <span v-if="user?.email && !user.email.includes('noreply.github.com')"
            class="inline-flex items-center gap-0.5 font-body text-[10px]"
            :style="{ color: 'var(--color-success)' }">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Public
          </span>
          <span v-else-if="user?.email"
            class="inline-flex items-center gap-0.5 font-body text-[10px]"
            :style="{ color: 'var(--color-warning)' }">
            Private (noreply)
          </span>
        </div>
      </div>

      <!-- Contact Email (editable) -->
      <div class="mb-5">
        <label class="block font-body text-[10px] uppercase tracking-[0.1em] mb-1.5"
          :style="{ color: 'var(--color-text-muted)' }">
          Contact Email
        </label>
        <div class="flex gap-2">
          <BaseInput v-model="contactEmail" placeholder="you@example.com"
            class="flex-1"
            :disabled="saving"
            @keyup.enter="saveEmail" />
          <BaseButton variant="primary" :disabled="saving || !contactEmail.trim()" @click="saveEmail">
            {{ saving ? 'Saving...' : 'Save' }}
          </BaseButton>
        </div>
        <p v-if="user?.contact_email" class="font-body text-[11px] mt-1.5"
          :style="{ color: user?.email_verified ? 'var(--color-success)' : 'var(--color-text-muted)' }">
          {{ user?.email_verified ? 'Verified' : 'Unverified — check your inbox' }}
        </p>
        <p v-if="saveSuccess" class="font-body text-[11px] mt-1.5"
          :style="{ color: 'var(--color-success)' }">
          Email saved!
        </p>
        <p v-if="saveError" class="font-body text-[11px] mt-1.5"
          :style="{ color: 'var(--color-danger)' }">
          {{ saveError }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
usePageSeo({
  title: 'Settings',
  template: 'prefix',
  description: 'Manage your aifindr.org account settings and email preferences.',
})

const { user, isLoggedIn, fetchUser } = useAuth()

// Redirect if not logged in
if (import.meta.client && !isLoggedIn.value) {
  await navigateTo('/')
}

const contactEmail = ref('')
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

// Prepopulate with existing contact email
watchEffect(() => {
  if (user.value?.contact_email && !contactEmail.value) {
    contactEmail.value = user.value.contact_email
  }
})

async function saveEmail() {
  if (!contactEmail.value.trim()) return
  saving.value = true
  saveSuccess.value = false
  saveError.value = ''

  try {
    await $fetch('/api/user/email', {
      method: 'POST',
      body: { contact_email: contactEmail.value.trim() },
    })
    saveSuccess.value = true
    await fetchUser()
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    saveError.value = e?.data?.error || 'Failed to save email'
  } finally {
    saving.value = false
  }
}
</script>
