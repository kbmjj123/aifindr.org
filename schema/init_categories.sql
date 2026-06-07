-- ============================================================
-- aifindr.org — Seed Data (单表版)
-- subcategories 字段为 JSON 字符串
-- ============================================================

INSERT INTO categories (id, slug, icon, title, description, hero, sort_order, subcategories) VALUES

('audio', 'audio', '🎵', 'Audio & Music',
 'AI tools for music generation, voice cloning, transcription, and audio editing.',
 'From generating original music tracks to cloning voices and transcribing podcasts — AI audio tools handle every sound-related task without studio equipment or technical skills. Whether you need a free AI music generator, a text to speech tool with natural voices, or a voice cloning tool for content creation, this list covers the best options available in 2026.',
 1,
 '[{"id":"music-generation","title":"Music Generation","keywords":["ai music generator free","ai song generator"]},{"id":"text-to-speech","title":"Text to Speech","keywords":["ai text to speech free","ai voice generator"]},{"id":"voice-cloning","title":"Voice Cloning","keywords":["ai voice cloning tool"]},{"id":"transcription","title":"Transcription","keywords":["ai podcast transcript tool"]},{"id":"audio-enhancement","title":"Audio Enhancement","keywords":["ai noise cancellation tool","ai audio separator"]},{"id":"alternatives","title":"Alternatives","keywords":["suno ai alternative","elevenlabs alternative"]}]'
),

('image', 'image', '🖼️', 'Image & Design',
 'AI tools for image generation, upscaling, background removal, logo creation, and illustration.',
 'Generate stunning images from text, remove backgrounds instantly, upscale low-resolution photos to 4K, and create professional logos — all without design skills or expensive software. Whether you need a free AI image upscaler, a background remover, a text to image generator, or a Midjourney alternative, this list covers the best AI image and design tools available in 2026.',
 2,
 '[{"id":"image-generation","title":"Image Generation","keywords":["text to image ai free","midjourney alternative free"]},{"id":"image-upscaling","title":"Image Upscaling & Enhancement","keywords":["ai image upscaler free","ai photo enhancer online"]},{"id":"background-removal","title":"Background Removal","keywords":["ai background remover"]},{"id":"logo-branding","title":"Logo & Branding","keywords":["ai logo generator free"]},{"id":"illustration","title":"Illustration & Art","keywords":["ai illustration generator","best ai art generator"]},{"id":"alternatives","title":"Alternatives","keywords":["midjourney alternative free","stable diffusion alternatives"]}]'
),

('writing', 'writing', '✍️', 'Writing & Content',
 'AI tools for copywriting, blogging, essays, email writing, and content generation.',
 'From drafting blog posts and essays to generating product descriptions and email copy — AI writing tools eliminate writer''s block and cut content production time by 80%. Whether you need a free AI essay writer, an AI paraphrasing tool, a blog post generator, or a Jasper alternative, this list covers the best AI writing and content tools in 2026.',
 3,
 '[{"id":"writing-assistants","title":"AI Writing Assistants","keywords":["ai writing assistant free","ai content generator"]},{"id":"essay-longform","title":"Essay & Long-form Writing","keywords":["ai essay writer"]},{"id":"copywriting","title":"Copywriting","keywords":["ai copywriting tool","ai ad copy generator"]},{"id":"blog-seo","title":"Blog & SEO Content","keywords":["ai blog post generator"]},{"id":"paraphrasing","title":"Paraphrasing","keywords":["ai paraphrasing tool free"]},{"id":"email-writing","title":"Email Writing","keywords":["ai email writer free"]},{"id":"product-descriptions","title":"Product Descriptions","keywords":["ai product description generator"]},{"id":"alternatives","title":"Alternatives","keywords":["jasper ai alternative","copy ai alternative"]}]'
),

('video', 'video', '🎬', 'Video & Animation',
 'AI tools for video generation, editing, enhancement, avatar creation, and subtitles.',
 'Generate videos from text prompts, edit footage automatically, add subtitles in seconds, and create talking avatar videos — all without a camera, crew, or video editing experience. Whether you need a free AI video generator, a text to video tool, an AI video editor, or a Runway alternative, this list covers the best AI video and animation tools available in 2026.',
 4,
 '[{"id":"video-generation","title":"Video Generation","keywords":["ai video generator free","ai text to video","sora alternative free"]},{"id":"video-editing","title":"Video Editing","keywords":["ai video editor online"]},{"id":"video-enhancement","title":"Video Enhancement","keywords":["ai video enhancer"]},{"id":"avatar-talking-head","title":"Avatar & Talking Head","keywords":["ai avatar video generator","ai talking head video"]},{"id":"subtitles-captions","title":"Subtitles & Captions","keywords":["ai video subtitle generator"]},{"id":"animation","title":"Animation","keywords":["ai animation generator"]},{"id":"alternatives","title":"Alternatives","keywords":["runway ml alternative","sora alternative free"]}]'
),

