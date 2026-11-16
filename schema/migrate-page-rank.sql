-- 一次性迁移：为 submission_sites 增加 Open PageRank 自动刷新所需字段。
--
-- 仅需对「已存在 submission_sites 表、但缺少这两个字段」的库执行一次；
-- 新库从 schema/init.sql 建表已自带 page_rank / page_rank_checked_at，无需本文件。
-- 若重跑 ETL 生成的新 seed 已含这两个字段的 INSERT，则导入前也必须先完成本迁移。
--
-- 执行前先检查目标库是否已含这两列（返回两行即无需执行）：
--   wrangler d1 execute aifindr-db --local  --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name LIKE 'page_rank%';"
--   wrangler d1 execute aifindr-db --remote --command "SELECT name FROM pragma_table_info('submission_sites') WHERE name LIKE 'page_rank%';"
--
-- 仅在返回空结果（表存在但缺列）时，对该环境执行一次：
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-page-rank.sql
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-page-rank.sql
--
-- 本脚本不幂等：SQLite 的 ADD COLUMN 不支持 IF NOT EXISTS，对已含列的库执行会报
--   SQLITE_ERROR: duplicate column name: page_rank
-- 看到该错误说明列已存在，库无需迁移，直接跳过即可。
-- 说明：D1 / SQLite 一条 ALTER 只能加一列，故分两条语句。

ALTER TABLE submission_sites ADD COLUMN page_rank REAL;
ALTER TABLE submission_sites ADD COLUMN page_rank_checked_at TEXT;
