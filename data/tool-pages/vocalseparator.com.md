---
name: "VocalSeparator"
slug: "vocal-separator-ai-audio-tool"
website: "https://vocalseparator.com"
category: "audio"
pricing: "free"
short_description: "No-signup vocal WAV split; our click hit Play Original, not the split."
meta_description: "VocalSeparator describes a free no-signup vocal separator returning two WAV tracks. Our run clicked a player control and did not observe a split."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

VocalSeparator describes a free vocal separator that returns both WAV tracks — vocals and instrumental — for files up to 10 minutes, with no sign-up and daily limits.

## What we checked

- 2,521 visible words, with pricing, terms, privacy and contact links. Notably there is no login or signup link, which agrees with the site's "no sign-up" claim.
- `robots.txt` is present without a blanket disallow, and the terms page showed no detected ban on automated access.
- No analytics ID and no external model-provider domain appeared in the static HTML.

## Hands-on run

The page exposed 1 file input and 12 buttons, with 0 visible text inputs. We injected a locally synthesised 258.4KB mono WAV — generated on our machine, not a private recording — through the file input. After the upload, a consent checkbox step was needed; we ticked the non-marketing confirmations. The button our scorer then selected was "Play Original", a player control rather than a separation action. After that click the only request we recorded was `GET /apple-icon.png` on the site itself. No new audio player, no download link and no separated tracks appeared. Both screenshots were saved.

## Verification status

**UNVERIFIED.** This is a tooling miss rather than evidence of a broken service: we clicked a playback control, so the separation path was never exercised. It is also the site in this batch most worth re-testing — the site claims no sign-up, has no login link, and accepted our WAV upload, so there is no registration gate in the way. We do not claim the split works until a real split action produces two audio artifacts.

## FAQ

**Did the test return vocals and instrumental tracks?**
No. We clicked "Play Original" and never observed a separation result or download. Two tracks are what the site promises, not what we captured.

**Does it require an account?**
The site says no sign-up, and we found no login or signup link on the page. That matches, though we did not complete an end-to-end run.

**What was uploaded?**
A 258.4KB synthetic WAV containing a voice-frequency tone and a silence segment, created locally specifically for this test. No personal recording was sent.

## Evidence

- `reports/evidence/vocalseparator.com/01-landing.png`
- `reports/evidence/vocalseparator.com/02-result.png`
- `reports/evidence/vocalseparator.com.json`
