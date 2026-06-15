export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    },
  },
  modules: ['@nuxt/content', '@nuxtjs/seo'],

  site: {
    url: 'https://aifindr.org',
    name: 'aifindr.org – Discover AI Tools',
  },

  css: ['~/assets/css/main.css', '~/assets/css/markdown.css', '@vueup/vue-quill/dist/vue-quill.snow.css'],

  compatibilityDate: '2026-05-07',

  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  nitro: {
    preset: 'cloudflare_module',
		cloudflare: {
			nodeCompat: true,
		},
  },
	runtimeConfig: {
		apiBase: '',  // 服务端用，本地开发由 .env.local 注入
	},

  content: {},

  ogImage: {
    enabled: true,
		// 告诉模块当前是边缘运行时，用 wasm 版本
		runtimeCacheStorage: false
  },

  robots: {
    allow: ['/'],
    disallow: ['/admin/', '/api/'],
  },

  sitemap: {
    sources: [
      '/api/__sitemap__/urls'
    ],
		exclude: [
			'/admin/**',
			'/api/**'
		],
    autoLastmod: true,
    urls: [
      { loc: '/tools/audio/',        changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/image/',        changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/writing/',      changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/video/',        changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/code/',         changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/productivity/', changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/marketing/',    changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/data/',         changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/education/',    changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/business/',     changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/research/',     changefreq: 'weekly', priority: 0.6 },
      { loc: '/tools/other/',        changefreq: 'weekly', priority: 0.6 },
    ],
  },

  routeRules: {
    '/admin/**': { ssr: false },
    '/blog':     { ssr: false },
    '/blog/*':   { ssr: false },
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
