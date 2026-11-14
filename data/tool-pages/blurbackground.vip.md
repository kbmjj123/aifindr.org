---
name: "Blur Background"
slug: "blur-background-ai-image-generator"
website: "https://blurbackground.vip"
category: "image"
pricing: "freemium"
short_description: "Photo background blur; Remove photo click captured a sample placeholder."
meta_description: "Blur Background describes blurring photo backgrounds locally in the browser without sign-in. Our captured image was its sample placeholder."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

The site describes blurring background distractions in a single JPEG, PNG or WebP photo directly in the browser, with an adjustable effect, a comparison view and a download without signing in.

## What we checked

- 1,095 visible words and 14 links; pricing, terms, privacy and contact links are present.
- Google Analytics property `G-544B8ZCCL9` is in use. No external model-provider domain appeared in the static HTML.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.

## Hands-on run

The page exposed 1 file input and 29 buttons, with 0 visible text inputs. We injected a locally synthesised 618.1KB PNG, then clicked "Remove photo" — a control that deletes the uploaded file, not one that applies a blur. The run captured a 10.8KB 713×401 AVIF and a 525-byte text file. The text reads `EXAMPLE RESULT`, `Choose your photo to start`, `SAMPLE BLUR 50%` and `ADJUST`, which identifies the AVIF as the page's built-in sample placeholder. The only requests recorded were Clarity and Google Analytics beacons; no processing endpoint was called. Both screenshots were saved.

## Verification status

**UNVERIFIED (downgraded from VERIFIED).** Two independent problems: the clicked button removed our upload, and the captured image is a labelled example placeholder. There is no evidence a blur was ever applied to our file. We make no claim about the local-processing or no-watermark statements.

## FAQ

**Was our photo blurred?**
No. We clicked "Remove photo", which discards the upload, and the image we captured is the page's `EXAMPLE RESULT` placeholder.

**Does it really process locally in the browser?**
We observed no processing request, but we also never triggered a real blur. The claim remains untested either way.

**Why was this originally marked verified?**
A 10.8KB AVIF passed the byte threshold and a 525-byte text fragment passed the text threshold. Both were static UI content, which is the exact false-positive pattern now documented.

## Evidence

- `reports/evidence/blurbackground.vip/01-landing.png`
- `reports/evidence/blurbackground.vip/02-result.png`
- `reports/evidence/blurbackground.vip/artifact-0.avif` (sample placeholder, not a verified output)
- `reports/evidence/blurbackground.vip.json`
