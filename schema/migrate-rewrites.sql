-- 一次性迁移：为 submission_sites 增加改写稿列（14）与 R2 图片列（3）。
--
-- 新增 17 列：
--   rw_*  改写稿镜像列，页面优先读取、缺失回退原始字段
--   r2_*  图片本地化后的 R2 地址，页面优先读取、缺失回退原始 CDN
--
-- 新库从 schema/init.sql 建表已自带全部列，无需本文件；
-- 仅需对「已有 submission_sites 表但缺这些列」的库执行一次。
--
-- 本脚本不幂等：SQLite 的 ADD COLUMN 不支持 IF NOT EXISTS，对已含列的库执行会报
--   SQLITE_ERROR: duplicate column name: rw_xxx
-- 看到该错误说明该列已存在，库已迁移，跳过即可。
--
-- 执行前先检查缺失列（返回少于 17 行说明需要迁移）：
--   wrangler d1 execute aifindr-db --local  --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name LIKE 'rw_%' OR name LIKE 'r2_%';"
--   wrangler d1 execute aifindr-db --remote --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name LIKE 'rw_%' OR name LIKE 'r2_%';"
--
-- 仅在缺列时执行一次（相应环境）：
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-rewrites.sql
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-rewrites.sql
--
-- 已有行回填默认值，避免筛选与导出遇到 NULL；随后导入 seed-rewrites.sql / seed-images.sql 会覆盖快照行。

ALTER TABLE submission_sites ADD COLUMN rw_source_lead TEXT;
ALTER TABLE submission_sites ADD COLUMN rw_what_you_get TEXT;
ALTER TABLE submission_sites ADD COLUMN rw_you_need TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_eligibility TEXT;
ALTER TABLE submission_sites ADD COLUMN rw_submit_steps TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_submit_requirements TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_rejection_reasons TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_gotchas TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_faq TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_summary TEXT;
ALTER TABLE submission_sites ADD COLUMN rw_fact_points TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_submission_checks TEXT DEFAULT '[]';
ALTER TABLE submission_sites ADD COLUMN rw_seo_title TEXT;
ALTER TABLE submission_sites ADD COLUMN rw_seo_description TEXT;

ALTER TABLE submission_sites ADD COLUMN r2_icon_url TEXT;
ALTER TABLE submission_sites ADD COLUMN r2_screenshot_url TEXT;
ALTER TABLE submission_sites ADD COLUMN r2_og_image_url TEXT;

UPDATE submission_sites SET
  rw_you_need='[]', rw_submit_steps='[]', rw_submit_requirements='[]',
  rw_rejection_reasons='[]', rw_gotchas='[]', rw_faq='[]',
  rw_fact_points='[]', rw_submission_checks='[]'
WHERE 1=1;
