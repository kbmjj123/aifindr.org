-- aifindr.org — D1 数据库重置
-- 用法：wrangler d1 execute aifindr-db --remote --file=./schema/reset.sql
-- 警告：会删除所有数据，仅调试阶段使用

DROP TABLE IF EXISTS published_links;
DROP TABLE IF EXISTS generated_articles;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS tool_videos;
DROP TABLE IF EXISTS tool_images;
DROP TABLE IF EXISTS tool_tags;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS users;
