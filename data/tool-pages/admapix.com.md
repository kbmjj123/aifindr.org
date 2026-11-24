---
name: "AdMapix"
slug: "admapix-ai-marketing-tool"
website: "https://www.admapix.com"
category: "marketing"
pricing: "freemium"
short_description: "Find competitor ads across channels and turn creative patterns into briefs"
meta_description: "Research competitor ads on Meta, TikTok and Google, spot winning hooks and offers, and generate ad scripts and UGC briefs from creative insights."
status: "pending"
data_source: "evidence_probe"
evidence_level: "BLOCKED_PAYWALL"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

AdMapix describes itself as an ad creative intelligence platform for game studios, AI app teams and ecommerce growth teams. It claims to index 200M+ ads across 170+ market labels and 100+ channels, to let users search image, video, playable and landing-page ad records by app, advertiser, keyword, country, channel, format and launch window, and to produce cited multi-page research reports, creative-pattern analysis, scripts and UGC briefs from a hosted "Deep Research" workflow. It also claims a separate ClawHub Agent Skill that returns structured ad, app, ranking, download, revenue and market data to Claude, Codex, OpenClaw and compatible agents, and 30 lifetime free credits for new accounts with no payment method required. None of these figures or workflow descriptions were verified by our own run. The homepage itself labels parts of its display "Simulated product flow", "Demo dataset", "Interactive preview · no credits used" and "Impression figures are estimates"; those demo elements are not treated as evidence.

## What we checked

Local evidence probe (2026-10-29, `reports/evidence/admapix.com.json`):

- 928 visible words and 15 links — one of the shortest pages in this batch.
- Pricing, terms, privacy and contact links were detected in the crawled links; no login or signup link was detected. The public web research (2026-11-23) could not retrieve a standalone `/contact` page, so the only public contact channel confirmed is `support@admapix.com` in the terms and privacy documents.
- Google Analytics property `G-LBQFRN4ZGK` and Google Ads ID `AW-18108021888` were present in the crawled page; the separate research session did not inspect page source, so these come from L2 only.
- `robots.txt` is present without a blanket disallow, and the terms page contained no detected ban on automated access.

Public web research added 2026-11-23 (supplementary, **not** local verification):

- A public pricing page exists (`/pricing`) with Free / Starter / Pro / Enterprise tiers and 30 / 300 / 2,000 / 4,000 monthly credits. Its displayed prices conflict with the vendor's own `/plans` and methodology page and with G2: `/pricing` showed $9.90 / $49.90 / $89.90 per month, `/plans` and the methodology page showed $19.90 Starter (with annual $94.80 / $478.80 / $862.80), and G2 listed $13.90 / $69.90 / $119.90 as "Pricing provided by AdMapix". A human editor must re-check the live pricing page before any figures are entered into `price_tiers`.
- The vendor's methodology page (v1.1, 2026-08-11) states prices are in USD, that one credit cannot be uniformly read as one search, that no publicly verified hourly SLA exists, and that 231 unique media labels are not the same as distinct ad networks.
- Terms: names MIAOZHIAI PTE. LTD., registered in Singapore, governed by Singapore law with exclusive jurisdiction of Singapore courts; material changes take effect 30 days after notice; "as is" clause and liability capped at fees paid in the preceding 12 months; ad intelligence data "may be incomplete or delayed". Privacy: `support@admapix.com` for deletion requests, uploaded media stored in Cloudflare R2, Meta Pixel / Conversions API references, 30-day notice for policy changes. Neither document carries an effective/last-updated date.
- Disclaimers found: "Impression figures are estimates" (homepage); "Download/revenue figures are third-party estimates, not official data" and a creative-search `page_size` cap of 10 (ClawHub Skill docs); "public API currently supports creative material and product query endpoints only" (FAQ and pricing).
- The vendor's public FAQ contains product questions; no independent People Also Ask set, Reddit thread or G2 user question was retrievable. G2 shows 0 reviews and "AdMapix hasn't been reviewed yet"; a Product Hunt mirror records 3 upvotes and 1 maker comment.
- Third-party directory listings describe watch-outs (estimated spend/impression figures, thinner coverage outside games / AI apps / ecommerce, a low Starter cap that pushes regular users to Pro) and name alternatives including Vidmob, AdSpy, Pipiads, Sensor Tower, Pathmatics, BigSpy and SpyFu. The vendor's own comparison hub names Sensor Tower, Pathmatics, BigSpy, AppMagic, SpyFu, Semrush, Similarweb, AdSpy, Minea, Segwise, Motion, Foreplay Lens and CreativeX, with first-party disclosure. All of these are names or opinions appearing in public pages, not verified feature comparisons.

