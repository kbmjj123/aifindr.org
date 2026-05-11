-- aifindr.org — 本地开发种子数据

-- ── Image & Design ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('midjourney', 'Midjourney', 'image', 'https://midjourney.com', 'paid', 10, 'Basic $10/mo, Standard $30/mo, Pro $60/mo', 0, 'web,discord', 'active', '2022-07', 'Midjourney is a powerful AI image generation tool that creates stunning visuals from text descriptions. Known for its artistic quality and vibrant community.', 1, 1, '2026-04-01');

INSERT INTO tool_tags (tool_id, tag) VALUES (1, 'image-generation'), (1, 'ai-art'), (1, 'text-to-image');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('dalle', 'DALL·E', 'image', 'https://openai.com/dall-e-3', 'paid', 20, 'Usage-based via OpenAI API. ChatGPT Plus includes limited generation.', 1, 'web,api', 'active', '2024-10', 'DALL·E 3 is OpenAI''s latest image generation model, natively integrated with ChatGPT for prompt refinement.', 0, 1, '2026-04-02');

INSERT INTO tool_tags (tool_id, tag) VALUES (2, 'image-generation'), (2, 'openai'), (2, 'text-to-image');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('canva', 'Canva', 'image', 'https://canva.com', 'freemium', 0, 'Free tier available. Pro $12.99/mo, Teams $14.99/mo per person.', 1, 'web,mobile,desktop', 'active', '2023-08', 'Canva is a graphic design platform with built-in AI tools for creating social media content, presentations, and more.', 0, 1, '2026-04-03');

INSERT INTO tool_tags (tool_id, tag) VALUES (3, 'design'), (3, 'graphic-design'), (3, 'presentation');

-- ── Writing & Content ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('chatgpt', 'ChatGPT', 'writing', 'https://chat.openai.com', 'freemium', 0, 'Free tier available. ChatGPT Plus $20/mo, Pro $200/mo.', 1, 'web,mobile,api', 'active', '2022-11', 'ChatGPT is OpenAI''s flagship conversational AI. Write, brainstorm, code, and analyze with the most popular AI assistant.', 1, 1, '2026-04-01');

INSERT INTO tool_tags (tool_id, tag) VALUES (4, 'chat'), (4, 'writing'), (4, 'openai'), (4, 'productivity');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('claude', 'Claude', 'writing', 'https://claude.ai', 'freemium', 0, 'Free tier available. Pro $20/mo, Team $25/mo per person.', 1, 'web,mobile,api', 'active', '2025-03', 'Claude is an AI assistant by Anthropic focused on safety, helpfulness, and long-form content creation.', 1, 1, '2026-04-02');

INSERT INTO tool_tags (tool_id, tag) VALUES (5, 'chat'), (5, 'writing'), (5, 'anthropic'), (5, 'reasoning');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('grammarly', 'Grammarly', 'writing', 'https://grammarly.com', 'freemium', 0, 'Free tier available. Premium $12/mo, Business $15/mo per person.', 1, 'web,mobile,desktop,api', 'active', '2024-06', 'Grammarly is an AI writing assistant that helps you write clearly, correctly, and in your unique voice.', 0, 1, '2026-04-05');

INSERT INTO tool_tags (tool_id, tag) VALUES (6, 'writing'), (6, 'grammar'), (6, 'productivity');

-- ── Code & Developer ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('cursor', 'Cursor', 'code', 'https://cursor.sh', 'paid', 20, 'Free tier with limited usage. Pro $20/mo, Business $40/mo.', 1, 'desktop', 'active', '2024-01', 'Cursor is an AI-first code editor built on VS Code. Write, edit, and understand code faster with AI.', 0, 1, '2026-04-03');

INSERT INTO tool_tags (tool_id, tag) VALUES (7, 'code-generation'), (7, 'ide'), (7, 'ai-editor');

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('github-copilot', 'GitHub Copilot', 'code', 'https://github.com/features/copilot', 'paid', 10, 'Individual $10/mo, Business $19/mo, Enterprise $39/mo.', 1, 'web,desktop,api', 'active', '2024-06', 'GitHub Copilot is an AI pair programmer that offers autocomplete-style suggestions as you code.', 0, 1, '2026-04-04');

