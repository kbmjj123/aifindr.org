-- Migration 002: Add 'rejected' and 'needs_info' to status CHECK constraint
-- Required after: review endpoint needs to set status to 'rejected' / 'needs_info'

BEGIN TRANSACTION;

CREATE TABLE tools_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  sub_category     TEXT DEFAULT '',
  website          TEXT NOT NULL,
  pricing          TEXT NOT NULL CHECK(pricing IN ('free','freemium','paid')),
  price_starting   REAL DEFAULT 0,
  price_detail     TEXT,
  has_free_trial   INTEGER DEFAULT 0,
  platforms        TEXT DEFAULT '',
  status           TEXT DEFAULT 'pending'
                   CHECK(status IN ('active','beta','discontinued','pending','rejected','needs_info')),
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
  reject_reason    TEXT,
  reviewer_note    TEXT,
  reviewed_at      TEXT,
  data_source      TEXT
);

INSERT INTO tools_new SELECT * FROM tools;

DROP TABLE tools;

ALTER TABLE tools_new RENAME TO tools;

CREATE INDEX IF NOT EXISTS idx_tools_category    ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_subcat      ON tools(sub_category);
CREATE INDEX IF NOT EXISTS idx_tools_pricing     ON tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_status      ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_featured    ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_submitted   ON tools(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_clicks      ON tools(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_tools_cat_status  ON tools(category, status);
CREATE INDEX IF NOT EXISTS idx_tools_cat_subcat  ON tools(category, sub_category);

COMMIT;
