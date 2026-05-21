-- aifindr.org — 本地开发种子数据
-- 要求：已执行 schema/init.sql 建表

-- ─── Dev 用户（匹配 /api/auth/dev-login 的 github_id=12345678）────

INSERT OR IGNORE INTO users (github_id, username, email, avatar_url, contact_email, email_verified, email_notify)
VALUES (12345678, 'dev-user', 'dev@example.com', '', 'dev@example.com', 1, 1);

-- ─── Image & Design ──────────────────────────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, cover_image, og_image, featured, verified, editor_pick, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('midjourney', 'Midjourney', 'image', 'https://midjourney.com', 'paid', 10, 'Basic $10/mo, Standard $30/mo, Pro $60/mo', 0, 'web,discord', 'active', '2022-07', 'Midjourney is a powerful AI image generation tool that creates stunning visuals from text descriptions.', 'https://r2.aifindr.org/tools/image/midjourney/cover.webp', 'https://r2.aifindr.org/tools/image/midjourney/og.webp', 1, 1, 0, 'https://midjourney.com', 'midjourney-team', NULL, '2026-04-01');

INSERT INTO tool_tags (tool_id, tag) VALUES (1, 'image-generation'), (1, 'ai-art'), (1, 'text-to-image');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('dalle', 'DALL·E', 'image', 'https://openai.com/dall-e-3', 'paid', 20, 'Usage-based via OpenAI API. ChatGPT Plus includes limited generation.', 1, 'web,api', 'active', '2024-10', 'DALL·E 3 is OpenAI''s latest image generation model, natively integrated with ChatGPT.', 0, 1, 'https://openai.com', 'openai', NULL, '2026-04-02');

INSERT INTO tool_tags (tool_id, tag) VALUES (2, 'image-generation'), (2, 'openai'), (2, 'text-to-image');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('canva', 'Canva', 'image', 'https://canva.com', 'freemium', 0, 'Free tier. Pro $12.99/mo, Teams $14.99/mo.', 1, 'web,mobile,desktop', 'active', '2023-08', 'Canva is a graphic design platform with built-in AI tools for creating content.', 0, 1, 'https://canva.com', 'canva-team', NULL, '2026-04-03');

INSERT INTO tool_tags (tool_id, tag) VALUES (3, 'design'), (3, 'graphic-design'), (3, 'presentation');

-- ─── Writing & Content ───────────────────────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('chatgpt', 'ChatGPT', 'writing', 'https://chat.openai.com', 'freemium', 0, 'Free tier. Plus $20/mo, Pro $200/mo.', 1, 'web,mobile,api', 'active', '2022-11', 'ChatGPT is OpenAI''s flagship conversational AI for writing, coding, and analysis.', 1, 1, 'https://openai.com', 'openai', NULL, '2026-04-01');

INSERT INTO tool_tags (tool_id, tag) VALUES (4, 'chat'), (4, 'writing'), (4, 'openai'), (4, 'productivity');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('claude', 'Claude', 'writing', 'https://claude.ai', 'freemium', 0, 'Free tier. Pro $20/mo, Team $25/mo.', 1, 'web,mobile,api', 'active', '2025-03', 'Claude is an AI assistant by Anthropic focused on safety and long-form content creation.', 1, 1, 'https://anthropic.com', 'anthropic', NULL, '2026-04-02');

INSERT INTO tool_tags (tool_id, tag) VALUES (5, 'chat'), (5, 'writing'), (5, 'anthropic'), (5, 'reasoning');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('grammarly', 'Grammarly', 'writing', 'https://grammarly.com', 'freemium', 0, 'Free tier. Premium $12/mo, Business $15/mo.', 1, 'web,mobile,desktop,api', 'active', '2024-06', 'Grammarly is an AI writing assistant for clear, correct communication.', 0, 1, 'https://grammarly.com', 'grammarly', NULL, '2026-04-05');

