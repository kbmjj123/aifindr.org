---
name: "AI Tools Radar"
slug: "ai-tools-radar-ai-research-tool"
website: "https://aitoolsradar.com/"
category: "research"
pricing: "free"
short_description: "AI tool directory; our search returned list thumbnails, not generated output."
meta_description: "AI Tools Radar describes a tool and model directory plus a free prompt library. Our search returned result cards, not generated output."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

AI Tools Radar describes a directory of AI tools, models and agent skills, a library of free prompts, and comparisons of capabilities and pricing that are regularly updated.

## What we checked

- 1,038 visible words and 66 links.
- Only terms and privacy links were detected — no pricing, contact, login or docs page in the crawled links, a noticeably thinner supporting-page set than most of this batch.
- No analytics ID and no external model-provider reference appeared in the static HTML.
- `robots.txt` is present without a blanket disallow; the terms page contained no detected automated-access ban.

## Hands-on run

The page had 0 file inputs, 1 text input and only 4 buttons, with 1 visible input. We filled the field labelled "What do you want t…" with a short locally composed test phrase and clicked "Run search". The page added 23 new images, but every one was under 320px wide and was classified as a list thumbnail or UI asset rather than a generated artifact. The requests we captured were `POST /cdn-cgi/rum?`, `POST /api/analytics/events` and `POST /api/analytics/journey` — analytics and performance beacons, not a model call. Both screenshots were saved.

## Verification status

**UNVERIFIED.** This entry is a directory and search product, so our artifact-based definition of "output" does not map cleanly onto it: the 23 thumbnails are plausibly the intended search results, but we did not classify them as generated artifacts. We record the search action and the analytics calls, and we do not claim the site generates anything.

## FAQ

**Did the search return results?**
The page added 23 small images after "Run search". We treated them as list thumbnails because all were below our 320px threshold, so we did not record them as generated output.

**Is this a generation tool?**
By its own description it is a directory and prompt library, not a generator. Our test found no model-provider call and no downloadable artifact.

**What pages does it publish?**
We detected links to terms and privacy, but no pricing, docs or login links in the page we crawled.

## Evidence

- `reports/evidence/aitoolsradar.com/01-landing.png`
- `reports/evidence/aitoolsradar.com/02-result.png`
- `reports/evidence/aitoolsradar.com.json`
