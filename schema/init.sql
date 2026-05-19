-- aifindr.org — D1 数据库初始化

CREATE TABLE IF NOT EXISTS tools (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  website          TEXT NOT NULL,
  pricing          TEXT NOT NULL CHECK(pricing IN ('free','freemium','paid')),
  price_starting   REAL DEFAULT 0,
  price_detail     TEXT,
  has_free_trial   INTEGER DEFAULT 0,
  platforms        TEXT DEFAULT '',
  status           TEXT DEFAULT 'active'
                   CHECK(status IN ('active','beta','discontinued','pending')),
  launched         TEXT,
  submitted_at     TEXT NOT NULL,
  last_verified    TEXT,
  updated_at       TEXT,
  meta_description TEXT,
  og_image         TEXT,
  cover_image      TEXT,
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
  reject_reason    TEXT,                    -- 拒绝原因
  reviewer_note    TEXT,                    -- 管理员备注
  reviewed_at      TEXT,                    -- 审核时间
  use_cases        TEXT DEFAULT '',         -- 场景标签，逗号分隔
  target_users     TEXT DEFAULT '',         -- 角色标签，逗号分隔
  data_source      TEXT                     -- 数据来源（futurepedia/producthunt等）
);

CREATE INDEX IF NOT EXISTS idx_tools_category   ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_pricing    ON tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_status     ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_featured   ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_submitted  ON tools(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_clicks     ON tools(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_tools_cat_status ON tools(category, status);

CREATE TABLE IF NOT EXISTS tool_tags (
  tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (tool_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tag ON tool_tags(tag);

CREATE TABLE IF NOT EXISTS tool_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id    INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT DEFAULT '',
  caption    TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  image_type TEXT DEFAULT 'screenshot'
             CHECK(image_type IN ('cover','screenshot','logo','banner','og')),
  width      INTEGER,
  height     INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tool_images_tool_id ON tool_images(tool_id, sort_order);

CREATE TABLE IF NOT EXISTS tool_videos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id    INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  video_id   TEXT,
  platform   TEXT NOT NULL CHECK(platform IN ('youtube','vimeo','twitter','loom','direct')),
  title      TEXT DEFAULT '',
  video_type TEXT DEFAULT 'demo' CHECK(video_type IN ('demo','tutorial','review','intro')),
  thumbnail  TEXT,
  duration   INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tool_videos_tool_id ON tool_videos(tool_id, sort_order);

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
