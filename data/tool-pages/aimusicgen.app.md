---
name: "Aimusicgen"
slug: "aimusicgen-ai-audio-tool"
website: "https://aimusicgen.app"
category: "audio"
pricing: "freemium"
short_description: "Text-to-song service; our Generate click returned no audio or model call."
meta_description: "Aimusicgen describes turning text into songs with vocals and instrumentals. Our anonymous test clicked Generate but observed no audio output."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

Aimusicgen describes a free AI music generator that turns text into songs, including vocals, instrumentals and beats, with a download step. It also states that signing in is required for daily credits.

## What we checked

- 2,514 visible words and 14 links, making it one of the more text-heavy landing pages in this batch.
- Pricing, terms, privacy, contact and login links are present; Google Analytics property `G-LJ5HD62FSR` is in use.
- `robots.txt` is present with no blanket disallow; the terms page showed no detected restriction on automated access.
- No external model-provider domain was referenced in the static HTML.

## Hands-on run

The page had 0 file inputs, 1 text input, 1 textarea and 12 buttons, with 1 visible input. We filled the prompt field labelled "An uplifting indie" with a locally composed test phrase and clicked the button reading "Generate · 4 credits". During and after that click the only network activity we could attribute was a `GET /favicon.svg` on the site itself and `POST /collect` calls to Microsoft Clarity. No audio or video element appeared, no download link was added, no new large response body was captured, and no model provider was seen at the network layer. Both landing and post-click screenshots were saved.

## Verification status

**UNVERIFIED.** The generation button was pressed, which is further than many sites in this batch got, but no artifact came back. The button label itself mentions 4 credits, and the site says daily credits require sign-in; we did not register, so an unauthenticated quota gate is the most likely explanation — but that is an inference, not an observation. We therefore record "no output observed" without claiming the service fails.

## FAQ

**Was a song generated during the test?**
No. We clicked "Generate · 4 credits" and then polled for output; no audio file, player, download link or generated text appeared.

**Does it need an account?**
The site says daily credits come with signing in, and the button we clicked was labelled with a credit cost. We did not create an account, so we cannot confirm whether the missing output was due to that.

**What did the backend actually do?**
Only a favicon request and Clarity analytics beacons were recorded in our sample. We did not see a request to an external music-model provider.

## Evidence

- `reports/evidence/aimusicgen.app/01-landing.png`
- `reports/evidence/aimusicgen.app/02-result.png`
- `reports/evidence/aimusicgen.app.json`
