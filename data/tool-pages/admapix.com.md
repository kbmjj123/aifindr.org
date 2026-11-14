---
name: "AdMapix"
slug: "admapix-ai-marketing-tool"
website: "https://www.admapix.com"
category: "marketing"
pricing: "freemium"
short_description: "Ad search over 200M+ ads; our run stopped at a payment control."
meta_description: "AdMapix describes searching 200M+ ads and generating hosted research reports. We stopped before any interaction due to a payment control."
status: "pending"
data_source: "evidence_probe"
evidence_level: "BLOCKED_PAYWALL"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

AdMapix describes ad intelligence for growth teams: searching a library of more than 200 million ads and generating hosted research reports inside a web application.

## What we checked

- 928 visible words and 15 links — one of the shortest pages in this batch.
- Pricing, terms, privacy and contact links are present; no login or signup link was detected in the crawled links.
- Google Analytics property `G-LBQFRN4ZGK` and Google Ads ID `AW-18108021888` are present.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.

## Hands-on run

The page exposed 0 file inputs, 2 text inputs and 21 buttons, with 2 visible inputs. Our paywall detector matched the phrase "payment method" on the page before we filled anything. Under our no-payment policy the run stopped immediately: no field was filled, no button was clicked, no report was requested, and only the landing screenshot was saved.

## Verification status

**BLOCKED_PAYWALL.** We can confirm the page loads, exposes two text inputs and references payment. We cannot confirm the ad library size, the search behaviour or the hosted-report feature. Note the submission lists this tool as freemium while our detector found a payment-method control; the two are not necessarily contradictory, but we did not resolve which flow requires payment.

## FAQ

**Why is there no search result?**
Our policy stops on any payment-method or card control. The detector fired on the landing page before the first interaction.

**Was the 200M+ ads figure checked?**
No. It comes from the site's own description; we did not query the ad index.

**Is it free or paid?**
The submission says freemium. We observed a payment-method reference on the landing page but did not enter a paid flow, so the exact tier boundary is unverified.

## Evidence

- `reports/evidence/admapix.com/01-landing.png`
- `reports/evidence/admapix.com.json`
