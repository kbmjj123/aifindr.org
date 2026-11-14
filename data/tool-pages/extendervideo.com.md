---
name: "AI Video Extender"
slug: "ai-video-extender-ai-video-generator"
website: "https://extendervideo.com"
category: "video"
pricing: "freemium"
short_description: "Extends a 6s clip to 12s; we found no clear generation button."
meta_description: "AI Video Extender describes generating 6-second 480p clips and extending them to 12 seconds. We could not reach a generation action anonymously."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

The site describes generating a 6-second 480p AI video, or extending an existing AI video to 12 seconds. It states that one action is consumed per generation or extension, and that the first action is free with a verified email address.

## What we checked

- 683 visible words and 13 links on the landing page.
- Pricing, terms, privacy, contact and login links are all present, which is a fuller set of supporting pages than most sites in this batch.
- One Google Analytics property (`G-74F7RCKW50`) is present. No external model-provider domain appeared in the HTML.
- `robots.txt` exists without a blanket disallow, and the terms page contained no detected ban on automated access.

## Hands-on run

The page exposed 1 file input, 1 textarea and 15 buttons, with 1 visible input. We injected a locally synthesised 618.1KB PNG through the file input — never a private file. After the upload the page re-scored its buttons, but the highest-scoring candidate was "Prompt tips" at 6 points, below the 10-point threshold required to consider it a main action. We deliberately did not click an ambiguous control, so the run stopped before generation. No output file, no download link and no model call were observed. Only the landing screenshot is available.

## Verification status

**UNVERIFIED.** Two separate reasons keep this unverified: we did not identify a reliable generation button, and the site's own description says the first free action requires a verified email, which conflicts with our no-registration test policy. Neither says the tool is broken; they describe the limit of an anonymous test.

## FAQ

**Did the extension actually produce a 12-second video?**
No. We stopped at button selection and never observed a video, a download, or a generation request. The 6s/12s figures are from the site's description.

**Why did the test stop after the upload?**
Our button scorer only accepts a clear main action. The best candidate on this page was a "Prompt tips" control, so clicking it would not have been a genuine generation attempt.

**Is the first action free?**
The site says yes, once an email is verified. We did not create an account, so we cannot confirm the quota, the 480p specification or the credit rules.

## Evidence

- `reports/evidence/extendervideo.com/01-landing.png`
- `reports/evidence/extendervideo.com.json`
