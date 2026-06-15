-- aifindr.org — D1 数据库初始化
-- 用法：npx wrangler d1 execute aifindr-db --remote --file=./schema/init.sql

CREATE TABLE IF NOT EXISTS tools (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  sub_category     TEXT DEFAULT '',
  website          TEXT NOT NULL,
  pricing          TEXT NOT NULL CHECK(pricing IN ('free','freemium','paid')),
  price_starting   REAL DEFAULT 0,
  price_detail     TEXT,
  price_tiers      TEXT,       -- JSON 数组，结构化价格方案
  has_free_trial   INTEGER DEFAULT 0,
  platforms        TEXT DEFAULT '',
  status           TEXT DEFAULT 'pending'
                   CHECK(status IN ('active','beta','discontinued','pending','rejected','needs_info')),
  launched         TEXT,
  submitted_at     TEXT NOT NULL,
  last_verified    TEXT,
  updated_at       TEXT,
  meta_description TEXT,
  short_description TEXT,  -- max 80 chars, used in title/H1
  logo             TEXT,
  screenshots      TEXT,       -- JSON 数组，如 ["url1","url2"]
  featured         INTEGER DEFAULT 0,
  verified         INTEGER DEFAULT 0,
  editor_pick      INTEGER DEFAULT 0,
  click_count      INTEGER DEFAULT 0,
  view_count       INTEGER DEFAULT 0,
  submitter_site   TEXT,
  submitter_github TEXT,
  content_path     TEXT,
  body             TEXT,
  submitter_id     INTEGER REFERENCES users(id),
  reject_reason    TEXT,       -- 拒绝原因
  reviewer_note    TEXT,       -- 管理员备注
  reviewed_at      TEXT,       -- 审核时间
  data_source      TEXT        -- 数据来源（futurepedia/producthunt/user_submit等）
);

CREATE INDEX IF NOT EXISTS idx_tools_category    ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_subcat      ON tools(sub_category);
CREATE INDEX IF NOT EXISTS idx_tools_pricing     ON tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_status      ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_featured    ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_submitted   ON tools(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_clicks      ON tools(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_tools_cat_status  ON tools(category, status);
CREATE INDEX IF NOT EXISTS idx_tools_cat_subcat  ON tools(category, sub_category);

CREATE TABLE IF NOT EXISTS tool_tags (
  tool_id  INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  type     TEXT NOT NULL CHECK(type IN ('use_case','audience','feature')),
  PRIMARY KEY (tool_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_tool_tags_tag     ON tool_tags(tag);
CREATE INDEX IF NOT EXISTS idx_tool_tags_type    ON tool_tags(type);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tool    ON tool_tags(tool_id);

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id       INTEGER NOT NULL UNIQUE,
  username        TEXT NOT NULL,
  email           TEXT,                       -- GitHub 公开邮箱（可能为 noreply）
  avatar_url      TEXT,
  contact_email   TEXT,                       -- 用户手动填写的联系邮箱（用于接收通知）
  email_verified  INTEGER DEFAULT 0,          -- 邮箱验证状态
  email_notify    INTEGER DEFAULT 1,          -- 是否接收邮件通知
  email_verify_token TEXT,                    -- 邮箱验证令牌
  last_login_at   TEXT,                       -- 最后登录时间
  unsubscribed_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_contact_email ON users(contact_email);

-- ─── 邮件发送记录 ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id    TEXT    NOT NULL,               -- 场景编号，如 "B-03"
  recipient   TEXT    NOT NULL,               -- 收件人邮箱
  subject     TEXT    NOT NULL,
  status      TEXT    DEFAULT 'sent'
              CHECK(status IN ('sent','failed','bounced')),
  resend_id   TEXT,                           -- Resend 返回的 message id
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_logs_scene    ON email_logs(scene_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_created  ON email_logs(created_at DESC);

-- ─── AI 文章生成记录（v1.4） ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS generated_articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id),    -- 生成者（关联 users 表）
  user_site     TEXT NOT NULL,                   -- 用户网站 URL
  platform      TEXT NOT NULL                    -- 目标平台
                CHECK(platform IN ('medium','devto','hashnode','linkedin','quora','reddit')),
  title         TEXT NOT NULL,                   -- 生成的文章标题
  content       TEXT NOT NULL,                   -- 生成的文章正文
  topic         TEXT,                            -- 用户选择的主题方向
  status        TEXT DEFAULT 'generated'         -- 状态
                CHECK(status IN ('generated','published','failed')),
  published_url TEXT,                            -- 发布后的 URL
  published_at  TEXT,                            -- 发布时间
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gen_articles_user    ON generated_articles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gen_articles_status  ON generated_articles(status);

-- ─── 反链追踪（v2.0） ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS published_links (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id   INTEGER REFERENCES generated_articles(id),
  user_id      INTEGER REFERENCES users(id),       -- 反链所属用户
  source_url   TEXT NOT NULL,                       -- 发布文章 URL
  target_url   TEXT NOT NULL,                       -- 反链目标 URL（用户网站）
  platform     TEXT NOT NULL,                       -- 发布平台
  anchor_text  TEXT,                                -- 锚文本
  is_active    INTEGER DEFAULT 1,                   -- 是否仍有效
  last_checked TEXT,                                -- 最后检查时间
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_links_user       ON published_links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_is_active  ON published_links(is_active);
CREATE INDEX IF NOT EXISTS idx_links_checked    ON published_links(last_checked);

-- ─── CMS 博客文章（v1.5） ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT UNIQUE NOT NULL,
  status       TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  author_id    INTEGER REFERENCES users(id),
  created_at   INTEGER DEFAULT (unixepoch()),
  updated_at   INTEGER DEFAULT (unixepoch()),
  published_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_posts_status     ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug       ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author     ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published  ON posts(published_at DESC);

CREATE TABLE IF NOT EXISTS post_translations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale      TEXT NOT NULL CHECK(locale IN ('zh','en')),
  title       TEXT NOT NULL,
  content     TEXT,
  cover_image TEXT,
  meta_desc   TEXT,
  UNIQUE(post_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_pt_post ON post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_pt_locale ON post_translations(locale);

CREATE TABLE IF NOT EXISTS custom_fields (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id  INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  key      TEXT NOT NULL,
  value    TEXT
);

CREATE INDEX IF NOT EXISTS idx_cf_post ON custom_fields(post_id);
