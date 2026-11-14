---
name: "Hotel Lobby AI Studio"
slug: "hotel-lobby-ai-studio-ai-video-generator"
website: "https://hotellobbyaistudio.com"
category: "video"
pricing: "paid"
short_description: "$9.99 two-photo Hotel Lobby video; our run only reached draft PATCH requests."
meta_description: "Hotel Lobby AI Studio describes a $9.99 15-second two-photo lip-sync video. Our anonymous run reached draft saves but no video output."
status: "pending"
data_source: "evidence_probe"
evidence_level: "PARTIAL"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

The site describes making a 15-second "Hotel Lobby" style video from two photos, set in an orange booth and lip-synced to original audio. It quotes $9.99 with no subscription and promises a free retry if generation fails.

## What we checked

- 1,826 visible words and 10 links; pricing, terms, privacy, contact and login links are present.
- Google Tag Manager container `GTM-P3VT3NQD` is in use. No external model-provider domain appeared in the static HTML.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected automated-access ban.

## Hands-on run

The page exposed 2 file inputs and 18 buttons, with 0 visible text inputs — consistent with a two-photo workflow. We injected a locally synthesised 618.1KB PNG into the first input. Two non-marketing consent controls reading "I have permission to use these photos. They're deleted after 7 days." had to be confirmed before the UI would respond; our fallback text matcher ticked them. The button then selected was "Remove the left photo" — a removal control, not a generation action. Three `PATCH /api/draft` requests to the site's own backend were recorded, so real server-side state changes did occur. No video, image or download artifact was returned. Both screenshots were saved.

## Verification status

**PARTIAL.** We have evidence of genuine backend activity (`PATCH /api/draft` ×3), but not of a generated video: the click removed a photo rather than submitting a job, and only one of the two required photos was supplied. The $9.99 price also falls under our no-payment policy. We therefore record "backend reached, output not obtained" and do not describe the video as verified.

## FAQ

**Was a Hotel Lobby video generated?**
No. No video file, player or download link was captured. Three `PATCH /api/draft` calls show the editor saved state, which is not the same as a render.

**Why only partial evidence?**
The test supplied one photo to a two-photo form and clicked a removal control. Combined with the $9.99 payment step, the run never reached generation.

**Is the free retry real?**
That is the site's claim. We did not pay or trigger a failed generation, so it is unverified.

## Evidence

- `reports/evidence/hotellobbyaistudio.com/01-landing.png`
- `reports/evidence/hotellobbyaistudio.com/02-result.png`
- `reports/evidence/hotellobbyaistudio.com.json`
