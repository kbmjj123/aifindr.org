# aifindr.org — Discover AI Tools

<div align="center">

[![Live Site](https://img.shields.io/badge/Live%20Site-aifindr.org-a3e635?style=flat-square)](https://aifindr.org)
[![License](https://img.shields.io/badge/License-MIT-60a5fa?style=flat-square)](./LICENSE)
[![Built with Nuxt](https://img.shields.io/badge/Built%20with-Nuxt%203-00DC82?style=flat-square)](https://nuxt.com)
[![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare-F6821F?style=flat-square)](https://pages.cloudflare.com)

**Open-source AI tools directory. Submit your tool, get 3 free dofollow backlinks.**

[Browse Tools](https://aifindr.org/tools) · [Submit a Tool](https://aifindr.org/submit) · [Contributors](https://aifindr.org/contributors) · [Blog](https://aifindr.org/blog)

</div>

---

## What is aifindr.org?

aifindr.org is a community-driven, open-source directory of AI tools. Anyone can submit a tool via Pull Request or the online form. Approved tools are listed on the site and earn **3 free dofollow backlinks** as an incentive for contributors.

## Free Backlinks for Contributors

Every approved tool submission earns 3 permanent dofollow backlinks:

| Source | URL | Authority |
|--------|-----|-----------|
| GitHub (this repo) | `github.com/kbmjj123/aifindr.org/...` | DA 100 |
| Tool detail page | `aifindr.org/tools/[category]/[tool]` | DA growing |
| Contributor profile | `aifindr.org/contributors/[username]` | Grows with contributions |

## Tech Stack

- **Framework**: [Nuxt 3](https://nuxt.com) (Vue 3 + TypeScript)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com)
- **Styling**: CSS (custom)
- **Data**: Markdown files with YAML frontmatter

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/kbmjj123/aifindr.org.git
cd aifindr.org

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

### Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy .output/public
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NUXT_PUBLIC_SITE_URL` | Your deployed site URL | ✅ |
| `GITHUB_TOKEN` | GitHub token for PR automation | ✅ |
| `GITHUB_REPO` | Target repo for submissions (`owner/repo`) | ✅ |
| `NUXT_PUBLIC_GA_ID` | Google Analytics measurement ID | Optional |

---

## Project Structure

```
aifindr.org/
├── components/          # Vue UI components
├── composables/         # Shared logic hooks
├── content/
│   └── tools/           # Tool Markdown files (one per tool)
│       ├── image/       # Image & Design tools
│       ├── writing/     # Writing & Content tools
│       ├── video/       # Video & Animation tools
│       ├── audio/       # Audio & Music tools
│       ├── code/        # Code & Developer tools
│       ├── productivity/
│       ├── marketing/   # Marketing & SEO tools
│       ├── data/        # Data & Analytics tools
│       ├── education/   # Education & Learning tools
│       ├── business/    # Business & Finance tools
│       ├── research/    # Research & Search tools
│       └── other/
├── docs/                # GitHub Pages (developer docs)
├── pages/               # Nuxt route pages
├── server/              # API routes
├── schema/              # Tool data schema & validation
├── nuxt.config.ts
├── wrangler.toml        # Cloudflare Pages config
└── .env.example
```

---

## Submitting a Tool

### Option A — Online Form (easiest)

Go to [aifindr.org/submit](https://aifindr.org/submit) and fill out the form. Your tool will be reviewed within 48 hours.

### Option B — GitHub Pull Request

1. Fork this repository
2. Create a Markdown file in the correct category folder:

```
content/tools/[category]/[tool-name].md
```

3. Fill in the frontmatter:

```yaml
---
name: Your Tool Name
website: https://yourtool.com
category: image
description: One sentence description, under 15 words.
tags:
  - free
  - no-watermark
  - open-source
pricing: freemium        # free | freemium | paid
submitter_site: https://yoursite.com
---

Optional longer description here.
```

4. Open a Pull Request with the title: `Add [Tool Name] to [Category]`

### Tool Submission Guidelines

- Description must be under 15 words
- No promotional language ("best", "amazing", "revolutionary")
- Tool must be publicly accessible and actively maintained
- One tool per Pull Request

---

## Categories

| Category | Slug | Description |
|----------|------|-------------|
| 🖼️ Image & Design | `image` | Image generation, editing, upscaling |
| ✍️ Writing & Content | `writing` | Copywriting, blogging, text generation |
| 🎬 Video & Animation | `video` | Video generation, editing, subtitles |
| 🎵 Audio & Music | `audio` | Music generation, voice, transcription |
| 💻 Code & Developer | `code` | Coding assistance, review, documentation |
| ⚡ Productivity | `productivity` | Task management, automation, summarization |
| 📈 Marketing & SEO | `marketing` | SEO, social media, ads, email marketing |
| 📊 Data & Analytics | `data` | Data analysis, visualization, BI |
| 📚 Education & Learning | `education` | Tutoring, language learning, courses |
| 💼 Business & Finance | `business` | Finance, legal, HR, CRM |
| 🔬 Research & Search | `research` | Research, fact-checking, discovery |
| ··· Other | `other` | Everything else |

---

## Contributing to the Codebase

Bug fixes, new features, and UI improvements are all welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

For larger changes, please open an Issue first to discuss the approach.

---

## Free Backlink Exchange

Add a footer link to aifindr.org on your site and unlock free access to premium features.

Copy this code to your site's footer:

```html
<a href="https://aifindr.org" target="_blank" rel="dofollow">
  Discover AI Tools on aifindr.org
</a>
```

[Learn more →](https://aifindr.org)

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

The Commons Clause condition applies: you may not sell this software as a hosted service.

---

## Links

- 🌐 Live site: [aifindr.org](https://aifindr.org)
- 📖 Developer docs: [kbmjj123.github.io/aifindr.org](https://kbmjj123.github.io/aifindr.org)
- 🤝 Contributors: [aifindr.org/contributors](https://aifindr.org/contributors)
- 📝 Blog: [aifindr.org/blog](https://aifindr.org/blog)

<div align="center">
<br/>
Built with ❤️ by <a href="https://aifindr.org">aifindr.org</a>
</div>
