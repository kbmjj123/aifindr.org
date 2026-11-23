---
name: "VocalSeparator"
slug: "vocal-separator-ai-audio-tool"
website: "https://vocalseparator.com"
category: "audio"
pricing: "freemium"
short_description: "Browser vocal/instrumental WAV split, no sign-up; our run checked availability, not the separation."
meta_description: "VocalSeparator promises two full-length WAV stems without sign-up. Our hands-on run uploaded a synthetic WAV but the clicked control only checked availability, so no separation result was observed."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-11-19"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

VocalSeparator describes a free browser vocal separator that returns two full-length WAV tracks — vocals and instrumental — for files up to 10 minutes and 100 MB, with no sign-up. Cloud processing uses private temporary storage and download links expire after 55 minutes. A "Four tracks" mode and a "Separate without uploading" option are also advertised.

## What we checked

- 2,540 visible words and 35 links; pricing, terms, privacy and contact pages are all present. No login or signup link was found, which agrees with the site's "no sign-up" claim.
- Google Analytics property `G-0VJPY6HCL9` is in use. No external model-provider domain appeared in the static HTML.
- `robots.txt` is present without a blanket disallow; the terms page fetched contained no detected ban on automated access.

## Hands-on run

The page exposed 1 file upload, 0 text inputs, 0 textareas and 15 buttons, with 0 visible text inputs. We injected a locally synthesised 258.4 KB WAV — generated on this machine, not a private recording — through the file input. The button our scorer then selected was "Check availability", a status enquiry rather than the separation action; the page's own "Choose audio file" dropzone and separation controls were not triggered. After 24 seconds no downloadable artifact, new audio player, result link or backend/model call had appeared, and the run ended on the same upload panel. Both screenshots were saved.

## Verification status

**UNVERIFIED.** This is a tooling miss rather than evidence that the service fails: we clicked a status control, so the separation path was never exercised. We do not claim the split works until a real separation action produces two audio artifacts. The site remains a strong re-test candidate — it claims no sign-up, has no login link, and accepted our WAV upload, so no registration gate is in the way. A future run should target the "Choose audio file" / separation control explicitly rather than relying on the generic button scorer.

## FAQ

**Did the test return vocals and instrumental tracks?**
No. We clicked "Check availability", not the separation control, so no split was attempted and no output was captured. Two tracks are what the site promises, not what we observed.

**Does it require an account?**
The site says no sign-up and we found no login or signup link. Our run did not encounter an account gate, but it also never reached the separation result.

**What was uploaded?**
A 258.4 KB synthetic WAV containing a voice-frequency tone and a silence segment, created locally for this test. No personal recording was uploaded.

## Evidence

- `reports/evidence/vocalseparator.com/01-landing.png`
- `reports/evidence/vocalseparator.com/02-result.png` (shows the upload panel and "Check availability" control)
- `reports/evidence/vocalseparator.com.json`
