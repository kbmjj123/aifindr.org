---
name: "Video Upscaler"
slug: "video-upscaler-ai-video-generator"
website: "https://videoupscaler.video"
category: "video"
pricing: "freemium"
short_description: "Video upscaling; captured PNGs were the site's before/after demo images."
meta_description: "Video Upscaler describes enhancing blurry footage to 4K or HD. Our captured large images were its before/after demonstration graphics."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

The site describes an online video upscaler that enhances blurry footage and upscales to 4K or HD, aimed at creators and restoration work.

## What we checked

- 1,310 visible words; pricing, terms, privacy, login, signup and docs links are present — the only entry in this batch combining login, signup and docs.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.
- No analytics ID and no external model-provider domain appeared in the static HTML.

## Hands-on run

The page exposed 1 file input and 33 buttons, with 0 visible text inputs. We injected a locally synthesised 618.1KB PNG and clicked "Get Started". Four seconds later the run captured two large PNGs (2.30MB and 1.92MB) and two page images at 1664×925 and 1654×931, which the original verifier treated as generated output. The surrounding requests were `GET /_next/image?url=/imgs/everyday-footage-before-after.png`, `…/anime-before-after.png` and Cloudflare RUM beacons. Those filenames identify the site's own before/after demonstration graphics, not a result derived from our upload. Both screenshots were saved.

## Verification status

**UNVERIFIED (downgraded from VERIFIED).** Large byte counts alone do not establish a generated result here: the captured URLs point to static demo assets under `/imgs/`. Clicking "Get Started" also looks like an onboarding step rather than a render action. We retract the generation claim; 4K/HD upscaling remains an unverified site claim.

## FAQ

**Was a video upscaled in the test?**
No. We supplied a PNG, not a video, and the captured images resolve to the site's before/after demo files. No video file was returned.

**Why were the images originally counted as output?**
The verifier accepted any new image above 8KB. Two multi-megabyte demo graphics pass that rule easily, which is exactly the false-positive pattern we now check by response URL.

**Is the 4K claim verified?**
No. No resolution measurement of any output was performed.

## Evidence

- `reports/evidence/videoupscaler.video/01-landing.png`
- `reports/evidence/videoupscaler.video/02-result.png`
- `reports/evidence/videoupscaler.video/artifact-net-0.png` (site demo image, not a verified output)
- `reports/evidence/videoupscaler.video.json`
