---
name: "Citelift"
slug: "citelift-ai-marketing-tool"
website: "https://citelift.app/"
category: "marketing"
pricing: "paid"
short_description: "Shopify AI visibility tool; captured images were landing illustrations."
meta_description: "Citelift describes turning Shopify products into articles and tracking AI visibility. Our captured images were its own landing-page artwork."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

Citelift describes turning Shopify products into helpful articles that shoppers can find, then writing, publishing and tracking AI visibility and attributed orders. Its page title targets SEO for Shopify and discovery inside AI answers.

## What we checked

- 2,736 visible words and 114 links; pricing, terms, privacy, contact, login and signup links are all present.
- Google Analytics property `G-ZGYY4LTB49` and Google Ads ID `AW-624374935` are present — the only entry in this batch carrying both.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.

## Hands-on run

The page had 0 file inputs, 2 text inputs and 20 buttons, with 2 visible inputs. Both fields were labelled with a `yourstore.com` placeholder; we filled them with a synthetic example URL and clicked the control reading "Coffee". The run then captured a 16.0KB WebP, a 9.8KB WebP and a 38.7KB 960×640 WebP, which the original verifier counted as output. The associated requests are `GET /art/landing-v7/cat-sheets.webp`, `cat-leggings.webp` and `life-coffee.webp` — landing-page illustrations keyed to the "Coffee" example category, not a report generated from our URL. Both screenshots were saved.

## Verification status

**UNVERIFIED (downgraded from VERIFIED).** The clicked control was an example-category button and the captured bytes are static `/art/landing-v7/` artwork. No article, visibility report or attributed-order data came back. We retract the generation claim; the "AI visibility" capabilities remain the site's own description.

## FAQ

**Did the check produce a visibility report?**
No. We captured three landing-page WebP illustrations. No article text or report response was observed.

**Why click "Coffee"?**
Our button scorer chose it as the highest-ranked visible control. On review it is an example-category selector, which is a known weakness of scoring buttons purely by wording and position.

**Is the Shopify integration verified?**
No. We entered a synthetic example URL, not a real store, and did not connect any shop.

## Evidence

- `reports/evidence/citelift.app/01-landing.png`
- `reports/evidence/citelift.app/02-result.png`
- `reports/evidence/citelift.app/artifact-net-0.webp` (landing illustration, not a verified output)
- `reports/evidence/citelift.app.json`
