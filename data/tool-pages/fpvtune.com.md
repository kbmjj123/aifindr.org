---
name: "FPVTune"
slug: "fpvtune-ai-coding-tool"
website: "https://fpvtune.com/"
category: "code"
pricing: "freemium"
short_description: "Drone PID tuning from blackbox logs; we uploaded the wrong file type."
meta_description: "FPVTune describes neural-network PID tuning from Betaflight blackbox logs. Our synthetic PNG upload could not exercise a log-based workflow."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

FPVTune describes automated FPV drone PID tuning: uploading a Betaflight blackbox log and receiving neural-network-optimised PID and filter settings in seconds, with payment only if the result is satisfactory.

## What we checked

- 1,084 visible words and 16 links; pricing, terms, privacy and contact links are present.
- Google Analytics property `G-R1FDJM2H4C` is in use. No external model-provider domain appeared in the static HTML.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.

## Hands-on run

No file input was visible at first inspection (0 file inputs, 0 text inputs, 0 textareas, 13 buttons). Our upload fallback clicked an element matching `[class*=upload]`, which caused a hidden file input to appear; we then injected a locally synthesised 618.1KB PNG through it. When buttons were re-scored, no candidate reached the threshold — the log records the top button as none. No tuning request, PID output or download was observed, and only the landing screenshot is available.

## Verification status

**UNVERIFIED.** This is a fixture mismatch: FPVTune expects a Betaflight blackbox log, while our generic harness only produces PNG and WAV test files. Uploading an image to a log parser cannot produce a meaningful result. We therefore make no claim about the tuning quality or the pay-only-if-satisfied model. A fair retest needs a synthetic blackbox log fixture.

## FAQ

**Did the test return PID settings?**
No. We uploaded a PNG, not a blackbox log, and no submit action was identified.

**Why did the upload still succeed?**
The page revealed a hidden file input after our fallback clicked an upload-styled element. Our harness injects files into any file input it finds, regardless of the expected format.

**Is the pay-when-satisfied model confirmed?**
No. That is the site's description; we never reached a result or a payment step.

## Evidence

- `reports/evidence/fpvtune.com/01-landing.png`
- `reports/evidence/fpvtune.com.json`
