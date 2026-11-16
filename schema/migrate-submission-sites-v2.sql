-- 一次性迁移：为 submission_sites 增加 v2 快照的产品类型事实字段。
--
-- 仅需对「已存在 submission_sites 表、但缺 accepts_product_types」的库执行一次；
-- 新库从 schema/init.sql 建表已自带该列，无需本文件。
-- 若重跑 ETL 生成的新 seed 已含该列的 INSERT，导入前必须先完成本迁移。
--
-- 执行前先检查目标库是否已含该列（返回一行即无需执行）：
--   wrangler d1 execute aifindr-db --local  --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name = 'accepts_product_types';"
--   wrangler d1 execute aifindr-db --remote --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name = 'accepts_product_types';"
--
-- 仅在返回空结果时，对该环境执行一次：
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-submission-sites-v2.sql
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-submission-sites-v2.sql
--
-- 本脚本不幂等：SQLite 的 ADD COLUMN 不支持 IF NOT EXISTS，对已含列的库执行会报
--   SQLITE_ERROR: duplicate column name: accepts_product_types
-- 看到该错误说明列已存在，库无需迁移，直接跳过即可。
-- 已有行回填 '[]'，避免筛选与导出遇到 NULL；随后导入 seed 会覆盖快照行。

ALTER TABLE submission_sites ADD COLUMN accepts_product_types TEXT DEFAULT '[]';
UPDATE submission_sites SET accepts_product_types = '[]' WHERE accepts_product_types IS NULL;