('code', 'code', '💻', 'Code & Developer',
 'AI tools for coding assistance, code review, SQL generation, testing, and documentation.',
 'Write code faster, review pull requests automatically, generate SQL queries, explain complex functions, and create unit tests — all with AI assistance that understands your codebase. Whether you need a free AI code generator, a GitHub Copilot alternative, an AI code reviewer, or a Cursor alternative, this list covers the best AI coding tools for developers in 2026.',
 5,
 '[{"id":"coding-assistants","title":"AI Coding Assistants","keywords":["ai coding assistant","github copilot alternative","cursor ai alternative"]},{"id":"code-generation","title":"Code Generation","keywords":["ai code generator free"]},{"id":"code-review","title":"Code Review","keywords":["ai code review tool"]},{"id":"sql-database","title":"SQL & Database","keywords":["ai sql query generator"]},{"id":"testing","title":"Testing","keywords":["ai unit test generator"]},{"id":"documentation","title":"Documentation","keywords":["ai api documentation generator"]},{"id":"code-explanation","title":"Code Explanation","keywords":["ai code explainer tool"]},{"id":"utilities","title":"Utilities","keywords":["ai regex generator"]}]'
),

('productivity', 'productivity', '⚡', 'Productivity',
 'AI tools for meetings, PDF summarization, workflow automation, scheduling, and task management.',
 'Summarize meetings automatically, organize notes with AI, condense lengthy PDFs into key insights, and automate repetitive workflows — all without switching between a dozen different apps. Whether you need a free AI meeting summarizer, an AI PDF summarizer, a document assistant, or a Notion AI alternative, this list covers the best AI productivity tools for individuals and teams in 2026.',
 6,
 '[{"id":"meeting-notes","title":"Meeting & Notes","keywords":["ai meeting summarizer","ai note taking app"]},{"id":"pdf-document","title":"PDF & Document","keywords":["ai pdf summarizer free","ai document summarizer"]},{"id":"workflow-automation","title":"Workflow Automation","keywords":["ai workflow automation tool"]},{"id":"calendar-scheduling","title":"Calendar & Scheduling","keywords":["ai calendar assistant"]},{"id":"task-management","title":"Task Management","keywords":["ai task manager"]},{"id":"inbox-email","title":"Inbox & Email Management","keywords":["ai inbox management tool"]},{"id":"time-tracking","title":"Time Tracking","keywords":["ai time tracking tool"]},{"id":"alternatives","title":"Alternatives","keywords":["notion ai alternative"]}]'
),

('marketing', 'marketing', '📈', 'Marketing & SEO',
 'AI tools for SEO, social media, ad copy, landing pages, content repurposing, and competitor analysis.',
 'Research keywords in seconds, generate high-converting ad copy, schedule social media posts automatically, and optimize content for search engines — all with AI that understands your audience and your goals. Whether you need a free AI SEO tool, an AI social media post generator, an AI keyword research tool, or a Surfer SEO alternative, this list covers the best AI marketing and SEO tools available in 2026.',
 7,
 '[{"id":"seo-tools","title":"SEO Tools","keywords":["ai seo tool free","ai keyword research tool","surfer seo alternative"]},{"id":"social-media","title":"Social Media","keywords":["ai social media post generator","ai hashtag generator"]},{"id":"ad-copy","title":"Ad Copy","keywords":["ai ad copy generator"]},{"id":"landing-pages","title":"Landing Pages","keywords":["ai landing page generator"]},{"id":"content-repurposing","title":"Content Repurposing","keywords":["ai content repurposing tool"]},{"id":"competitor-analysis","title":"Competitor Analysis","keywords":["ai competitor analysis tool"]},{"id":"youtube-video-seo","title":"YouTube & Video SEO","keywords":["ai youtube description generator"]}]'
),

('data', 'data', '📊', 'Data & Analytics',
 'AI tools for data analysis, chart generation, spreadsheets, dashboards, and reporting.',
 'Analyze datasets without writing SQL, generate charts from plain English descriptions, build interactive dashboards in minutes, and extract insights from spreadsheets automatically — all without a data science background. Whether you need a free AI data analysis tool, an AI chart generator, an AI Excel formula generator, or a Tableau alternative, this list covers the best AI data and analytics tools available in 2026.',
 8,
 '[{"id":"data-analysis","title":"Data Analysis","keywords":["ai data analysis tool","ai csv analyzer"]},{"id":"charts-visualization","title":"Charts & Visualization","keywords":["ai chart generator","ai data visualization free"]},{"id":"spreadsheets","title":"Spreadsheets","keywords":["ai excel formula generator","ai spreadsheet tool"]},{"id":"dashboards-bi","title":"Dashboards & BI","keywords":["ai dashboard builder","ai business intelligence tool"]},{"id":"reports","title":"Reports","keywords":["ai report generator"]},{"id":"alternatives","title":"Alternatives","keywords":["tableau alternative ai"]}]'
),

