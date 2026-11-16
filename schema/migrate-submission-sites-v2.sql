-- 一次性迁移：为 submission_sites 增加 v2 快照的扩展事实字段（2026-11-16 批次）。
--
-- 新增 8 列：
--   accepts_product_types  产品类型事实（JSON 数组）
--   approval_time          快照 FAQ 提炼的典型审批时长
--   submit_steps           来源页提交步骤（JSON 数组，带 SubmitMap 署名引用）
--   submit_requirements    表单要求清单（JSON 数组，同上）
--   gotchas                提交注意事项（JSON 数组，同上）
--   rejection_reasons      被拒原因（JSON 数组，同上）
--   icon_url / screenshot_url  平台图标与首页截图（来源快照 CDN）
--
-- 仅需对「已存在 submission_sites 表、但缺这些列」的库执行一次；
-- 新库从 schema/init.sql 建表已自带全部列，无需本文件。
-- 导入包含新列的 seed（schema/seed-submission-sites.sql）前必须先完成本迁移。
--
-- 执行前先检查目标库（返回 0 行说明需要迁移）：
--   wrangler d1 execute aifindr-db --local  --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name IN ('accepts_product_types','approval_time','submit_steps','submit_requirements','gotchas','rejection_reasons','icon_url','screenshot_url');"
--   wrangler d1 execute aifindr-db --remote --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name IN ('accepts_product_types','approval_time','submit_steps','submit_requirements','gotchas','rejection_reasons','icon_url','screenshot_url');"
--
-- 仅在返回不足 8 行时，对该环境执行一次：
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-submission-sites-v2.sql
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-submission-sites-v2.sql
--
-- 本脚本不幂等。如果库里已经有 accepts_product_types（旧版迁移已执行过），
-- 第一条语句就会报 SQLITE_ERROR: duplicate column name: accepts_product_types，
-- 后面的 7 个详情列并没有加上：此时不要跳过，改执行增量文件
--   schema/migrate-submission-sites-v2-details.sql（只补其余 7 列）。
-- 已有行回填默认值，避免筛选与导出遇到 NULL；随后导入 seed 会覆盖快照行。

ALTER TABLE submission_sites ADD COLUMN accepts_product_types TEXT DEFAULT '[]';
UPDATE submission_sites SET accepts_product_types = '[]' WHERE accepts_product_types IS NULL;

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
