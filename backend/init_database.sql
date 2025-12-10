-- ============================================
-- 云端小筑共享菜园 - 数据库初始化脚本
-- 版本: 1.0.0
-- 日期: 2024-12-10
-- 说明: 一键创建所有数据库表和初始数据
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 禁用外键检查（允许删除有外键约束的表）
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS garden_db
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE garden_db;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信OpenID',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(500) COMMENT '头像URL',
    phone VARCHAR(20) COMMENT '手机号',
    role ENUM('tenant', 'admin') DEFAULT 'tenant' COMMENT '用户角色',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 菜地表 (gardens)
-- ============================================
DROP TABLE IF EXISTS gardens;
CREATE TABLE gardens (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '菜地ID',
    name VARCHAR(100) NOT NULL COMMENT '菜地名称',
    area DECIMAL(10, 2) NOT NULL COMMENT '面积(平方米)',
    price DECIMAL(10, 2) NOT NULL COMMENT '租金(元/月)',
    status ENUM('available', 'rented', 'maintenance') DEFAULT 'available' COMMENT '状态',
    location VARCHAR(200) COMMENT '位置描述',
    images JSON COMMENT '图片URL列表',
    video_stream_url VARCHAR(500) COMMENT '视频流地址',
    description TEXT COMMENT '详细描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜地表';

-- ============================================
-- 3. 订单表 (orders)
-- ============================================
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
    user_id INT NOT NULL COMMENT '用户ID',
    garden_id INT NOT NULL COMMENT '菜地ID',
    start_date DATE NOT NULL COMMENT '租用开始日期',
    end_date DATE NOT NULL COMMENT '租用结束日期',
    total_price DECIMAL(10, 2) NOT NULL COMMENT '总价',
    status ENUM('pending', 'paid', 'active', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
    payment_time TIMESTAMP NULL COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_garden_id (garden_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ============================================
-- 4. 社区帖子表 (posts)
-- ============================================
DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '帖子ID',
    user_id INT NOT NULL COMMENT '用户ID',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容',
    images JSON COMMENT '图片URL列表',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区帖子表';

-- ============================================
-- 5. 评论表 (comments)
-- ============================================
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
    post_id INT NOT NULL COMMENT '帖子ID',
    user_id INT NOT NULL COMMENT '用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================
-- 6. 点赞表 (likes)
-- ============================================
DROP TABLE IF EXISTS likes;
CREATE TABLE likes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '点赞ID',
    post_id INT NOT NULL COMMENT '帖子ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    UNIQUE KEY uq_post_user_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- ============================================
-- 7. 增值服务表 (services)
-- ============================================
DROP TABLE IF EXISTS services;
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '服务ID',
    order_id INT NOT NULL COMMENT '订单ID',
    user_id INT NOT NULL COMMENT '用户ID',
    service_type ENUM('代浇水', '代施肥', '代除草', '代除虫', '代收获') NOT NULL COMMENT '服务类型',
    price DECIMAL(10, 2) NOT NULL COMMENT '服务价格',
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='增值服务表';

-- ============================================
-- 8. 任务提醒表 (reminders)
-- ============================================
DROP TABLE IF EXISTS reminders;
CREATE TABLE reminders (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '提醒ID',
    order_id INT NOT NULL COMMENT '订单ID',
    user_id INT NOT NULL COMMENT '用户ID',
    task_type ENUM('watering', 'fertilizing', 'weeding', 'harvesting') NOT NULL COMMENT '任务类型',
    content TEXT NOT NULL COMMENT '提醒内容',
    remind_time TIMESTAMP NOT NULL COMMENT '提醒时间',
    status ENUM('pending', 'sent', 'completed') DEFAULT 'pending' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_remind_time (remind_time),
    INDEX idx_status (status),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务提醒表';

-- ============================================
-- 9. 作物基础信息表 (crops)
-- ============================================
DROP TABLE IF EXISTS crops;
CREATE TABLE crops (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '作物ID',
    name VARCHAR(100) NOT NULL COMMENT '作物名称',
    scientific_name VARCHAR(200) COMMENT '学名',
    type VARCHAR(20) NOT NULL COMMENT '作物类型',
    total_growth_days INT COMMENT '总生长周期(天)',
    environment_requirements JSON COMMENT '环境需求',
    difficulty INT DEFAULT 3 COMMENT '种植难度(1-5)',
    common_pests JSON COMMENT '常见病虫害列表',
    description VARCHAR(500) COMMENT '作物描述',
    planting_tips VARCHAR(1000) COMMENT '种植技巧',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作物基础信息表';

-- ============================================
-- 10. 作物生长阶段规则表 (crop_growth_stages)
-- ============================================
DROP TABLE IF EXISTS crop_growth_stages;
CREATE TABLE crop_growth_stages (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    crop_id INT NOT NULL COMMENT '作物ID',
    stage VARCHAR(20) NOT NULL COMMENT '生长阶段',
    stage_days INT COMMENT '该阶段持续天数',
    watering_frequency INT COMMENT '浇水频率(天/次)',
    watering_amount FLOAT COMMENT '单次浇水量(升)',
    fertilizing_frequency INT COMMENT '施肥频率(天/次)',
    fertilizer_type VARCHAR(100) COMMENT '肥料类型',
    weeding_frequency INT COMMENT '除草频率(天/次)',
    pest_check_frequency INT COMMENT '病虫害检查频率(天/次)',
    other_tasks JSON COMMENT '其他特殊任务',
    stage_tips VARCHAR(500) COMMENT '该阶段关键提示',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_crop_id (crop_id),
    INDEX idx_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作物生长阶段规则表';

-- ============================================
-- 11. 物联网传感器表 (iot_sensors)
-- ============================================
DROP TABLE IF EXISTS iot_sensors;
CREATE TABLE iot_sensors (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '传感器ID',
    garden_id INT NOT NULL COMMENT '关联菜地ID',
    sensor_type VARCHAR(50) NOT NULL COMMENT '传感器类型',
    device_id VARCHAR(100) UNIQUE COMMENT '设备ID',
    location VARCHAR(200) COMMENT '传感器位置',
    is_active INT DEFAULT 1 COMMENT '是否激活',
    last_reading_time TIMESTAMP NULL COMMENT '最后读数时间',
    reading_interval INT DEFAULT 300 COMMENT '读数间隔(秒)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_garden_id (garden_id),
    INDEX idx_sensor_type (sensor_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物联网传感器表';

-- ============================================
-- 12. 物联网读数表 (iot_readings)
-- ============================================
DROP TABLE IF EXISTS iot_readings;
CREATE TABLE iot_readings (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '读数ID',
    sensor_id INT NOT NULL COMMENT '传感器ID',
    value FLOAT NOT NULL COMMENT '读数值',
    unit VARCHAR(20) COMMENT '单位',
    is_abnormal INT DEFAULT 0 COMMENT '是否异常',
    abnormal_reason VARCHAR(200) COMMENT '异常原因',
    reading_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '读数时间',
    INDEX idx_sensor_id (sensor_id),
    INDEX idx_reading_time (reading_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物联网读数表';

-- ============================================
-- 13. 种植记录表 (planting_records)
-- ============================================
DROP TABLE IF EXISTS planting_records;
CREATE TABLE planting_records (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    garden_id INT NOT NULL COMMENT '菜地ID',
    crop_id INT NOT NULL COMMENT '作物ID',
    user_id INT NOT NULL COMMENT '种植用户ID',
    planting_date TIMESTAMP NULL COMMENT '种植日期',
    expected_harvest_date TIMESTAMP NULL COMMENT '预计收获日期',
    actual_harvest_date TIMESTAMP NULL COMMENT '实际收获日期',
    current_stage VARCHAR(20) COMMENT '当前生长阶段',
    current_stage_day INT DEFAULT 1 COMMENT '当前阶段第几天',
    quantity INT COMMENT '种植数量',
    area FLOAT COMMENT '占地面积(平方米)',
    status VARCHAR(20) DEFAULT 'growing' COMMENT '状态',
    notes VARCHAR(500) COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_garden_id (garden_id),
    INDEX idx_crop_id (crop_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='种植记录表';

-- ============================================
-- 14. 智能提醒记录表 (smart_reminders)
-- ============================================
DROP TABLE IF EXISTS smart_reminders;
CREATE TABLE smart_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '提醒ID',
    user_id INT NOT NULL COMMENT '用户ID',
    garden_id INT COMMENT '菜地ID',
    planting_record_id INT COMMENT '种植记录ID',
    reminder_type VARCHAR(50) NOT NULL COMMENT '提醒类型',
    title VARCHAR(200) NOT NULL COMMENT '提醒标题',
    description VARCHAR(1000) COMMENT '提醒描述',
    remind_time TIMESTAMP NOT NULL COMMENT '提醒时间',
    priority INT DEFAULT 3 COMMENT '优先级(1-5)',
    source VARCHAR(50) COMMENT '来源',
    extra_data JSON COMMENT '元数据',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_garden_id (garden_id),
    INDEX idx_remind_time (remind_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='智能提醒记录表';

-- ============================================
-- 插入初始数据
-- ============================================

-- 插入测试用户
INSERT INTO users (openid, nickname, avatar, phone, role) VALUES
('test_openid_001', '测试用户1', 'https://example.com/avatar1.jpg', '13800138001', 'tenant'),
('test_openid_002', '测试用户2', 'https://example.com/avatar2.jpg', '13800138002', 'tenant'),
('admin_openid_001', '管理员', 'https://example.com/admin.jpg', '13900139000', 'admin');

-- 插入菜地数据
INSERT INTO gardens (name, area, price, status, location, images, description) VALUES
('阳光菜地A区01号', 20.00, 300.00, 'available', '园区东侧第一排',
 '["https://example.com/garden1.jpg", "https://example.com/garden1-2.jpg"]',
 '光照充足,土质肥沃,适合种植各类蔬菜'),
('阳光菜地A区02号', 15.00, 250.00, 'available', '园区东侧第一排',
 '["https://example.com/garden2.jpg"]',
 '靠近水源,方便浇灌'),
('阳光菜地B区01号', 25.00, 350.00, 'rented', '园区西侧第二排',
 '["https://example.com/garden3.jpg"]',
 '大面积菜地,适合大规模种植'),
('阳光菜地B区02号', 30.00, 400.00, 'available', '园区西侧第二排',
 '["https://example.com/garden4.jpg"]',
 '高级菜地,配备自动灌溉系统'),
('阳光菜地C区01号', 10.00, 200.00, 'maintenance', '园区南侧',
 '["https://example.com/garden5.jpg"]',
 '小型菜地,适合新手试种');

-- 插入作物数据（番茄示例）
INSERT INTO crops (name, scientific_name, type, total_growth_days, environment_requirements, difficulty, common_pests, description, planting_tips) VALUES
('番茄', 'Solanum lycopersicum', 'vegetable', 90,
 '{"temperature": {"min": 15, "max": 30, "optimal": 22}, "humidity": {"min": 60, "max": 80, "optimal": 70}, "soil_ph": {"min": 6.0, "max": 7.0, "optimal": 6.5}}',
 3, '["白粉病", "蚜虫", "青虫"]',
 '番茄是最受欢迎的蔬菜之一,营养丰富,适合各种烹饪方式',
 '需要充足阳光,定期修剪侧枝,注意防治病虫害'),
('生菜', 'Lactuca sativa', 'vegetable', 60,
 '{"temperature": {"min": 10, "max": 25, "optimal": 18}, "humidity": {"min": 50, "max": 70, "optimal": 60}, "soil_ph": {"min": 6.0, "max": 7.5, "optimal": 6.8}}',
 2, '["蚜虫", "蜗牛"]',
 '生菜生长快速,适合新手种植',
 '保持土壤湿润,避免强光直射'),
('黄瓜', 'Cucumis sativus', 'vegetable', 70,
 '{"temperature": {"min": 18, "max": 32, "optimal": 25}, "humidity": {"min": 60, "max": 90, "optimal": 75}, "soil_ph": {"min": 6.0, "max": 7.0, "optimal": 6.5}}',
 3, '["白粉病", "霜霉病", "蚜虫"]',
 '黄瓜需要充足的水分和营养',
 '需要搭架,及时采收嫩瓜');

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 插入番茄生长阶段规则
INSERT INTO crop_growth_stages (crop_id, stage, stage_days, watering_frequency, watering_amount, fertilizing_frequency, fertilizer_type, weeding_frequency, pest_check_frequency, stage_tips) VALUES
(1, 'seed', 7, 1, 0.5, NULL, NULL, NULL, NULL, '保持土壤湿润,温度保持在20-25度'),
(1, 'seedling', 20, 2, 1.0, 10, '氮肥', 7, 3, '适当控水促进根系发育'),
(1, 'growth', 30, 2, 2.0, 7, '复合肥', 7, 3, '开始搭架,修剪侧枝'),
(1, 'flowering', 15, 2, 2.5, 7, '磷钾肥', 7, 3, '注意授粉,防止落花'),
(1, 'fruiting', 15, 2, 3.0, 7, '钾肥', 7, 3, '及时摘除老叶,保证通风'),
(1, 'harvest', 10, 2, 2.0, NULL, NULL, 7, 3, '分批采收,采收后及时追肥');

-- ============================================
-- 数据库初始化完成
-- ============================================

-- 显示所有表
SHOW TABLES;

-- 显示表统计信息
SELECT
    TABLE_NAME as '表名',
    TABLE_ROWS as '行数',
    DATA_LENGTH as '数据大小(字节)',
    CREATE_TIME as '创建时间'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'garden_db'
ORDER BY TABLE_NAME;

-- 提示信息
SELECT '✅ 数据库初始化成功!' as '状态',
       '已创建14张表,并插入测试数据' as '说明',
       'garden_db' as '数据库名';
