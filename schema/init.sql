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
  faq              TEXT,       -- JSON 数组 [{question, answer}], 用于详情页手风琴
  logo             TEXT,
  screenshots      TEXT,       -- JSON 数组，支持 string[] 和 {url,alt}[]
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

-- ─── 公共外链提交平台目录（开放数据） ────────────────────────────
-- 与 tools 是两类实体：这里记录「可以提交外链的第三方平台」，不是站内收录的 AI 工具。
-- 数据由 scripts/build-submission-sites.mjs 从 docs/res/01-list.json + 02-details.jsonl
-- 双源 join 生成，导入文件为 schema/seed-submission-sites.sql。
-- 说明文案（summary/fact_points/editorial/intro/methodology/faq）均为本站原创，
-- 不复制来源页面的表达；事实字段保留来源署名与快照日期。

CREATE TABLE IF NOT EXISTS submission_sites (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  site_url            TEXT,
  submit_url          TEXT,
  submit_method       TEXT DEFAULT 'unknown'
                      CHECK(submit_method IN ('form','github_pr','awesome_list','sign_in','community_post','external','unknown')),
  domain_rating       INTEGER,
  pricing             TEXT DEFAULT 'unknown'
                      CHECK(pricing IN ('free','freemium','paid','optional','unknown')),
  has_free_submission INTEGER,          -- 1 有免费提交通道 / 0 无 / NULL 未核实；与 pricing 是两套口径
  approval            TEXT DEFAULT 'Not stated',
  approval_bucket     TEXT DEFAULT 'unknown'
                      CHECK(approval_bucket IN ('fast','week','month','slow','unknown')),
  dofollow_link       INTEGER,          -- 1 / 0 / NULL
  backlink_required   INTEGER,          -- 1 / 0 / NULL；1 对应「需要放对方徽章/回链」
  list_order          INTEGER DEFAULT 0,
  is_featured         INTEGER DEFAULT 0,
  summary             TEXT,             -- 本站原创事实摘要
  fact_points         TEXT,             -- JSON 数组，结构化事实要点
  editorial           TEXT,             -- 人工补充的原创说明；有值时优先于 summary
  attribution         TEXT,             -- 来源署名 + 快照口径
  source_url          TEXT,
  source_snapshot     TEXT,             -- YYYY-MM-DD
  data_source         TEXT DEFAULT 'snapshot'
                      CHECK(data_source IN ('snapshot','user','admin')),
  verification_status TEXT DEFAULT 'snapshot'
                      CHECK(verification_status IN ('snapshot','self_reported','verified')),
  last_checked_at     TEXT,              -- 最近一次存活巡检时间（cron 自动更新）
  availability        TEXT DEFAULT 'unknown'
                      CHECK(availability IN ('unknown','reachable','unreachable')),
  page_rank           REAL,              -- Open PageRank（0–10），由 cron 自动刷新，与 Ahrefs DR 量纲不同
  page_rank_checked_at TEXT,             -- 最近一次 Open PageRank 刷新时间
  status              TEXT DEFAULT 'active'
                      CHECK(status IN ('active','needs_info','hidden')),
  indexed             INTEGER DEFAULT 1,
  click_count         INTEGER DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

CREATE INDEX IF NOT EXISTS idx_ss_status        ON submission_sites(status);
CREATE INDEX IF NOT EXISTS idx_ss_pricing       ON submission_sites(pricing);
CREATE INDEX IF NOT EXISTS idx_ss_dr            ON submission_sites(domain_rating DESC);
CREATE INDEX IF NOT EXISTS idx_ss_dofollow      ON submission_sites(dofollow_link);
CREATE INDEX IF NOT EXISTS idx_ss_free          ON submission_sites(has_free_submission);
CREATE INDEX IF NOT EXISTS idx_ss_method        ON submission_sites(submit_method);
CREATE INDEX IF NOT EXISTS idx_ss_approval      ON submission_sites(approval_bucket);
CREATE INDEX IF NOT EXISTS idx_ss_order         ON submission_sites(list_order);
CREATE INDEX IF NOT EXISTS idx_ss_indexed       ON submission_sites(indexed, status);

-- 多标签主题分类（基础快照无分类字段，由规则初判 + 人工复核补充）
CREATE TABLE IF NOT EXISTS site_categories (
  site_slug     TEXT NOT NULL REFERENCES submission_sites(slug) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  parent_slug   TEXT,
  confidence    REAL DEFAULT 1,
  source        TEXT DEFAULT 'rule' CHECK(source IN ('rule','manual','user')),
  PRIMARY KEY (site_slug, category_slug)
);
CREATE INDEX IF NOT EXISTS idx_sc_category ON site_categories(category_slug);
CREATE INDEX IF NOT EXISTS idx_sc_site     ON site_categories(site_slug);

-- 榜单定义：规则型 / 策展型 / 混合型共用一套结构
CREATE TABLE IF NOT EXISTS submission_lists (
  slug             TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  dimension        TEXT NOT NULL,
  kind             TEXT NOT NULL CHECK(kind IN ('rule','curated','hybrid')),
  filters          TEXT,               -- JSON，受限 DSL
  sort             TEXT,               -- JSON 数组
  limit_mode       TEXT DEFAULT 'all' CHECK(limit_mode IN ('all','topN')),
  limit_count      INTEGER DEFAULT 0,
  min_items        INTEGER DEFAULT 10,
  include_slugs    TEXT,               -- JSON 数组
  exclude_slugs    TEXT,               -- JSON 数组
  pinned_order     TEXT,               -- JSON 数组
  intro            TEXT,               -- 原创导语
  methodology      TEXT,               -- 原创筛选口径说明
  faq              TEXT,               -- JSON 数组 [{question, answer}]
  seo_title        TEXT,
  seo_description  TEXT,
  canonical_policy TEXT DEFAULT 'self',
  status           TEXT DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
  snapshot_id      TEXT,
  item_count       INTEGER DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_sl_dimension ON submission_lists(dimension, status);

-- 物化成员：规则型由刷新任务重算，策展型 pinned 行锁定不被覆盖
CREATE TABLE IF NOT EXISTS submission_list_items (
  snapshot_id TEXT NOT NULL,
  list_slug   TEXT NOT NULL REFERENCES submission_lists(slug) ON DELETE CASCADE,
  site_slug   TEXT NOT NULL REFERENCES submission_sites(slug) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  pinned      INTEGER DEFAULT 0,
  note        TEXT,
  PRIMARY KEY (snapshot_id, list_slug, site_slug)
);
CREATE INDEX IF NOT EXISTS idx_sli_list ON submission_list_items(snapshot_id, list_slug, position);
CREATE INDEX IF NOT EXISTS idx_sli_site ON submission_list_items(site_slug);

-- 相似/替代关系：快照里 5955 条相关平台边导入作候选，confirmed=0 待人工确认
CREATE TABLE IF NOT EXISTS site_relations (
  site_slug     TEXT NOT NULL REFERENCES submission_sites(slug) ON DELETE CASCADE,
  related_slug  TEXT NOT NULL REFERENCES submission_sites(slug) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'similar' CHECK(relation_type IN ('similar','alternative')),
  weight        INTEGER DEFAULT 0,
  confirmed     INTEGER DEFAULT 0,
  PRIMARY KEY (site_slug, related_slug, relation_type)
);
CREATE INDEX IF NOT EXISTS idx_sr_site   ON site_relations(site_slug, weight DESC);
CREATE INDEX IF NOT EXISTS idx_sr_type   ON site_relations(relation_type);

-- 成员变更审计：joined / left / pinned
CREATE TABLE IF NOT EXISTS submission_list_changelog (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id TEXT NOT NULL,
  list_slug   TEXT NOT NULL,
  site_slug   TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK(change_type IN ('joined','left','pinned')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_slc_snapshot ON submission_list_changelog(snapshot_id, list_slug);

-- 用户提交新站点 / 勘误 / 下架申请，审核通过后才写入 submission_sites
CREATE TABLE IF NOT EXISTS submission_site_reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  site_slug   TEXT,
  kind        TEXT NOT NULL CHECK(kind IN ('correction','new_site','takedown')),
  payload     TEXT,
  contact     TEXT,
  status      TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ssr_status ON submission_site_reports(status, created_at DESC);
