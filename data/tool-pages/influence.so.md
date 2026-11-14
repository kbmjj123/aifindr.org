---
name: "Influence"
slug: "influence-ai-marketing-tool"
website: "https://influence.so"
category: "marketing"
pricing: "paid"
short_description: "Brand-voice social scheduling; we stopped at a payment control."
meta_description: "Influence describes AI social posts in a brand voice with review, scheduling and publishing. We stopped at a detected payment control."
status: "pending"
data_source: "evidence_probe"
evidence_level: "BLOCKED_PAYWALL"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

Influence describes creating social posts in a brand's voice, then reviewing, scheduling and publishing them across connected accounts from one content calendar.

## What we checked

- 3,197 visible words, the largest landing page in this batch, with pricing, terms, privacy, contact, login and docs links all present.
- `robots.txt` is present and does not disallow all crawling. The terms page was fetched and contained no detected clause prohibiting automated access.
- No analytics ID and no external model-provider domain appeared in the static HTML.
- `robots.txt` permits crawling with no blanket disallow, and 3,197 words of visible copy make this a content-heavy landing page rather than a placeholder.

## Hands-on run

The page exposed 0 file inputs, 3 text inputs and 41 buttons, but 0 visible input fields. Before filling anything, our paywall detector found a payment-method control on the page. Our test policy forbids entering payment details, so we stopped immediately at that point. No field was filled, no button was clicked, no output was produced, and only the landing screenshot was saved.

## Verification status

**BLOCKED_PAYWALL.** This is a hard stop, not a failed test. We can confirm the public page renders and that a payment control is present, but we cannot say anything about post generation, brand-voice tuning or scheduling. The submission marks the tool as paid, which is consistent with what we saw.

## FAQ

**Why is there no hands-on result for this tool?**
Our test policy stops as soon as a payment field or credit-card control is detected. That happened on the landing page before any interaction.

**Did you test scheduling or connected accounts?**
No. Those capabilities appear only in the site's own description. Our run never reached an authenticated workspace.

**Is the page itself reachable?**
Yes. The landing page loaded, its terms and privacy pages are linked, and `robots.txt` permits crawling. The blocker is the payment requirement, not availability.

## Evidence

- `reports/evidence/influence.so/01-landing.png`
- `reports/evidence/influence.so.json`
