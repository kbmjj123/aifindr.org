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
  reviewed_at      TEXT                     -- 审核时间
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

-- ─── 增量迁移（已有数据库执行以下 ALTER） ─────────────────────────
-- 若列已存在会报错，可忽略（初次建表的 CREATE TABLE 已包含这些列）

ALTER TABLE tools ADD COLUMN reject_reason TEXT;
ALTER TABLE tools ADD COLUMN reviewer_note TEXT;
ALTER TABLE tools ADD COLUMN reviewed_at TEXT;

ALTER TABLE users ADD COLUMN contact_email TEXT;
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN email_notify INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN email_verify_token TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
CREATE INDEX IF NOT EXISTS idx_users_contact_email ON users(contact_email);

-- ─── 邮件发送记录（v1.1） ────────────────────────────────────────

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
