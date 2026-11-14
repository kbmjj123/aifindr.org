---
name: "Image Describer"
slug: "image-describer-ai-image-generator"
website: "https://imagedescriber.dev/"
category: "image"
pricing: "freemium"
short_description: "Image descriptions and alt text; captured text was a UI label, not a result."
meta_description: "Image Describer describes generating descriptions, prompts and alt text without login. Our captured text was UI label copy rather than a description."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

The site describes describing image content in seconds, generating descriptions, prompts and alt text, and says it can be tried free without logging in.

## What we checked

- 1,423 visible words; pricing, terms, privacy and contact links are present, with no login or signup link — consistent with its no-login claim.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.
- No analytics ID and no external model-provider domain appeared in the static HTML.

## Hands-on run

The page exposed 1 file input, 1 text input and 38 buttons, with 1 visible input. We injected a locally synthesised 618.1KB PNG and clicked "Start Analysis". This is one of the few runs where a plausible API path was hit: `POST /api/images/analyze-access` and `POST /api/images/uploads/temp` on the site's own domain, alongside analytics beacons. The verifier then saved a 221-byte text file as the "generated result". On review its contents are `Analysis Results JSON CSV TXT MD HTML Ready-to-use formats Generate Description` — the results panel's format tabs and button labels, not a description of our image. Both screenshots were saved.

## Verification status

**UNVERIFIED (downgraded from VERIFIED).** The backend calls show an analysis flow was entered, which is real evidence of interaction, but the captured text is interface chrome rather than output. Our text check required 120+ characters and this UI fragment cleared that bar. We retract the claim that a description was produced; the no-login access path is the most promising part of this entry for a retest.

## FAQ

**Did the tool describe our test image?**
No. The 221-byte text we captured is a list of export-format tabs and a button label, not a description.

**Did any real API call happen?**
Yes — `POST /api/images/analyze-access` and `POST /api/images/uploads/temp` were recorded after "Start Analysis". That is why the interaction itself is documented, even though the output is not verified.

**Is the no-login claim consistent with what we saw?**
Yes. We found no login or signup link, and we reached the analysis endpoints without registering.

## Evidence

- `reports/evidence/imagedescriber.dev/01-landing.png`
- `reports/evidence/imagedescriber.dev/02-result.png`
- `reports/evidence/imagedescriber.dev/artifact-text-0.txt` (UI label copy, not a verified description)
- `reports/evidence/imagedescriber.dev.json`