INSERT INTO tool_tags (tool_id, tag) VALUES (6, 'writing'), (6, 'grammar'), (6, 'productivity');

-- ─── Code & Developer ────────────────────────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('cursor', 'Cursor', 'code', 'https://cursor.sh', 'paid', 20, 'Free tier limited. Pro $20/mo, Business $40/mo.', 1, 'desktop', 'active', '2024-01', 'Cursor is an AI-first code editor built on VS Code for faster development.', 0, 1, 'https://cursor.sh', 'cursor-team', NULL, '2026-04-03');

INSERT INTO tool_tags (tool_id, tag) VALUES (7, 'code-generation'), (7, 'ide'), (7, 'ai-editor');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('github-copilot', 'GitHub Copilot', 'code', 'https://github.com/features/copilot', 'paid', 10, 'Individual $10/mo, Business $19/mo, Enterprise $39/mo.', 1, 'web,desktop,api', 'active', '2024-06', 'GitHub Copilot is an AI pair programmer with autocomplete-style code suggestions.', 0, 1, 'https://github.com', 'github', NULL, '2026-04-04');

INSERT INTO tool_tags (tool_id, tag) VALUES (8, 'code-generation'), (8, 'github'), (8, 'autocomplete');

-- ─── Video ───────────────────────────────────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('runway', 'Runway', 'video', 'https://runwayml.com', 'paid', 15, 'Standard $15/mo, Pro $35/mo, Unlimited $95/mo.', 1, 'web', 'active', '2024-03', 'Runway is a web-based AI video editing platform with generation and motion tracking.', 0, 1, 'https://runwayml.com', 'runway-team', NULL, '2026-04-06');

INSERT INTO tool_tags (tool_id, tag) VALUES (9, 'video-generation'), (9, 'video-editing'), (9, 'motion-tracking');

-- ─── Research ────────────────────────────────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('perplexity', 'Perplexity', 'research', 'https://perplexity.ai', 'freemium', 0, 'Free tier. Pro $20/mo.', 1, 'web,mobile', 'active', '2024-12', 'Perplexity is an AI-powered answer engine with real-time cited sources.', 0, 1, 'https://perplexity.ai', 'perplexity-team', NULL, '2026-04-07');

INSERT INTO tool_tags (tool_id, tag) VALUES (10, 'search'), (10, 'research'), (10, 'answer-engine');

-- ─── Productivity ────────────────────────────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('notion-ai', 'Notion AI', 'productivity', 'https://notion.so', 'freemium', 0, 'Free tier. Plus $10/mo, AI add-on $10/mo.', 1, 'web,mobile,desktop', 'active', '2024-02', 'Notion is an all-in-one workspace with integrated AI for writing and brainstorming.', 0, 1, 'https://notion.so', 'notion-team', NULL, '2026-04-08');

INSERT INTO tool_tags (tool_id, tag) VALUES (11, 'productivity'), (11, 'notes'), (11, 'writing'), (11, 'workspace');

-- ─── Audio ───────────────────────────────────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('elevenlabs', 'ElevenLabs', 'audio', 'https://elevenlabs.io', 'freemium', 0, 'Free tier limited. Pro $5/mo, Pro+ $22/mo.', 1, 'web,api', 'active', '2024-01', 'ElevenLabs offers ultra-realistic AI text-to-speech and voice cloning.', 0, 1, 'https://elevenlabs.io', 'elevenlabs-team', NULL, '2026-04-09');

INSERT INTO tool_tags (tool_id, tag) VALUES (12, 'text-to-speech'), (12, 'voice'), (12, 'audio');

-- ─── Stability AI（完整 Demo + 图片 + 视频）───────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, cover_image, og_image, featured, verified, editor_pick, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('stability-ai', 'Stability AI', 'image', 'https://stability.ai', 'freemium', 0, 'Free tier. Pro $20/mo, Enterprise custom.', 1, 'web,api,discord,mobile', 'active', '2022-08', 'Stability AI creates Stable Diffusion, the open-source image generation model.', 'https://r2.aifindr.org/tools/image/stability-ai/cover.webp', 'https://r2.aifindr.org/tools/image/stability-ai/og.webp', 1, 1, 1, 'https://stability.ai', 'stability-team', NULL, '2026-04-15');