('education', 'education', '📚', 'Education & Learning',
 'AI tools for homework help, math solving, flashcards, quizzes, language learning, and course creation.',
 'Solve math problems step by step, generate flashcards from any text, get instant homework help, create quizzes in seconds, and learn any language with an AI tutor — all available free without expensive tutoring fees. Whether you need a free AI homework helper, an AI math solver, an AI flashcard generator, or a Duolingo alternative, this list covers the best AI education and learning tools available in 2026.',
 9,
 '[{"id":"homework-tutoring","title":"Homework & Tutoring","keywords":["ai homework helper","ai tutoring tool"]},{"id":"math","title":"Math","keywords":["ai math solver free"]},{"id":"flashcards-quizzes","title":"Flashcards & Quizzes","keywords":["ai flashcard generator","ai quiz generator"]},{"id":"summarization","title":"Summarization","keywords":["ai summarize article"]},{"id":"study-planning","title":"Study Planning & Notes","keywords":["ai study planner","ai lecture notes tool"]},{"id":"language-learning","title":"Language Learning","keywords":["ai language learning tool","duolingo alternative ai"]},{"id":"course-creation","title":"Course Creation","keywords":["ai course creator"]}]'
),

('business', 'business', '💼', 'Business & Finance',
 'AI tools for business planning, contracts, invoicing, pitch decks, HR, customer support, and CRM.',
 'Generate professional business plans, review contracts in seconds, create investor pitch decks, automate customer support, and analyze financial data — all without expensive consultants or enterprise software budgets. Whether you need a free AI business plan generator, an AI contract review tool, an AI pitch deck generator, or a free AI chatbot builder, this list covers the best AI business and finance tools available in 2026.',
 10,
 '[{"id":"business-planning","title":"Business Planning","keywords":["ai business plan generator","ai proposal generator"]},{"id":"legal-contracts","title":"Legal & Contracts","keywords":["ai contract review tool"]},{"id":"finance-invoicing","title":"Finance & Invoicing","keywords":["ai invoice generator","ai financial analysis tool"]},{"id":"pitch-presentations","title":"Pitch & Presentations","keywords":["ai pitch deck generator"]},{"id":"hr-recruiting","title":"HR & Recruiting","keywords":["ai hr tool free"]},{"id":"customer-support","title":"Customer Support","keywords":["ai customer support tool","ai chatbot builder free"]},{"id":"crm-sales","title":"CRM & Sales","keywords":["ai crm tool"]}]'
),

('research', 'research', '🔬', 'Research & Search',
 'AI tools for academic research, paper summarization, citation generation, fact checking, and web scraping.',
 'Find credible sources instantly, summarize academic papers in seconds, generate citations automatically, fact-check claims in real time, and discover knowledge across the web — all without spending hours in a library or search engine. Whether you need a free AI research tool, an AI paper summarizer, an AI citation generator, or a Perplexity alternative, this list covers the best AI research and search tools available in 2026.',
 11,
 '[{"id":"ai-search-engines","title":"AI Search Engines","keywords":["ai search engine alternative","perplexity ai alternative"]},{"id":"academic-research","title":"Academic Research","keywords":["ai research tool free","ai literature review tool"]},{"id":"paper-summarization","title":"Paper Summarization","keywords":["ai paper summarizer"]},{"id":"citation-references","title":"Citation & References","keywords":["ai citation generator"]},{"id":"fact-checking","title":"Fact Checking","keywords":["ai fact checker tool"]},{"id":"knowledge-base","title":"Knowledge Base","keywords":["ai knowledge base tool"]},{"id":"web-scraping","title":"Web Scraping","keywords":["ai web scraping tool"]},{"id":"academic-writing","title":"Academic Writing","keywords":["ai academic writing tool"]}]'
),

('other', 'other', '···', 'Other',
 'AI tools that don''t fit neatly into the above categories, including tools for small business, freelancers, content creators, and open-source AI.',
 'Discover AI tools for every use case that doesn''t fit a single category — from tools for small business owners and freelancers to open-source AI projects and weekly new releases. Whether you''re looking for the best free AI tools list, AI tools for students, or the latest AI tools this week, this section keeps you covered in 2026.',
 12,
 '[{"id":"small-business","title":"Small Business","keywords":["ai tool for small business"]},{"id":"freelancers","title":"Freelancers","keywords":["best ai tools for freelancers"]},{"id":"content-creators","title":"Content Creators","keywords":["ai tool for content creators"]},{"id":"students","title":"Students","keywords":["ai tools for students free"]},{"id":"open-source","title":"Open Source","keywords":["open source ai tools"]},{"id":"directories-lists","title":"Directories & Lists","keywords":["free ai tools list 2026","ai tools directory","ai tools comparison"]},{"id":"new-releases","title":"New Releases","keywords":["new ai tools this week","ai productivity tools 2026"]}]'
);
