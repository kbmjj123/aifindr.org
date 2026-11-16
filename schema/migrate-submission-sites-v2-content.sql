-- 增量迁移：补齐 2026-11-16 快照复核后新发现的 6 个引用内容字段。
--
-- 前置条件：submission_sites 已含前两批 v2 列（共 14 列）：
--   accepts_product_types, approval_time, submit_steps, submit_requirements,
--   gotchas, rejection_reasons, icon_url, screenshot_url,
--   you_need, what_you_get, eligibility, faq, source_lead, og_image_url
-- 也就是说本文件执行后，上面 14 列都应存在。
-- 若前两批尚未迁移，依次先执行：
--   schema/migrate-submission-sites-v2.sql           （accepts_product_types）
--   schema/migrate-submission-sites-v2-details.sql   （approval_time / steps / requirements / gotchas / rejection_reasons / icon_url / screenshot_url）
--
-- 本文件执行前先检查缺列：
--   wrangler d1 execute aifindr-db --remote --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name IN ('you_need','what_you_get','eligibility','faq','source_lead','og_image_url');"
-- 返回 6 行说明缺列，执行本文件；返回 0 行说明已迁移，跳过。
--
-- 执行：
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-submission-sites-v2-content.sql
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-submission-sites-v2-content.sql
--
-- 本脚本不幂等；对已含全部列的库重复执行会报 duplicate column name，属正常。
-- 已有行回填默认值，随后导入 seed 会覆盖快照行。

ALTER TABLE submission_sites ADD COLUMN you_need TEXT DEFAULT '[]';
UPDATE submission_sites SET you_need = '[]' WHERE you_need IS NULL;

ALTER TABLE submission_sites ADD COLUMN what_you_get TEXT;
ALTER TABLE submission_sites ADD COLUMN eligibility TEXT;

ALTER TABLE submission_sites ADD COLUMN faq TEXT DEFAULT '[]';
UPDATE submission_sites SET faq = '[]' WHERE faq IS NULL;

ALTER TABLE submission_sites ADD COLUMN source_lead TEXT;
ALTER TABLE submission_sites ADD COLUMN og_image_url TEXT;
