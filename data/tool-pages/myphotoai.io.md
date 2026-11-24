---
name: "MyPhotoAI"
slug: "myphotoai"
website: "https://myphotoai.io/"
category: "image"
pricing: "paid"
short_description: "Generate AI headshots in 142 looks; entry CTA hit a CAPTCHA in our run."
meta_description: "MyPhotoAI promises AI headshots from US$5 in 142 looks. Its 'Plan my shoot' entry triggered a Cloudflare challenge; no generation was observed."
status: "pending"
data_source: "evidence_probe"
evidence_level: "BLOCKED_CAPTCHA"
last_verified: "2026-11-23"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

MyPhotoAI presents itself as an "AI Headshot Generator" and "Virtual AI Photo Studio" for professional photos from home. Its landing page says to upload 10–15 photos, train a personalized portrait model, then choose from 142 looks across 7 categories and pay once to start a shoot; the metadata states headshots from US$5, with 3 HD photos kept for US$5 or all photos from one shoot for US$10, and no subscription. None of these claims were verified in this run.

## What we checked

- L2 probe reached `https://myphotoai.io/` with HTTP 200, final host `myphotoai.io`, title and OG title "MyPhotoAI - AI Headshot Generator | Virtual Photo Studio"; 1,444 visible words and 130 links.
- OG description carries the pricing claims (US$5 / US$10, no subscription). Automated probing did **not** discover a standalone pricing page; the landing screenshot does show a `PRICING` navigation link, so this is an incomplete crawl rather than a confirmed absence.
- Terms (`/privacy`) and privacy pages were present; contact page was not found; no login or signup link was detected in the static HTML.
- Google Analytics property `G-DTD54M36MF` is present. `robots.txt` is present with no blanket disallow; the fetched terms page contained no detected ban on automated access.
- L2 verdict was **MANUAL**, reason: "声称收费但未发现定价页". This was explicitly carried into L3 rather than treated as a hard rejection.

## Hands-on run

Three L3 attempts were made. The first used the default homepage-only path: 0 file inputs, 0 text inputs, 0 textareas and 28 buttons, with 0 visible text inputs, finishing in 9.5s as UNVERIFIED. A site adapter was then added to follow the non-login, non-payment "Plan my shoot" entry CTA. The second run (local headless Chrome) loaded the adapter, clicked that button, and stopped after 19.6s when Cloudflare `challenge-platform` requests appeared in the network log. The third run used CDP mode to reuse a real, headed Chrome profile on port 9200; it reached the same entry CTA and again stopped after 19.5s with the same network signal. Per the pipeline's hard red line, the challenge was **not** bypassed in any run — no captcha-solving service, no visual-model workaround. No file was injected, no uploader was reached, no backend/model call or artifact was observed, and no `02-entry.png` was saved because the stop happened before the post-click screenshot. HTTP status was 200 and the final host stayed `myphotoai.io` in all runs.

## Verification status

**BLOCKED_CAPTCHA.** The entry-point click triggered a Cloudflare challenge in both headless and CDP modes, so the generation path could not be observed at all. L2 had already returned MANUAL because no standalone pricing page was discovered despite price strings in the metadata; L3 adds a second, independent blocker. This is not evidence that the tool fails — it means automated passes cannot verify it under the stated no-bypass rule, even with a real browser profile. It must not be recorded as VERIFIED; a future attempt would need a human to complete the challenge interactively and then confirm an upload control and attributable output before any generation claim is made.

## FAQ

No web-supplement step (PAA / Reddit / G2) was performed in this local-evidence-only pass, so no FAQ questions are listed here. Per the intake rules, questions without a real source are not invented.

## Evidence

- `reports/evidence/myphotoai.io/01-landing.png` (landing page: PRICING nav and "Plan my shoot" CTA, no upload control)
- `reports/evidence/myphotoai.io.json` (verdict BLOCKED_CAPTCHA, L2-manual marker, final run CDP/headed, 19.5s, captcha signal `network`)
- `reports/evidence-probe.json` (L2 facts and MANUAL reason)
- No `02-entry.png` and no artifact files: the CAPTCHA red line stopped the run before screenshots or collection began.
