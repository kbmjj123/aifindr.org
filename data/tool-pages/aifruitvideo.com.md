---
name: "AI Fruit Video"
slug: "ai-fruit-video-ai-video-generator"
website: "https://aifruitvideo.com"
category: "video"
pricing: "freemium"
short_description: "Fruit video generator; one captured PNG was our own upload echoed back."
meta_description: "AI Fruit Video describes turning a fruit story into a shareable video. Our run captured an 801KB MP4 alongside an echo of our own upload."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

The site describes turning a fruit story into a video, with a choice of funny, dramatic or unexpected treatments, using an "AI fruit video generator".

## What we checked

- 2,305 visible words; pricing, terms, privacy and contact links are present.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.
- No analytics ID and no external model-provider domain appeared in the static HTML.

## Hands-on run

The page exposed 3 file inputs, 7 text inputs, 1 textarea and 79 buttons, with 2 visible inputs — the most form-heavy page in this batch. We injected a locally synthesised 618.1KB PNG and clicked "Start creating". The run captured an 820KB `video/mp4` response from `api.aifruitvideo.com`, a 632,900-byte PNG, and a 103.5KB 420×236 page image. We also recorded a `PUT /media/input-references/…` upload plus a series of `GET /_next/image?url=/reference-presets/characters/…` and `/scenes/…` requests for preset character and scene artwork.

A byte-level check found the 632,900-byte PNG is **identical (same MD5) to our own `sample.png`** — it is our upload echoed back, not a new output. The MP4 arrived alongside preset-artwork requests, so its relationship to our input is unproven.

## Verification status

**UNVERIFIED (downgraded from VERIFIED).** One of the two large "artifacts" is provably our own input file. The MP4 may be a genuine render or a preset sample; we cannot distinguish the two from this run, so we do not claim a video was generated from our upload. A clean verdict would require hashing every captured response against the uploaded fixture first.

## FAQ

**Did the test produce a fruit video?**
A 820KB MP4 was captured, but we cannot tie it to our upload. Another captured "artifact" was byte-identical to the test image we sent, so the original verdict was withdrawn.

**What is the MD5 issue?**
`artifact-net-1.png` and our synthetic `sample.png` are the same 632,900-byte file. Counting an echoed upload as output is a verifier bug, now documented here.

**What were the reference-presets requests?**
The page loaded preset character and scene artwork (`pineapple`, `apple`, `lemon`, `blueberry`, `city-square`). They are site assets, not results of our run.

## Evidence

- `reports/evidence/aifruitvideo.com/01-landing.png`
- `reports/evidence/aifruitvideo.com/02-result.png`
- `reports/evidence/aifruitvideo.com/artifact-net-0.mp4` (unattributed)
- `reports/evidence/aifruitvideo.com/artifact-net-1.png` (identical to uploaded fixture)
- `reports/evidence/aifruitvideo.com.json`