INSERT INTO tool_tags (tool_id, tag) VALUES (8, 'code-generation'), (8, 'github'), (8, 'autocomplete');

-- ── Video & Animation ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('runway', 'Runway', 'video', 'https://runwayml.com', 'paid', 15, 'Standard $15/mo, Pro $35/mo, Unlimited $95/mo.', 1, 'web', 'active', '2024-03', 'Runway is a web-based AI video editing platform with tools for generation, inpainting, motion tracking, and more.', 0, 1, '2026-04-06');

INSERT INTO tool_tags (tool_id, tag) VALUES (9, 'video-generation'), (9, 'video-editing'), (9, 'motion-tracking');

-- ── Research ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('perplexity', 'Perplexity', 'research', 'https://perplexity.ai', 'freemium', 0, 'Free tier available. Pro $20/mo.', 1, 'web,mobile', 'active', '2024-12', 'Perplexity is an AI-powered answer engine that provides real-time answers with cited sources.', 0, 1, '2026-04-07');

INSERT INTO tool_tags (tool_id, tag) VALUES (10, 'search'), (10, 'research'), (10, 'answer-engine');

-- ── Productivity ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('notion-ai', 'Notion AI', 'productivity', 'https://notion.so', 'freemium', 0, 'Free tier available. Plus $10/mo, Business $18/mo. AI add-on $10/mo.', 1, 'web,mobile,desktop', 'active', '2024-02', 'Notion is an all-in-one workspace with integrated AI for writing, summarizing, and brainstorming.', 0, 1, '2026-04-08');

INSERT INTO tool_tags (tool_id, tag) VALUES (11, 'productivity'), (11, 'notes'), (11, 'writing'), (11, 'workspace');

-- ── Audio ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('elevenlabs', 'ElevenLabs', 'audio', 'https://elevenlabs.io', 'freemium', 0, 'Free tier with limited characters. Pro $5/mo, Pro+ $22/mo.', 1, 'web,api', 'active', '2024-01', 'ElevenLabs is an AI voice synthesis platform offering ultra-realistic text-to-speech and voice cloning.', 0, 1, '2026-04-09');

INSERT INTO tool_tags (tool_id, tag) VALUES (12, 'text-to-speech'), (12, 'voice'), (12, 'audio');

-- ── Stability AI (full demo tool) ──

INSERT INTO tools (slug, name, category, website, pricing, price_starting, price_detail, has_free_trial, platforms, status, launched, meta_description, featured, verified, submitted_at)
VALUES ('stability-ai', 'Stability AI', 'image', 'https://stability.ai', 'freemium', 0, 'Free tier with limited generations. Pro $20/mo, Enterprise custom pricing. API usage-based starting at $0.002/image.', 1, 'web,api,discord,mobile', 'active', '2022-08', 'Stability AI is the creator of Stable Diffusion, the groundbreaking open-source image generation model. Generate images, video, 3D assets, and audio with state-of-the-art AI models.', 1, 1, '2026-04-15');

INSERT INTO tool_tags (tool_id, tag) VALUES (13, 'image-generation'), (13, 'ai-art'), (13, 'text-to-image'), (13, 'stable-diffusion'), (13, 'open-source'), (13, 'video-generation'), (13, '3d-modeling');

INSERT INTO tool_images (tool_id, url, alt, caption, sort_order, image_type)
VALUES (13, 'https://r2.aifindr.org/tools/image/stability-ai/screenshot-01.webp', 'Stable Diffusion 3 prompt interface', 'SD3 delivers photorealistic text rendering and compositional accuracy', 0, 'screenshot');

INSERT INTO tool_images (tool_id, url, alt, caption, sort_order, image_type)
VALUES (13, 'https://r2.aifindr.org/tools/image/stability-ai/screenshot-02.webp', 'Stable Video Diffusion generation', 'Transform static images into smooth video animations', 1, 'screenshot');

INSERT INTO tool_videos (tool_id, url, platform, video_id, title, video_type, duration)
VALUES (13, 'https://www.youtube.com/watch?v=dYJnUT4xO2I', 'youtube', 'dYJnUT4xO2I', 'Stable Diffusion 3 — Full Demo & Review', 'demo', 845);
