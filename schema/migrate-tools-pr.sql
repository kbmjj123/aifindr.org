-- 一次性迁移：为 tools 表增加 PR 发布来源追溯列 pr_number / pr_url。
--
-- 仅需对「已存在 tools 表、但缺少这两列」的库执行一次；
-- 新库从 schema/init.sql 建表已自带 pr_number / pr_url，无需本文件。
--
-- 执行前先检查目标库是否已含这两列（返回两行即无需执行）：
--   wrangler d1 execute aifindr-db --local  --command "SELECT name FROM pragma_table_info('tools') WHERE name LIKE 'pr_%';"
--   wrangler d1 execute aifindr-db --remote --command "SELECT name FROM pragma_table_info('tools') WHERE name LIKE 'pr_%';"
--
-- 仅在返回空结果（表存在但缺列）时，对该环境执行一次：
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-tools-pr.sql
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-tools-pr.sql
--
-- 本脚本不幂等：SQLite 的 ADD COLUMN 不支持 IF NOT EXISTS，对已含列的库执行会报
--   SQLITE_ERROR: duplicate column name: pr_number
-- 看到该错误说明列已存在，库无需迁移，直接跳过即可。
-- 说明：D1 / SQLite 一条 ALTER 只能加一列，故分两条语句。

ALTER TABLE tools ADD COLUMN pr_number INTEGER;
ALTER TABLE tools ADD COLUMN pr_url TEXT;
