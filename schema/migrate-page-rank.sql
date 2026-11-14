-- 一次性迁移：为 submission_sites 增加 Open PageRank 自动刷新所需字段。
--
-- 仅需对「已存在 submission_sites 表、但缺少这两个字段」的库执行一次；
-- 新库从 schema/init.sql 建表已自带 page_rank / page_rank_checked_at，无需本文件。
-- 若重跑 ETL 生成的新 seed 已含这两个字段的 INSERT，则导入前也必须先完成本迁移。
--
-- 执行：
--   wrangler d1 execute aifindr-db --remote --file=./schema/migrate-page-rank.sql
--   wrangler d1 execute aifindr-db --local  --file=./schema/migrate-page-rank.sql   # 本地库同理
--
-- 说明：D1 / SQLite 一条 ALTER 只能加一列，故分两条语句。

ALTER TABLE submission_sites ADD COLUMN page_rank REAL;
ALTER TABLE submission_sites ADD COLUMN page_rank_checked_at TEXT;
