-- 社区功能升级迁移脚本
-- 执行前请备份数据库！
-- 执行方式: mysql -u root -p your_db_name < migrate_community.sql

-- 1. 帖子表：添加浏览量字段
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0 COMMENT '浏览量';

-- 2. 评论表：添加图片字段和回复父ID字段
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS images JSON COMMENT '评论图片URL列表',
  ADD COLUMN IF NOT EXISTS parent_id INT NULL DEFAULT NULL COMMENT '父评论ID（回复用）',
  ADD COLUMN IF NOT EXISTS reply_to_user_id INT NULL DEFAULT NULL COMMENT '被回复用户ID',
  ADD CONSTRAINT fk_comments_parent
    FOREIGN KEY IF NOT EXISTS (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- 注意：MySQL 5.7 不支持 ADD COLUMN IF NOT EXISTS，请改用以下兼容写法：
-- ALTER TABLE posts ADD COLUMN view_count INT NOT NULL DEFAULT 0;
-- ALTER TABLE comments ADD COLUMN images JSON;
-- ALTER TABLE comments ADD COLUMN parent_id INT NULL DEFAULT NULL;
-- ALTER TABLE comments ADD COLUMN reply_to_user_id INT NULL DEFAULT NULL;
-- ALTER TABLE comments ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
