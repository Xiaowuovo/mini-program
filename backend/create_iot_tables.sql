-- 创建物联网相关表的 SQL 脚本
-- 用于智能提醒系统的物联网功能

USE garden_db;

-- 1. IoT传感器表
CREATE TABLE IF NOT EXISTS `iot_sensors` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '传感器ID',
  `garden_id` INT NOT NULL COMMENT '关联菜地ID',
  `sensor_type` VARCHAR(50) NOT NULL COMMENT '传感器类型(temperature/humidity/soil_moisture/light/soil_ph)',
  `device_id` VARCHAR(100) UNIQUE COMMENT '设备ID',
  `location` VARCHAR(200) COMMENT '传感器位置',
  `is_active` INT DEFAULT 1 COMMENT '是否激活(1=激活,0=停用)',
  `last_reading_time` TIMESTAMP NULL COMMENT '最后读数时间',
  `reading_interval` INT DEFAULT 300 COMMENT '读数间隔(秒)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_garden` (`garden_id`),
  INDEX `idx_type` (`sensor_type`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物联网传感器表';

-- 2. IoT传感器读数表
CREATE TABLE IF NOT EXISTS `iot_readings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '读数ID',
  `sensor_id` INT NOT NULL COMMENT '传感器ID',
  `value` FLOAT NOT NULL COMMENT '读数值',
  `unit` VARCHAR(20) COMMENT '单位',
  `is_abnormal` INT DEFAULT 0 COMMENT '是否异常(1=异常,0=正常)',
  `abnormal_reason` VARCHAR(200) COMMENT '异常原因',
  `reading_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '读数时间',
  INDEX `idx_sensor_time` (`sensor_id`, `reading_time`),
  INDEX `idx_abnormal` (`is_abnormal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物联网传感器读数表';

-- 3. 种植记录表 (如果不存在)
CREATE TABLE IF NOT EXISTS `planting_records` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '种植记录ID',
  `garden_id` INT NOT NULL COMMENT '菜地ID',
  `crop_id` INT NOT NULL COMMENT '作物ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `planting_date` TIMESTAMP NULL COMMENT '种植日期',
  `expected_harvest_date` TIMESTAMP NULL COMMENT '预计收获日期',
  `actual_harvest_date` TIMESTAMP NULL COMMENT '实际收获日期',
  `current_stage` VARCHAR(20) COMMENT '当前生长阶段',
  `current_stage_day` INT DEFAULT 1 COMMENT '当前阶段第几天',
  `quantity` INT COMMENT '种植数量',
  `area` FLOAT COMMENT '占地面积(平方米)',
  `status` VARCHAR(20) DEFAULT 'growing' COMMENT '状态(growing/harvested/failed)',
  `notes` VARCHAR(500) COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_garden` (`garden_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_crop` (`crop_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='种植记录表';

-- 4. 智能提醒表 (如果不存在)
CREATE TABLE IF NOT EXISTS `smart_reminders` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '提醒ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `garden_id` INT COMMENT '菜地ID',
  `planting_record_id` INT COMMENT '种植记录ID',
  `reminder_type` VARCHAR(50) NOT NULL COMMENT '提醒类型(watering/fertilizing/weeding/pest_check/harvest/environment_alert)',
  `title` VARCHAR(200) NOT NULL COMMENT '提醒标题',
  `description` VARCHAR(1000) COMMENT '提醒描述',
  `remind_time` TIMESTAMP NOT NULL COMMENT '提醒时间',
  `priority` INT DEFAULT 3 COMMENT '优先级(1-5,5最高)',
  `source` VARCHAR(50) COMMENT '来源(rule_based/iot_triggered/manual)',
  `extra_data` JSON COMMENT '元数据',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态(pending/completed/ignored)',
  `completed_at` TIMESTAMP NULL COMMENT '完成时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_status` (`user_id`, `status`),
  INDEX `idx_remind_time` (`remind_time`),
  INDEX `idx_type` (`reminder_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能提醒表';

-- 验证表是否创建成功
SHOW TABLES LIKE '%iot%';
SHOW TABLES LIKE '%planting%';
SHOW TABLES LIKE '%smart%';

-- 显示表结构
DESCRIBE iot_sensors;
DESCRIBE iot_readings;
DESCRIBE planting_records;
DESCRIBE smart_reminders;