## Hands-on run

The L3 run opened the homepage with local headless Chrome on 2026-10-29. The page exposed 0 file inputs, 2 text inputs and 21 buttons, with 2 visible inputs. Our paywall detector matched the phrase "payment method" on the page before anything was filled. Under the no-payment policy the run stopped immediately: no field was filled, no button was clicked, no search or report was requested, and only `01-landing.png` was saved. Consequently the 200M+ ads figure was never queried, the ad-index search behaviour and hosted-report feature were never exercised, and the free/paid boundary remains unresolved — the submission labels the tool freemium, while the detector found a payment-method reference; a public pricing page does exist, but its figures conflict across sources as noted above.

## Verification status

**BLOCKED_PAYWALL.** We can confirm the page loads, exposes two text inputs and references a payment method; we cannot confirm the ad library size, search behaviour, report generation, credit consumption or the Agent Skill output. A separate public-research pass added pricing conflicts, legal entity, FAQ sources and third-party observations, but public text is not behaviour and does not upgrade this status. The three process notes that appeared in an earlier draft's FAQ ("why no search result", "was the 200M+ figure checked", "is it free or paid") are now recorded in the section above; none of them is a user-sourced FAQ question. Before entry, a human editor must confirm the live pricing figures — `price_tiers` is intentionally omitted here and must not be filled from the conflicting web sources. `sub_category` should be `competitor-analysis`.

## FAQ

The following questions come from the vendor's own public FAQ (`https://www.admapix.com/faq`); no independent People Also Ask, Reddit or G2 user questions were retrievable, and none is invented here.

- What is AdMapix? — https://www.admapix.com/faq
- How is AdMapix different from SpyFu or Pathmatics? — https://www.admapix.com/faq
- What ad platforms does AdMapix cover? — https://www.admapix.com/faq
- Does AdMapix offer a free plan? — https://www.admapix.com/faq
- Can I use AdMapix with Claude or other AI assistants? — https://www.admapix.com/faq

## Evidence

Local evidence (primary, 2026-10-29):

- `reports/evidence/admapix.com/01-landing.png`
- `reports/evidence/admapix.com.json` (verdict BLOCKED_PAYWALL, 6s run)

Public sources (supplementary research, 2026-11-23; not local verification):

- https://www.admapix.com/ — positioning, 200M+/170+/100+ claims, 30-credit offer, demo/estimate disclaimers
- https://www.admapix.com/pricing — tier names, credit allowances, displayed $9.90/$49.90/$89.90
- https://www.admapix.com/plans and http://www.admapix.com/zh/methodology — conflicting $19.90 Starter, annual prices, credit/SLA/media-label caveats
- https://www.admapix.com/faq — six-question public FAQ, free-plan statement, media-label caveat
- https://www.admapix.com/terms and https://www.admapix.com/privacy — Singapore entity and law, "as is" clause, contact email, data-handling statements
- https://clawhub.ai/fly0pants/skills/admapix?version=1.0.28 — Skill documentation, third-party-estimate warning, `page_size` cap
- https://www.g2.com/products/admapix/reviews — 0 reviews; conflicting prices labelled "Pricing provided by AdMapix"
- https://www.thereisanaiforyou.com/tool/admapix and https://saasbrowser.com/en/saas/1761083/admapix — third-party watch-outs and alternative names