INSERT INTO tool_tags (tool_id, tag) VALUES (13, 'image-generation'), (13, 'ai-art'), (13, 'text-to-image'), (13, 'stable-diffusion'), (13, 'open-source'), (13, 'video-generation'), (13, '3d-modeling');

INSERT INTO tool_images (tool_id, url, alt, caption, sort_order, image_type)
VALUES (13, 'https://r2.aifindr.org/tools/image/stability-ai/screenshot-01.webp', 'Stable Diffusion 3 prompt interface', 'SD3 delivers photorealistic text rendering', 0, 'screenshot');

INSERT INTO tool_images (tool_id, url, alt, caption, sort_order, image_type)
VALUES (13, 'https://r2.aifindr.org/tools/image/stability-ai/screenshot-02.webp', 'Stable Video Diffusion', 'Generate videos from still images', 1, 'screenshot');

INSERT INTO tool_videos (tool_id, url, platform, video_id, title, video_type, duration)
VALUES (13, 'https://www.youtube.com/watch?v=dYJnUT4xO2I', 'youtube', 'dYJnUT4xO2I', 'Stable Diffusion 3 — Full Demo & Review', 'demo', 845);

UPDATE tools SET body = '## What is Stability AI?

Stability AI is the company behind **Stable Diffusion**, the most popular open-source image generation model. Their models power thousands of applications globally.

## Key Features

- **Stable Diffusion 3**: Photorealistic output, accurate text rendering, multi-prompt support
- **Stable Video Diffusion**: Transform images into short video clips
- **3D Model Generation**: Generate textured 3D meshes from text or images
- **API & Platform**: RESTful API, web playground, Discord bot, mobile apps

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 25 generations/day, standard resolution |
| Pro | $20/mo | 500 generations/month, commercial license |
| Enterprise | Custom | Unlimited API, dedicated compute, SLA |

## Pros & Cons

✅ Open-source, runs locally, active community, multi-modal
❌ Needs high-end GPU, quality depends on prompt skill

## Who Is It For?

Developers, researchers, and content creators who want open AI image generation without vendor lock-in.'
WHERE slug = 'stability-ai';

-- ─── Pending 状态（用于测试管理员审核流程）────────────────────────

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('test-tool-pending', 'TestTool Pending', 'code', 'https://testtool.example.com', 'freemium', 0, 'Free tier available.', 1, 'web', 'pending', '2026-05', 'A test tool awaiting review — use to verify the admin flow.', 'https://submitter.example.com', 'dev-user', 1, '2026-05-10');

INSERT INTO tool_tags (tool_id, tag) VALUES (14, 'testing'), (14, 'dev');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('ai-writer-pro', 'AI Writer Pro', 'writing', 'https://aiwriterpro.example.com', 'paid', 29, 'Pro $29/mo, Enterprise $99/mo.', 1, 'web,api', 'pending', '2026-04', 'An advanced AI writing tool for long-form content with SEO optimization.', 'https://writer-site.com', 'dev-user', 1, '2026-04-28');

INSERT INTO tool_tags (tool_id, tag) VALUES (15, 'writing'), (15, 'seo'), (15, 'content');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, submitter_site, submitter_github, submitter_id, submitted_at)
VALUES ('renderai', 'RenderAI', 'image', 'https://renderai.example.com', 'paid', 15, 'Starter $15/mo, Pro $40/mo.', 0, 'web', 'pending', '2026-05', 'Cloud-based 3D rendering with AI upscaling and texture generation.', 'https://renderai.example.com', 'dev-user', 1, '2026-05-01');

INSERT INTO tool_tags (tool_id, tag) VALUES (16, '3d-rendering'), (16, 'image-generation');
