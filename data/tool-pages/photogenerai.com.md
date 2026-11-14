---
name: "PhotoGenerAI"
slug: "photogenerai-ai-image-generator"
website: "https://photogenerai.com/"
category: "image"
pricing: "freemium"
short_description: "Browser photo editing; captured images were the site's before/after samples."
meta_description: "PhotoGenerAI describes text-to-photo creation, portraits, product photos and background changes. Our captured images were its own before/after samples."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

PhotoGenerAI describes creating photos from text or editing an uploaded photo — portraits and product photos, background changes and lighting refinement — entirely in the browser.

## What we checked

- 3,167 visible words and 114 links, one of the largest pages in this batch; pricing, terms, privacy, contact and signup links are present.
- Google Analytics property `G-GGCET5KGER` is in use. No external model-provider domain appeared in the static HTML.
- `robots.txt` is present without a blanket disallow; the terms page we fetched contained no detected ban on automated access.

## Hands-on run

The page exposed 1 file input, 4 text inputs, 1 textarea and 36 buttons, with 1 visible input. We injected a locally synthesised 618.1KB PNG and clicked "Generate". About four seconds later our capture recorded a 19.1KB WebP response and two new 359×269 JPEG images, which the original run classified as generated output. On review, the surrounding requests were `GET /_next/image?url=/images/photo-generator/fusion-before…` and `…/fusion-after…` plus Next.js route prefetches such as `/ai-photoshoot` and `/ai-image-combiner`. Those are the site's own before/after demonstration images and navigation assets, not a result derived from our upload. Both screenshots were saved.

## Verification status

**UNVERIFIED (downgraded from VERIFIED).** The original run marked this VERIFIED because the captured images exceeded the byte threshold. A source check shows they are marketing sample images served from the site's own static `/images/` path, so they are not evidence of generation. We explicitly retract the generation claim; a correct verdict requires capturing a response that can be tied to the uploaded input.

## FAQ

**Did the test generate a photo?**
We cannot say it did. The files we captured resolve to the site's `fusion-before` / `fusion-after` sample graphics, so they are not treated as generated output.

**Why was it originally marked verified?**
Our verifier counted any new image over 8KB as an artifact. Static landing-page images pass that test, which is why we now check the response URL as well as the byte count.

**Was the upload accepted?**
A synthetic PNG was injected into the file input and "Generate" was clicked. We observed no response that could be attributed to that specific file.

## Evidence

- `reports/evidence/photogenerai.com/01-landing.png`
- `reports/evidence/photogenerai.com/02-result.png`
- `reports/evidence/photogenerai.com/artifact-net-0.webp` (site sample image, not a verified output)
- `reports/evidence/photogenerai.com.json`
