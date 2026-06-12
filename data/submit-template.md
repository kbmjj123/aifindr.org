---
# ─── Basic Info ──────────────────────────────
name: "Your Tool Name"                          # Required: Display name
slug: "your-tool-slug"                          # Required: URL slug (lowercase, hyphens)
website: "https://your-tool.com"                # Required: Official website URL
category: "image"                               # Required: One of: image | writing | video | audio | code | productivity | marketing | data | education | business | research | other
sub_category: "image-generation"                # Optional*: Sub-category (required if category has sub-categories). See options below.

# ─── Pricing ──────────────────────────────────
pricing: "free"                                 # Required: free | freemium | paid
price_starting: 0                               # Optional: Starting price in USD
price_detail: ""                                # Optional: Pricing detail, e.g. "Free 10 credits/day / Pro $12/month"
has_free_trial: false                           # Optional: true if offers free trial (paid only)

# ─── Description ──────────────────────────────
description: "A brief one-line description (max 80 characters)"   # Required: Short tagline
meta_description: ""                            # Optional: SEO description (150 chars max, falls back to description)

# ─── Platform Support ─────────────────────────
platforms: ["web"]                              # Required: web | desktop | mobile | api

# ─── Status & Release ─────────────────────────
status: "active"                                # Optional: active (default) | beta | discontinued
launched: ""                                    # Optional: Launch date, e.g. "2023-07"

# ─── Tags ─────────────────────────────────────
# Feature tags (pick any number):
# free-tier | no-signup | open-source | api-available | browser-based | offline-local | freemium
feature_tags: []

# Audience tags (max 3):
# developer | designer | marketer | student | content-creator | small-business | freelancer | researcher
audience_tags: []

# Use case tags (max 3, depends on category):
# image:   image-generation | image-upscaling | background-removal | logo-design | illustration
# writing: copywriting | blog-writing | email-writing | paraphrasing | seo-content | product-description
# video:   video-generation | video-editing | subtitles-captions | avatar-video | animation
# audio:   music-generation | text-to-speech | voice-cloning | transcription | audio-enhancement
# code:    code-completion | code-review | sql-generation | test-generation | documentation
# productivity: meeting-notes | pdf-summarization | workflow-automation | scheduling | task-management
# marketing:   seo-optimization | social-media | ad-copy | landing-page | competitor-analysis
# data:    data-analysis | chart-visualization | spreadsheet | dashboard | report-generation
# education:   homework-help | math-solving | flashcards | language-learning | course-creation
# business:    business-planning | contract-review | invoicing | pitch-deck | recruiting | customer-support
# research:    academic-research | paper-summarization | citation | fact-checking | web-scraping
use_case_tags: []

# ─── Submitter Info ───────────────────────────
submitter_email: "you@example.com"              # Required: For submission status updates (never public)
submitter_site: "https://your-site.com"          # Optional: Gets a dofollow backlink
submitter_github: "your-github-username"         # Optional: Auto-filled from GitHub login

# ─── Media (optional) ─────────────────────────
cover_image: ""                                 # Optional: Tool icon URL (square, 512x512px recommended)
og_image: ""                                    # Optional: OG image URL (1200x630px recommended)
screenshots: []                                 # Optional: Array of screenshot URLs (max 3, 1280x800px)
demo_video: ""                                  # Optional: Demo video URL (YouTube, Vimeo, etc.)
---

## What is [Your Tool]?

Write a detailed description of your tool here. Explain what problem it solves, who it's for, and why it's unique. Support Markdown formatting — use **bold**, *italic*, `code`, and links where appropriate.

Aim for 150-500 words covering:
- **Core functionality**: What does the tool actually do?
- **Target audience**: Who benefits most from using it?
- **Unique value**: What makes it different from alternatives?
- **Use cases**: Real-world scenarios where this tool excels.

## Key Features

- Feature 1: Brief description of what it does and why it matters
- Feature 2: Another standout capability
- Feature 3: Differentiator from competitors
- Add more as needed (aim for 4-8 features)

## Pricing

Describe your pricing model in detail:

| Plan | Price | Key Limits |
|------|-------|------------|
| Free | $0 | Basic features, limited usage |
| Pro | $X/mo | Full features, higher limits |
| Enterprise | Custom | Everything + dedicated support |

- **Free tier available?** Yes/No — what's included?
- **Free trial?** Yes/No — how long? credit card required?
- **Pay-as-you-go?** Yes/No — credit-based or usage-based?

## Who Is It For?

Describe the ideal user profile(s). Be specific — this helps visitors quickly determine if the tool fits their needs.

- **Developers** — API access, SDK support, documentation
- **Designers** — Creative workflows, templates, collaboration
- **Marketers** — Campaign management, analytics, automation
- **Small Business** — Budget-friendly, easy setup, support

## Pros & Cons

**Pros**
- ✅ Advantage one
- ✅ Advantage two
- ✅ Advantage three

**Cons**
- ❌ Limitation or drawback one
- ❌ Limitation or drawback two

## Alternatives

List 3-5 comparable tools visitors might also consider:

- **Alternative 1**: How your tool differs or is better
- **Alternative 2**: Key differentiator
- **Alternative 3**: Why choose yours instead
