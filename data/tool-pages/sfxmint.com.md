---
name: "SFXMint"
slug: "sfxmint-ai-audio-tool"
website: "https://sfxmint.com/studio"
category: "audio"
pricing: "freemium"
short_description: "Game sound effects from text; AI Enhance returned only analytics beacons."
meta_description: "SFXMint describes turning text into four comparable sound-effect takes. Our anonymous test produced no audio artifact or model call."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

SFXMint describes a sound-effect generator for games that turns a text description into four takes to compare and adjust. It says generating and previewing is free, while HD downloads require credits or a plan.

## What we checked

- 675 visible words and 36 links on the studio page — a comparatively compact page with a wide link footprint.
- Pricing, terms, privacy, contact, login and docs links are all present; this is the only site in the batch with a docs link alongside a login link.
- Google Analytics property `G-2EG5ZQR6Y0` is in use. No external model-provider domain appeared in the HTML.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected automated-access ban.
- The submitted URL carried `utm_source=aifindr`, `utm_medium=referral` and `utm_campaign=studio_launch` parameters, so the entry point we tested was a campaign-tagged studio link rather than the bare domain.

## Hands-on run

We found 0 file inputs, 1 text input, 1 textarea and 24 buttons, with 2 visible inputs. Two fields — one labelled "One short attack r…" and a second "Search a sound, or…" — were filled with locally composed text, and we clicked "AI Enhance". After the click the only request we captured was a `POST /g/collect` analytics beacon to Google Analytics. No audio player, download link, new media response or external synthesis endpoint was observed. Both screenshots were saved.

## Verification status

**UNVERIFIED.** A real action button was pressed, but no sound artifact came back and no model call was visible at the network layer. Because the site says HD downloads are credit-gated and links to a login page, an unauthenticated gate is plausible, but we did not register and therefore do not assert a cause. The four-takes claim and the HD-download rule remain the site's own statements.

## FAQ

**Did the test produce four sound-effect takes?**
No. No audio element, download link or media response appeared after "AI Enhance" was clicked.

**Why is the studio URL unusual?**
The submitted address included UTM parameters naming aifindr as the referral source and a `studio_launch` campaign. We tested that exact URL rather than the plain domain.

**Is generation free?**
The site says generation and preview are free and that HD downloads need credits or a plan. We did not reach a download step, so this is unverified.

## Evidence

- `reports/evidence/sfxmint.com/01-landing.png`
- `reports/evidence/sfxmint.com/02-result.png`
- `reports/evidence/sfxmint.com.json`
