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
	body						 TEXT
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
