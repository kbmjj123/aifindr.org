---
name: "Manga Translator AI"
slug: "manga-translator-ai-ai-image-generator"
website: "https://www.mangatranslate.com/ko/ai-manga-translator/"
category: "image"
pricing: "freemium"
short_description: "Korean manga image translator; 191 buttons hid the main action."
meta_description: "Manga Translator describes recognising and translating lettering in manga images. Our test uploaded an image but found no clear Korean-language CTA."
status: "pending"
data_source: "evidence_probe"
evidence_level: "UNVERIFIED"
last_verified: "2026-10-29"
---

## What the site says

> The following is the site's own description (in Korean). It has not been verified by us.

사이트 설명에 따르면 이 도구는 만화 이미지의 글자를 인식하고 대사를 번역해 검토용 이미지를 만듭니다. 이미지 한 장을 업로드하면 번역을 시작할 수 있다고 합니다. In English: it recognises text in manga images, translates the dialogue and produces an image for review, starting from a single uploaded image.

## What we checked

- 1,401 visible words and 38 links on the Korean-language `/ko/ai-manga-translator/` page.
- Pricing, terms, privacy, contact and login links are present; Google Analytics property `G-183ZB6GY44` is in use.
- `robots.txt` is present with no blanket disallow, and the terms page showed no detected ban on automated access.
- No external model-provider domain appeared in the static HTML.

## Hands-on run

The page exposed 1 file input, 2 text inputs, 1 textarea and **191 buttons**, with 0 visible input fields — by far the most crowded control surface in this batch. We injected a locally synthesised 618.1KB PNG through the file input. When buttons were re-scored after the upload, the best candidate was "번역기 자동" at 6 points, below our 10-point threshold for an unambiguous main action. Because the interface is Korean and the action words our scorer recognises are English, we did not guess at a button. No generation request or translated image was observed, and only the landing screenshot is available.

## Verification status

**UNVERIFIED.** The blocker here is localisation and control density, not a proven failure: 191 clickable elements and Korean CTA labels defeated an English keyword-based button scorer. We make no claim about translation quality or output format. A Korean-language action map would be needed before this site can be tested fairly.

## FAQ

**Was a translated page produced?**
No. We uploaded a synthetic PNG but never clicked a confirmed translation action, so no output image was captured.

**Why did the automated test stop?**
The highest-scoring button was "번역기 자동" at 6 points against a 10-point threshold. Our scorer matches English action words, so it could not confidently identify the Korean CTA among 191 candidates.

**Which language is the tool in?**
The page we tested is the Korean `/ko/` route. The site description and button labels are in Korean.

## Evidence

- `reports/evidence/mangatranslate.com/01-landing.png`
- `reports/evidence/mangatranslate.com.json`
