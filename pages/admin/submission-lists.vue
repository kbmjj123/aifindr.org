<template>
  <div class="admin-page">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
      <div>
        <h1 class="font-sans font-extrabold text-[22px] tracking-[-0.5px]" style="color: var(--color-text-primary)">
          Submission Lists
        </h1>
        <p class="font-body text-[12px] mt-1" style="color: var(--color-text-muted)">
          Add platforms, complete missing facts, create lists, curate members and review public reports.
          Saving a site automatically recalculates every rule-based list.
        </p>
      </div>
      <button class="btn-primary" :disabled="refreshing" @click="refreshAll">
        {{ refreshing ? 'Refreshing...' : 'Refresh all lists' }}
      </button>
    </div>

    <div class="flex gap-1 mb-6 p-1 rounded-lg w-fit flex-wrap" :style="panelStyle">
      <NuxtLink v-for="tab in tabs" :key="tab.to" :to="tab.to"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md no-underline"
        :style="tab.to === '/admin/submission-lists' ? activeTabStyle : idleTabStyle">
        {{ tab.label }}
      </NuxtLink>
    </div>

    <p v-if="message" class="font-body text-[11px] mb-4" style="color: var(--color-success)">{{ message }}</p>
    <p v-if="error" class="font-body text-[11px] mb-4" style="color: var(--color-danger)">{{ error }}</p>

    <div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="rounded-lg p-3" :style="cardStyle">
        <div class="font-sans font-extrabold text-[18px]" style="color: var(--color-accent)">{{ stat.value }}</div>
        <div class="font-body text-[9px] uppercase tracking-[0.08em]" style="color: var(--color-text-muted)">{{ stat.label }}</div>
      </div>
    </div>

    <!-- ── Lists ─────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <h2 class="font-sans font-bold text-[15px]" style="color: var(--color-text-primary)">Lists ({{ lists.length }})</h2>
      <button class="btn-secondary !h-8" @click="showCreateList = !showCreateList">
        {{ showCreateList ? 'Close' : '+ New list' }}
      </button>
    </div>

    <form v-if="showCreateList" class="rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4"
      :style="cardStyle" @submit.prevent="createList">
      <label class="font-body text-[10px]">Slug *<input v-model="newList.slug" class="input mt-1" required placeholder="free-ai-directories" /></label>
      <label class="font-body text-[10px]">Title *<input v-model="newList.title" class="input mt-1" required /></label>
      <label class="font-body text-[10px]">Dimension
        <select v-model="newList.dimension" class="select mt-1">
          <option value="topic">Topic</option><option value="pricing">Pricing</option>
          <option value="link">Link type</option><option value="authority">Authority</option>
          <option value="speed">Speed</option>
        </select>
      </label>
      <label class="font-body text-[10px]">Kind
        <select v-model="newList.kind" class="select mt-1">
          <option value="rule">Rule</option><option value="curated">Curated</option><option value="hybrid">Hybrid</option>
        </select>
      </label>
      <label class="font-body text-[10px]">Limit mode
        <select v-model="newList.limit_mode" class="select mt-1">
          <option value="all">All matches</option><option value="topN">Top N</option>
        </select>
      </label>
      <label class="font-body text-[10px]">Limit / min items
        <span class="flex gap-2 mt-1">
          <input v-model.number="newList.limit_count" type="number" min="0" class="input" />
          <input v-model.number="newList.min_items" type="number" min="1" class="input" />
        </span>
      </label>
      <label class="font-body text-[10px] sm:col-span-2 lg:col-span-3">Description
        <input v-model="newList.description" class="input mt-1" />
      </label>
      <label class="font-body text-[10px] sm:col-span-2 lg:col-span-3">Filter DSL (JSON, e.g. {"and":[{"field":"pricing","op":"eq","value":"free"}]})
        <textarea v-model="newList.filters" class="textarea mt-1 !h-[70px] font-mono" />
      </label>
      <label class="font-body text-[10px] sm:col-span-2 lg:col-span-3">Sort (JSON, e.g. [{"field":"domain_rating","dir":"desc"}])
        <textarea v-model="newList.sort" class="textarea mt-1 !h-[60px] font-mono" />
      </label>
      <div class="sm:col-span-2 lg:col-span-3">
        <button class="btn-primary" type="submit" :disabled="creatingList">Create &amp; build list</button>
      </div>
    </form>

    <div class="rounded-lg overflow-x-auto mb-3" :style="cardStyle">
      <table class="w-full font-body text-[11px] min-w-[660px]">
        <thead :style="{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }">
          <tr>
            <th class="text-left p-2">List</th><th class="text-left p-2">Dimension</th>
            <th class="text-right p-2">Members</th><th class="text-left p-2">Status</th>
            <th class="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="list in lists" :key="list.slug" :style="{ borderTop: '1px solid var(--color-border)' }">
            <td class="p-2">
              <NuxtLink :to="`/submission-lists/${list.slug}`" style="color: var(--color-text-link)">{{ list.title }}</NuxtLink>
              <div class="mt-0.5" style="color: var(--color-text-muted)">{{ list.slug }} · {{ list.kind }}</div>
            </td>
            <td class="p-2" style="color: var(--color-text-secondary)">{{ list.dimension }}</td>
            <td class="p-2 text-right" style="color: var(--color-text-primary)">{{ list.item_count }}</td>
            <td class="p-2" style="color: var(--color-text-secondary)">{{ list.status }}</td>
            <td class="p-2 text-right space-x-1">
              <button class="btn-ghost" @click="refreshOne(list.slug)">Refresh</button>
              <button class="btn-ghost" @click="toggleStatus(list)">
                {{ list.status === 'published' ? 'Unpublish' : 'Publish' }}
              </button>
              <button class="btn-ghost" @click="openCurate(list)">Curate</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <form v-if="curate.slug" class="rounded-lg p-4 mb-8" :style="cardStyle" @submit.prevent="saveCurate">
      <h3 class="font-sans font-bold text-[13px] mb-3" style="color: var(--color-text-primary)">
        Curate · {{ curate.slug }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="font-body text-[10px]">Title<input v-model="curate.title" class="input mt-1" /></label>
        <label class="font-body text-[10px]">Kind
          <select v-model="curate.kind" class="select mt-1">
            <option value="rule">Rule</option><option value="curated">Curated</option><option value="hybrid">Hybrid</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Limit (0 = all)<input v-model.number="curate.limit_count" type="number" min="0" class="input mt-1" /></label>
        <label class="font-body text-[10px]">Min items<input v-model.number="curate.min_items" type="number" min="1" class="input mt-1" /></label>
        <label class="font-body text-[10px] sm:col-span-2">Intro<textarea v-model="curate.intro" class="textarea mt-1 !h-[70px]" /></label>
        <label class="font-body text-[10px] sm:col-span-2">Methodology<textarea v-model="curate.methodology" class="textarea mt-1 !h-[70px]" /></label>
        <label class="font-body text-[10px]">Dimension
          <select v-model="curate.dimension" class="select mt-1">
            <option value="topic">Topic</option><option value="pricing">Pricing</option>
            <option value="link">Link type</option><option value="authority">Authority</option>
            <option value="speed">Speed</option>
          </select>
        </label>
        <label class="font-body text-[10px]">SEO title<input v-model="curate.seo_title" class="input mt-1" /></label>
        <label class="font-body text-[10px] sm:col-span-2">SEO description<input v-model="curate.seo_description" class="input mt-1" /></label>
        <label class="font-body text-[10px] sm:col-span-2">Filter DSL (JSON)
          <textarea v-model="curate.filters" class="textarea mt-1 !h-[70px] font-mono" />
        </label>
        <label class="font-body text-[10px] sm:col-span-2">Sort rules (JSON)
          <textarea v-model="curate.sort" class="textarea mt-1 !h-[60px] font-mono" />
        </label>
        <label class="font-body text-[10px] sm:col-span-2">FAQ (JSON array of {"question","answer"})
          <textarea v-model="curate.faq" class="textarea mt-1 !h-[70px] font-mono" />
        </label>
        <label class="font-body text-[10px] sm:col-span-2">Pinned order (comma-separated slugs)
          <input v-model="curate.pinned_order" class="input mt-1" placeholder="product-hunt, show-hn" />
        </label>
        <label class="font-body text-[10px] sm:col-span-2">Force include (comma-separated slugs)
          <input v-model="curate.include_slugs" class="input mt-1" />
        </label>
        <label class="font-body text-[10px] sm:col-span-2">Force exclude (comma-separated slugs)
          <input v-model="curate.exclude_slugs" class="input mt-1" />
        </label>
      </div>
      <div class="flex gap-2 mt-3">
        <button class="btn-primary" type="submit">Save curation</button>
        <button class="btn-ghost" type="button" @click="curate.slug = ''">Close</button>
        <span class="font-body text-[10px] self-center" style="color: var(--color-text-muted)">
          Pinned members survive snapshot refreshes.
        </span>
      </div>
    </form>

    <!-- ── Sites ─────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-3 mt-10 flex-wrap gap-2">
      <h2 class="font-sans font-bold text-[15px]" style="color: var(--color-text-primary)">Platforms ({{ siteTotal }})</h2>
      <div class="flex gap-2">
        <button class="btn-secondary !h-8" @click="showAddSite = !showAddSite">
          {{ showAddSite ? 'Close' : '+ Add one' }}
        </button>
        <button class="btn-secondary !h-8" @click="showImport = !showImport">
          {{ showImport ? 'Close' : 'Bulk import' }}
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 mb-3">
      <input v-model="siteQuery" class="input !w-auto sm:min-w-[220px]" placeholder="Search name / slug / domain"
        @keyup.enter="loadSites(1)" />
      <select v-model="siteStatus" class="select !w-auto" @change="loadSites(1)">
        <option value="">All statuses</option><option value="active">Active</option>
        <option value="needs_info">Needs info</option><option value="hidden">Hidden</option>
      </select>
      <button class="btn-secondary !h-10" @click="loadSites(1)">Search</button>
    </div>

    <form v-if="showAddSite" class="rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4"
      :style="cardStyle" @submit.prevent="addSite">
      <label class="font-body text-[10px]">Name *<input v-model="form.name" class="input mt-1" required /></label>
      <label class="font-body text-[10px]">Website *<input v-model="form.site_url" class="input mt-1" required placeholder="https://" /></label>
      <label class="font-body text-[10px]">Slug (optional)<input v-model="form.slug" class="input mt-1" /></label>
      <label class="font-body text-[10px]">Submission URL<input v-model="form.submit_url" class="input mt-1" /></label>
      <label class="font-body text-[10px]">Pricing
        <select v-model="form.pricing" class="select mt-1">
          <option value="unknown">Unknown</option><option value="free">Free</option>
          <option value="freemium">Freemium</option><option value="paid">Paid</option>
        </select>
      </label>
      <label class="font-body text-[10px]">Domain rating<input v-model="form.domain_rating" type="number" min="0" max="100" class="input mt-1" /></label>
      <label class="font-body text-[10px]">Approval bucket
        <select v-model="form.approval_bucket" class="select mt-1">
          <option value="unknown">Unknown</option><option value="fast">Fast</option><option value="week">Week</option>
          <option value="month">Month</option><option value="slow">Slow</option>
        </select>
      </label>
      <label class="font-body text-[10px]">Dofollow
        <select v-model="form.dofollow_link" class="select mt-1">
          <option :value="null">Not stated</option><option :value="1">Yes</option><option :value="0">No</option>
        </select>
      </label>
      <label class="font-body text-[10px]">Backlink required
        <select v-model="form.backlink_required" class="select mt-1">
          <option :value="null">Not stated</option><option :value="1">Yes</option><option :value="0">No</option>
        </select>
      </label>
      <label class="font-body text-[10px]">Category slugs (comma-separated)
        <input v-model="form.category" class="input mt-1" placeholder="ai-tool-directories, saas-directories" />
      </label>
      <div class="sm:col-span-2 lg:col-span-3">
        <button class="btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Add platform' }}</button>
      </div>
    </form>

    <form v-if="showImport" class="rounded-lg p-4 mb-4" :style="cardStyle" @submit.prevent="importSites">
      <label class="font-body text-[10px]">Paste a JSON array of sites (same fields as the add-one form)
        <textarea v-model="importJson" class="textarea mt-1 !h-[150px] font-mono" placeholder='[{"name":"Example","site_url":"https://example.com","pricing":"free"}]' />
      </label>
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <select v-model="importMode" class="select !w-auto">
          <option value="update">Update existing</option><option value="skip">Skip existing</option>
        </select>
        <button class="btn-primary" type="submit" :disabled="importing">
          {{ importing ? 'Importing...' : 'Import (max 200)' }}
        </button>
        <span class="font-body text-[10px]" style="color: var(--color-text-muted)">
          Incomplete rows become needs_info; lists are recalculated once at the end.
        </span>
      </div>
    </form>

    <div class="rounded-lg overflow-x-auto mb-3" :style="cardStyle">
      <table class="w-full font-body text-[11px] min-w-[700px]">
        <thead :style="{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }">
          <tr>
            <th class="text-left p-2">Platform</th><th class="text-left p-2">Source</th>
            <th class="text-right p-2">DR</th><th class="text-left p-2">Pricing</th>
            <th class="text-left p-2">Status</th><th class="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="site in sites" :key="site.slug" :style="{ borderTop: '1px solid var(--color-border)' }">
            <td class="p-2">
              <NuxtLink :to="`/backlink-sites/${site.slug}`" style="color: var(--color-text-link)">{{ site.name }}</NuxtLink>
              <div class="mt-0.5" style="color: var(--color-text-muted)">{{ site.slug }} · {{ site.category_count }} tags</div>
            </td>
            <td class="p-2" style="color: var(--color-text-secondary)">{{ site.data_source }}</td>
            <td class="p-2 text-right" style="color: var(--color-text-primary)">{{ site.domain_rating ?? '—' }}</td>
            <td class="p-2" style="color: var(--color-text-secondary)">{{ site.pricing }}</td>
            <td class="p-2" style="color: var(--color-text-secondary)">{{ site.status }}</td>
            <td class="p-2 text-right space-x-1">
              <button class="btn-ghost" @click="openEditor(site.slug)">Edit</button>
              <button class="btn-ghost" @click="toggleHidden(site)">
                {{ site.status === 'hidden' ? 'Restore' : 'Hide' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex items-center justify-center gap-2 mb-8">
      <button class="btn-secondary !h-8" :disabled="sitePage <= 1" @click="loadSites(sitePage - 1)">← Prev</button>
      <span class="font-body text-[11px]" style="color: var(--color-text-muted)">Page {{ sitePage }}</span>
      <button class="btn-secondary !h-8" :disabled="sites.length < sitePageSize" @click="loadSites(sitePage + 1)">Next →</button>
    </div>

    <!-- Edit panel -->
    <form v-if="editor.slug" class="rounded-lg p-4 mb-8" :style="cardStyle" @submit.prevent="saveEditor">
      <h3 class="font-sans font-bold text-[13px] mb-1" style="color: var(--color-text-primary)">
        Edit · {{ editor.slug }}
      </h3>
      <p class="font-body text-[10px] mb-3" style="color: var(--color-text-muted)">
        Complete all required facts to publish. Saving recalculates rule-based lists automatically.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label class="font-body text-[10px]">Name<input v-model="editor.name" class="input mt-1" /></label>
        <label class="font-body text-[10px]">Website<input v-model="editor.site_url" class="input mt-1" /></label>
        <label class="font-body text-[10px]">Submission URL<input v-model="editor.submit_url" class="input mt-1" /></label>
        <label class="font-body text-[10px]">Submission channel
          <select v-model="editor.submit_method" class="select mt-1">
            <option value="unknown">Unknown</option><option value="form">Online form</option>
            <option value="github_pr">GitHub PR</option><option value="awesome_list">Awesome list</option>
            <option value="sign_in">Sign-in required</option><option value="community_post">Community post</option>
            <option value="external">External page</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Pricing
          <select v-model="editor.pricing" class="select mt-1">
            <option value="unknown">Unknown</option><option value="free">Free</option>
            <option value="freemium">Freemium</option><option value="paid">Paid</option><option value="optional">Optional</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Free submission lane
          <select v-model="editor.has_free_submission" class="select mt-1">
            <option :value="null">Unconfirmed</option><option :value="1">Yes</option><option :value="0">No</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Domain rating<input v-model="editor.domain_rating" type="number" min="0" max="100" class="input mt-1" /></label>
        <label class="font-body text-[10px]">Approval text<input v-model="editor.approval" class="input mt-1" /></label>
        <label class="font-body text-[10px]">Approval bucket
          <select v-model="editor.approval_bucket" class="select mt-1">
            <option value="unknown">Unknown</option><option value="fast">Fast</option><option value="week">Week</option>
            <option value="month">Month</option><option value="slow">Slow</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Dofollow
          <select v-model="editor.dofollow_link" class="select mt-1">
            <option :value="null">Not stated</option><option :value="1">Yes</option><option :value="0">No</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Backlink / badge required
          <select v-model="editor.backlink_required" class="select mt-1">
            <option :value="null">Not stated</option><option :value="1">Yes</option><option :value="0">No</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Category slugs (comma-separated)
          <input v-model="editor.categories" class="input mt-1" />
        </label>
        <label class="font-body text-[10px]">Status
          <select v-model="editor.status" class="select mt-1">
            <option value="active">Active</option><option value="needs_info">Needs info</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label class="font-body text-[10px]">Indexed / featured
          <span class="flex gap-2 mt-1">
            <select v-model="editor.indexed" class="select"><option :value="0">Not indexed</option><option :value="1">Indexed</option></select>
            <select v-model="editor.is_featured" class="select"><option :value="0">Normal</option><option :value="1">Featured</option></select>
          </span>
        </label>
        <label class="font-body text-[10px] sm:col-span-2 lg:col-span-3">Original editorial note (optional)
          <textarea v-model="editor.editorial" class="textarea mt-1 !h-[70px]" />
        </label>
      </div>
      <div class="flex gap-2 mt-3">
        <button class="btn-primary" type="submit" :disabled="saving">Save &amp; recalculate</button>
        <button class="btn-ghost" type="button" @click="editor.slug = ''">Close</button>
      </div>
    </form>

    <!-- ── Reports ───────────────────────────────────────────── -->
    <h2 class="font-sans font-bold text-[15px] mb-3 mt-10" style="color: var(--color-text-primary)">
      Pending reports ({{ reports.length }})
    </h2>
    <div v-if="reports.length === 0" class="font-body text-[11px] mb-8" style="color: var(--color-text-muted)">Nothing to review.</div>
    <div v-for="report in reports" :key="report.id" class="rounded-lg p-3 mb-2 flex flex-wrap items-start gap-3" :style="cardStyle">
      <div class="flex-1 min-w-[220px]">
        <div class="font-body text-[11px]" style="color: var(--color-text-primary)">
          #{{ report.id }} · {{ report.kind }} · {{ report.site_slug || 'new' }}
        </div>
        <div class="font-body text-[10px] mt-1" style="color: var(--color-text-secondary)">{{ report.payload }}</div>
        <div class="font-body text-[9px] mt-1" style="color: var(--color-text-muted)">
          {{ report.contact || 'no contact' }} · {{ report.created_at }}
        </div>
      </div>
      <div class="space-x-1">
        <button v-if="report.site_slug" class="btn-ghost" @click="reviewAndEdit(report)">Accept &amp; edit</button>
        <button class="btn-secondary !h-8" @click="review(report, 'accepted')">Accept</button>
        <button class="btn-ghost" @click="review(report, 'rejected')">Reject</button>
      </div>
    </div>

    <!-- ── Changelog ─────────────────────────────────────────── -->
    <h2 class="font-sans font-bold text-[15px] mb-3 mt-10" style="color: var(--color-text-primary)">Recent list changes</h2>
    <div v-if="recentChanges.length === 0" class="font-body text-[11px] mb-8" style="color: var(--color-text-muted)">
      No membership changes recorded yet.
    </div>
    <div v-for="(change, index) in recentChanges" :key="index" class="font-body text-[10px] mb-1"
      style="color: var(--color-text-secondary)">
      <span style="color: var(--color-accent)">{{ change.change_type }}</span>
      · {{ change.list_slug }} · {{ change.name || change.site_slug }} · {{ change.created_at }}
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface AdminList {
  slug: string; title: string; kind: string; dimension: string
  item_count: number; status: string; intro?: string; methodology?: string
  limit_count?: number; min_items?: number; pinned_order?: string
  include_slugs?: string; exclude_slugs?: string
  filters?: string | null; sort?: string | null; faq?: string | null
  seo_title?: string | null; seo_description?: string | null
}
interface AdminReport {
  id: number; kind: string; site_slug: string | null
  payload: string | null; contact: string | null; created_at: string
}
interface AdminSite {
  slug: string; name: string; site_url: string; domain_rating: number | null
  pricing: string; status: string; data_source: string; category_count: number
}
interface AdminOverview {
  lists: AdminList[]
  reports: AdminReport[]
  siteCounts: Record<string, number>
  categories: { category_slug: string; count: number }[]
  recentChanges: { list_slug: string; site_slug: string; change_type: string; created_at: string; name: string | null }[]
  unconfirmedRelations: number
}
interface SiteDetail {
  site: Record<string, unknown>
  categories: string[]
}

const { get, post } = useApi()
const panelStyle = { background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }
const cardStyle = { background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }
const activeTabStyle = { background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }
const idleTabStyle = { background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid transparent' }
const tabs = [
  { label: 'Review Submissions', to: '/admin' },
  { label: 'Tool Intake', to: '/admin/intake' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Submission Lists', to: '/admin/submission-lists' },
]

const lists = ref<AdminList[]>([])
const reports = ref<AdminReport[]>([])
const sites = ref<AdminSite[]>([])
const siteCounts = ref<Record<string, number>>({})
const categories = ref<{ category_slug: string; count: number }[]>([])
const recentChanges = ref<AdminOverview['recentChanges']>([])
const unconfirmedRelations = ref(0)
const siteTotal = ref(0)
const sitePage = ref(1)
const sitePageSize = 20
const siteQuery = ref('')
const siteStatus = ref('')
const refreshing = ref(false)
const saving = ref(false)
const importing = ref(false)
const creatingList = ref(false)
const message = ref('')
const error = ref('')
const showAddSite = ref(false)
const showImport = ref(false)
const showCreateList = ref(false)
const importJson = ref('')
const importMode = ref<'update' | 'skip'>('update')

const blankForm = () => ({
  name: '', site_url: '', submit_url: '', slug: '', pricing: 'unknown',
  domain_rating: 0, approval_bucket: 'unknown', dofollow_link: null as number | null,
  backlink_required: null as number | null, category: '',
})
const form = ref(blankForm())

const blankNewList = () => ({
  slug: '', title: '', description: '', dimension: 'topic', kind: 'rule',
  limit_mode: 'all', limit_count: 0, min_items: 10, filters: '', sort: '',
})
const newList = ref(blankNewList())

const curate = ref({
  slug: '', title: '', kind: 'rule', dimension: 'topic', limit_count: 0, min_items: 10,
  intro: '', methodology: '', pinned_order: '', include_slugs: '', exclude_slugs: '',
  filters: '', sort: '', faq: '', seo_title: '', seo_description: '',
})

const editor = ref({
  slug: '', name: '', site_url: '', submit_url: '', submit_method: 'unknown',
  pricing: 'unknown', has_free_submission: null as number | null,
  domain_rating: 0 as number | null, approval: '', approval_bucket: 'unknown',
  dofollow_link: null as number | null, backlink_required: null as number | null,
  categories: '', status: 'active', indexed: 0, is_featured: 0, editorial: '',
})

const stats = computed(() => [
  { label: 'Active sites', value: siteCounts.value.active ?? 0 },
  { label: 'Needs info', value: siteCounts.value.needs_info ?? 0 },
  { label: 'Hidden', value: siteCounts.value.hidden ?? 0 },
  { label: 'Lists', value: lists.value.length },
  { label: 'Categories', value: categories.value.length },
  { label: 'Relation candidates', value: unconfirmedRelations.value },
  { label: 'Pending reports', value: reports.value.length },
])

function errText(e: unknown, fallback: string) {
  return (e as { data?: { message?: string } })?.data?.message || fallback
}
function csvList(value: string) {
  return value.split(',').map(v => v.trim()).filter(Boolean)
}
function jsonList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch { return [] }
}

async function load() {
  try {
    const data = await get<AdminOverview>('/api/admin/submission-lists')
    lists.value = data.lists
    reports.value = data.reports
    siteCounts.value = data.siteCounts
    categories.value = data.categories || []
    recentChanges.value = data.recentChanges || []
    unconfirmedRelations.value = data.unconfirmedRelations ?? 0
  } catch (e) {
    error.value = errText(e, 'Could not load admin data.')
  }
}

async function loadSites(page = sitePage.value) {
  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(sitePageSize) })
    if (siteQuery.value.trim()) params.set('q', siteQuery.value.trim())
    if (siteStatus.value) params.set('status', siteStatus.value)
    const data = await get<{ sites: AdminSite[]; total: number }>(`/api/admin/submission-sites?${params}`)
    sites.value = data.sites
    siteTotal.value = data.total
    sitePage.value = page
  } catch (e) {
    error.value = errText(e, 'Could not load sites.')
  }
}

async function refreshAll() {
  refreshing.value = true
  error.value = ''
  try {
    const res = await post<{ refreshed: { slug: string; joined: number; left: number }[] }>(
      '/api/admin/submission-lists/refresh', {}
    )
    const changed = res.refreshed.filter(r => r.joined || r.left).length
    message.value = `Refreshed ${res.refreshed.length} lists (${changed} with membership changes).`
    await Promise.all([load(), loadSites()])
  } catch (e) {
    error.value = errText(e, 'Refresh failed.')
  } finally { refreshing.value = false }
}

async function refreshOne(slug: string) {
  error.value = ''
  try {
    await post('/api/admin/submission-lists/refresh', { slug })
    message.value = `Refreshed ${slug}.`
    await load()
  } catch (e) { error.value = errText(e, 'Refresh failed.') }
}

async function toggleStatus(list: AdminList) {
  error.value = ''
  try {
    await post(`/api/admin/submission-lists/${list.slug}`, {
      status: list.status === 'published' ? 'draft' : 'published',
    })
    await load()
  } catch (e) { error.value = errText(e, 'Update failed.') }
}

function prettyJson(value: string | null | undefined, fallback = '') {
  if (!value) return fallback
  try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
}

function openCurate(list: AdminList) {
  curate.value = {
    slug: list.slug,
    title: list.title,
    kind: list.kind,
    dimension: list.dimension || 'topic',
    limit_count: list.limit_count ?? 0,
    min_items: list.min_items ?? 10,
    intro: list.intro || '',
    methodology: list.methodology || '',
    pinned_order: jsonList(list.pinned_order || '[]').join(', '),
    include_slugs: jsonList(list.include_slugs || '[]').join(', '),
    exclude_slugs: jsonList(list.exclude_slugs || '[]').join(', '),
    filters: prettyJson(list.filters, '{\n  "and": []\n}'),
    sort: prettyJson(list.sort, '[\n  { "field": "domain_rating", "dir": "desc" }\n]'),
    faq: prettyJson(list.faq, '[]'),
    seo_title: list.seo_title || '',
    seo_description: list.seo_description || '',
  }
}

async function saveCurate() {
  error.value = ''
  try {
    await post(`/api/admin/submission-lists/${curate.value.slug}`, {
      title: curate.value.title,
      kind: curate.value.kind,
      dimension: curate.value.dimension,
      limit_count: curate.value.limit_count,
      min_items: curate.value.min_items,
      intro: curate.value.intro,
      methodology: curate.value.methodology,
      seo_title: curate.value.seo_title,
      seo_description: curate.value.seo_description,
      pinned_order: csvList(curate.value.pinned_order),
      include_slugs: csvList(curate.value.include_slugs),
      exclude_slugs: csvList(curate.value.exclude_slugs),
      filters: curate.value.filters.trim(),
      sort: curate.value.sort.trim(),
      faq: curate.value.faq.trim(),
    })
    await post('/api/admin/submission-lists/refresh', { slug: curate.value.slug })
    message.value = `Curation saved for ${curate.value.slug} and members rebuilt.`
    await load()
  } catch (e) { error.value = errText(e, 'Could not save curation.') }
}

async function createList() {
  creatingList.value = true
  error.value = ''
  try {
    const res = await post<{ message: string }>('/api/admin/submission-lists', {
      ...newList.value,
      filters: newList.value.filters.trim() || null,
      sort: newList.value.sort.trim() || null,
    })
    message.value = res.message
    newList.value = blankNewList()
    showCreateList.value = false
    await load()
  } catch (e) { error.value = errText(e, 'Could not create the list.') }
  finally { creatingList.value = false }
}

async function addSite() {
  saving.value = true
  error.value = ''
  try {
    const res = await post<{ message: string }>('/api/admin/submission-sites', {
      ...form.value,
      categories: csvList(form.value.category),
      domain_rating: form.value.domain_rating || null,
    })
    message.value = res.message
    form.value = blankForm()
    await Promise.all([load(), loadSites()])
  } catch (e) { error.value = errText(e, 'Could not add the platform.') }
  finally { saving.value = false }
}

async function importSites() {
  importing.value = true
  error.value = ''
  try {
    const res = await post<{ message: string; errors: string[] }>('/api/admin/submission-sites/import', {
      json: importJson.value, mode: importMode.value,
    })
    message.value = res.errors.length
      ? `${res.message} ${res.errors.length} row(s) failed: ${res.errors.slice(0, 3).join('; ')}`
      : res.message
    importJson.value = ''
    await Promise.all([load(), loadSites()])
  } catch (e) { error.value = errText(e, 'Import failed.') }
  finally { importing.value = false }
}

async function openEditor(slug: string) {
  error.value = ''
  try {
    const data = await get<SiteDetail>(`/api/admin/submission-sites/${slug}`)
    const s = data.site
    editor.value = {
      slug,
      name: String(s.name || ''),
      site_url: String(s.site_url || ''),
      submit_url: String(s.submit_url || ''),
      submit_method: String(s.submit_method || 'unknown'),
      pricing: String(s.pricing || 'unknown'),
      has_free_submission: (s.has_free_submission as number | null) ?? null,
      domain_rating: (s.domain_rating as number | null) ?? null,
      approval: String(s.approval || 'Not stated'),
      approval_bucket: String(s.approval_bucket || 'unknown'),
      dofollow_link: (s.dofollow_link as number | null) ?? null,
      backlink_required: (s.backlink_required as number | null) ?? null,
      categories: data.categories.join(', '),
      status: String(s.status || 'needs_info'),
      indexed: Number(s.indexed || 0),
      is_featured: Number(s.is_featured || 0),
      editorial: String(s.editorial || ''),
    }
  } catch (e) { error.value = errText(e, 'Could not load the site.') }
}

async function saveEditor() {
  saving.value = true
  error.value = ''
  try {
    const res = await post<{ message: string }>(`/api/admin/submission-sites/${editor.value.slug}`, {
      ...editor.value,
      categories: csvList(editor.value.categories),
      domain_rating: editor.value.domain_rating || null,
    })
    message.value = res.message
    await Promise.all([load(), loadSites()])
  } catch (e) { error.value = errText(e, 'Could not save the site.') }
  finally { saving.value = false }
}

async function toggleHidden(site: AdminSite) {
  error.value = ''
  try {
    await post(`/api/admin/submission-sites/${site.slug}`, {
      status: site.status === 'hidden' ? 'active' : 'hidden',
    })
    await Promise.all([load(), loadSites()])
  } catch (e) { error.value = errText(e, 'Could not change visibility.') }
}

async function review(report: AdminReport, decision: 'accepted' | 'rejected') {
  error.value = ''
  try {
    const res = await post<{ message: string }>('/api/admin/submission-reports/review', {
      id: report.id, decision, kind: report.kind,
    })
    message.value = res.message
    await load()
  } catch (e) { error.value = errText(e, 'Review failed.') }
}

async function reviewAndEdit(report: AdminReport) {
  await review(report, 'accepted')
  if (report.site_slug) await openEditor(report.site_slug)
}

onMounted(() => {
  load()
  loadSites(1)
})
</script>
