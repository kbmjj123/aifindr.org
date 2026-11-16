-- 增量迁移：只补 v2 详情字段（7 列），不碰 accepts_product_types。
--
-- 适用环境：之前已执行过旧版迁移（schema/migrate-submission-sites-v2.sql 的前身），
-- submission_sites 里已经有 accepts_product_types，但没有以下 7 列。
-- 典型症状：执行旧迁移时报 SQLITE_ERROR: duplicate column name: accepts_product_types。
--
-- 如果库里连 accepts_product_types 都没有（全新或未迁移过的库），
-- 不要执行本文件，改执行 schema/migrate-submission-sites-v2.sql（含全部 8 列）。
--
-- 执行前可用下面的命令确认缺哪些列（8 个名字都应出现）：
--   wrangler d1 execute aifindr-db --remote --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name IN ('accepts_product_types','approval_time','submit_steps','submit_requirements','gotchas','rejection_reasons','icon_url','screenshot_url');"
--
-- 执行（本文件不幂等；对已含全部列的库重复执行会报 duplicate column name，属正常）：
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-submission-sites-v2-details.sql
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-submission-sites-v2-details.sql

ALTER TABLE submission_sites ADD COLUMN approval_time TEXT;

ALTER TABLE submission_sites ADD COLUMN submit_steps TEXT DEFAULT '[]';
UPDATE submission_sites SET submit_steps = '[]' WHERE submit_steps IS NULL;

ALTER TABLE submission_sites ADD COLUMN submit_requirements TEXT DEFAULT '[]';
UPDATE submission_sites SET submit_requirements = '[]' WHERE submit_requirements IS NULL;

ALTER TABLE submission_sites ADD COLUMN gotchas TEXT DEFAULT '[]';
UPDATE submission_sites SET gotchas = '[]' WHERE gotchas IS NULL;

ALTER TABLE submission_sites ADD COLUMN rejection_reasons TEXT DEFAULT '[]';
UPDATE submission_sites SET rejection_reasons = '[]' WHERE rejection_reasons IS NULL;

ALTER TABLE submission_sites ADD COLUMN icon_url TEXT;
ALTER TABLE submission_sites ADD COLUMN screenshot_url TEXT;
