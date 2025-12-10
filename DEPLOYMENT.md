# 🚀 共享菜园"云端小筑"部署指南

> **完整的从Git克隆到运行的部署方案**

---

## 📋 目录
- [环境要求](#环境要求)
- [Git部署流程](#git部署流程)
- [后端部署](#后端部署)
- [小程序部署](#小程序部署)
- [生产环境部署](#生产环境部署)
- [常见问题](#常见问题)

---

## 🔧 环境要求

### 后端环境
- ✅ Python 3.8+ (推荐3.12)
- ✅ MySQL 8.0+
- ✅ Git 2.0+
- ⭐ Redis 7.0+ (可选，用于缓存)

### 小程序环境
- ✅ 微信开发者工具
- ✅ 微信小程序账号（AppID）

### 操作系统
- ✅ Windows 10/11
- ✅ Linux (Ubuntu 20.04+, CentOS 7+)
- ✅ macOS 10.15+

---

## ✅ 快速部署检查清单

**新机器部署前必读！按照这个清单逐步操作，10分钟完成部署。**

### 📋 环境准备检查清单

- [ ] **安装Python 3.8+**
  ```bash
  python --version  # 应显示 Python 3.8 或更高版本
  ```

- [ ] **安装MySQL 8.0+**
  ```bash
  mysql --version   # 应显示 MySQL 8.0 或更高版本
  ```

- [ ] **安装Git**
  ```bash
  git --version     # 应显示 git version 2.x
  ```

- [ ] **安装微信开发者工具**
  - 下载地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 🚀 快速部署步骤（10分钟）

#### 步骤 1: 克隆项目 (1分钟)
```bash
git clone https://github.com/your-username/garden-miniprogram.git
cd garden-miniprogram
```

#### 步骤 2: 初始化数据库 (2分钟)
```bash
cd backend

# Windows:
init_db.bat

# Linux/Mac:
chmod +x init_db.sh
./init_db.sh

# 输入MySQL密码（默认: 123456）
```

#### 步骤 3: 配置后端 (2分钟)
```bash
# 复制环境配置文件
copy .env.example .env    # Windows
cp .env.example .env      # Linux/Mac

# 编辑.env文件，修改以下配置：
# DATABASE_URL=mysql+pymysql://root:你的密码@localhost:3306/garden_db
# WECHAT_APPID=你的小程序AppID
# WECHAT_SECRET=你的小程序Secret
```

#### 步骤 4: 安装Python依赖 (3分钟)
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/Mac

# 安装依赖
pip install -r requirements.txt
```

#### 步骤 5: 启动后端服务 (1分钟)
```bash
# Windows:
run.bat

# Linux/Mac:
chmod +x start.sh
./start.sh

# 验证: 访问 http://localhost:8000/api/docs
```

#### 步骤 6: 启动小程序 (1分钟)
```
1. 打开微信开发者工具
2. 导入项目 -> 选择 miniprogram 目录
3. 填入AppID（或使用测试号）
4. 详情 -> 本地设置 -> ✅ 不校验合法域名
5. 点击编译
```

### ✅ 部署成功验证

完成以上步骤后，检查:

- [ ] **后端API正常**
  - 访问 http://localhost:8000/api/docs 能看到API文档
  - 访问 http://localhost:8000/health 返回 `{"status":"healthy"}`

- [ ] **数据库正常**
  ```bash
  mysql -u root -p
  USE garden_db;
  SELECT COUNT(*) FROM gardens;  # 应返回 5
  ```

- [ ] **小程序正常**
  - 模拟器中能看到首页
  - 菜地列表能正常加载
  - 控制台无错误信息

### 🎉 部署完成！

如果以上检查都通过，恭喜你！项目已成功部署。

---

## 🌟 Git部署流程（详细说明）

### 方式一：从Git仓库克隆（推荐）

#### 第一步：克隆项目

```bash
# 克隆项目到本地
git clone https://github.com/your-username/garden-miniprogram.git

# 或使用SSH
git clone git@github.com:your-username/garden-miniprogram.git

# 进入项目目录
cd garden-miniprogram
```

#### 第二步：查看项目结构

```bash
# Windows
dir /b

# Linux/Mac
ls -la
```

你应该看到以下核心目录：
```
backend/          # 后端代码
miniprogram/      # 小程序代码
docs/            # 技术文档
README.md        # 项目说明
DEPLOYMENT.md    # 部署指南（本文件）
```

#### 第三步：快速启动（开发环境）

**Windows系统:**
```bash
# 方式1：使用一键启动脚本
启动项目.bat

# 方式2：手动启动
# 1. 启动后端
cd backend
run.bat

# 2. 在另一个终端启动小程序
# 打开微信开发者工具 -> 导入项目 -> 选择 miniprogram 目录
```

**Linux/Mac系统:**
```bash
# 1. 启动后端
cd backend
chmod +x start.sh  # 首次需要给权限
./start.sh

# 2. 启动小程序
# 打开微信开发者工具 -> 导入项目 -> 选择 miniprogram 目录
```

---

### 方式二：下载ZIP压缩包

如果无法使用Git，可以从GitHub下载ZIP：

1. 访问项目页面
2. 点击绿色 "Code" 按钮
3. 选择 "Download ZIP"
4. 解压到目标目录
5. 按照上述步骤继续部署

---

## 🔨 后端部署（详细步骤）

### 步骤1️⃣：安装MySQL数据库

#### Windows:
```bash
# 1. 下载MySQL 8.0
# 访问：https://dev.mysql.com/downloads/mysql/

# 2. 安装后检查服务
net start MySQL

# 3. 登录MySQL设置root密码
mysql -u root -p

# 在MySQL中执行：
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
```

#### Linux (Ubuntu):
```bash
# 安装MySQL
sudo apt update
sudo apt install mysql-server

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

### 步骤2️⃣：创建数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE garden_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 查看数据库
SHOW DATABASES;

# 退出
EXIT;
```

### 步骤3️⃣：安装Python依赖

```bash
# 进入后端目录
cd backend

# Windows - 创建虚拟环境
python -m venv venv

# Windows - 激活虚拟环境
.\venv\Scripts\activate

# Linux/Mac - 创建虚拟环境
python3 -m venv venv

# Linux/Mac - 激活虚拟环境
source venv/bin/activate

# 升级pip（推荐）
python -m pip install --upgrade pip

# 安装所有依赖
pip install -r requirements.txt

# 验证安装
pip list
```

**常见依赖安装问题:**

```bash
# 如果pip install很慢，使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 如果出现SSL错误
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

### 步骤4️⃣：配置环境变量

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env

# 编辑 .env 文件
notepad .env  # Windows
vim .env      # Linux/Mac
```

**完整的.env配置示例：**

```env
# ============ 应用配置 ============
APP_NAME=云端小筑
APP_VERSION=1.0.0
DEBUG=True
HOST=0.0.0.0
PORT=8000

# ============ 数据库配置 ============
# 格式: mysql+pymysql://用户名:密码@主机:端口/数据库名
DATABASE_URL=mysql+pymysql://root:123456@localhost:3306/garden_db

# ============ 微信小程序配置 ============
# ⚠️ 重要：请替换为你自己的AppID和Secret
WECHAT_APPID=wx1234567890abcdef
WECHAT_SECRET=your_wechat_secret_key_here

# ============ 安全配置 ============
# ⚠️ 生产环境务必修改为复杂的随机字符串
SECRET_KEY=your-super-secret-key-please-change-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ============ CORS配置 ============
CORS_ORIGINS=http://localhost,http://127.0.0.1

# ============ Redis配置（可选）============
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_DB=0
```

**⚠️ 重要提醒:**
1. `DATABASE_URL`: 必须修改密码为你的MySQL密码
2. `WECHAT_APPID` 和 `WECHAT_SECRET`: 从微信公众平台获取
3. `SECRET_KEY`: 生产环境必须改为复杂的随机字符串

### 步骤5️⃣：初始化数据库表 ⭐⭐⭐

**重要：这是新机器部署的关键步骤!**

项目提供了一键初始化脚本,会自动创建所有表和测试数据。

#### **方式一：使用一键初始化脚本（强烈推荐）**

**Windows系统:**
```bash
# 进入backend目录
cd backend

# 运行初始化脚本
init_db.bat

# 按提示输入MySQL root密码（默认: 123456）
```

**Linux/Mac系统:**
```bash
# 进入backend目录
cd backend

# 给脚本执行权限
chmod +x init_db.sh

# 运行初始化脚本
./init_db.sh

# 按提示输入MySQL root密码
```

**脚本会自动完成:**
- ✅ 创建 garden_db 数据库
- ✅ 创建14张数据表
- ✅ 插入测试数据（用户、菜地、作物等）
- ✅ 显示初始化结果

#### **方式二：手动执行SQL（备选方案）**

如果一键脚本无法使用,可以手动执行:

```bash
# 1. 登录MySQL
mysql -u root -p

# 2. 执行初始化脚本
source backend/init_database.sql

# 或者在命令行直接导入
mysql -u root -p < backend/init_database.sql
```

#### **方式三：使用数据库管理工具**

使用 Navicat、MySQL Workbench、phpMyAdmin等工具:
1. 连接到MySQL
2. 打开 `backend/init_database.sql` 文件
3. 执行SQL脚本

#### **验证数据库初始化**

```bash
# 登录MySQL
mysql -u root -p

# 使用数据库
USE garden_db;

# 查看所有表
SHOW TABLES;

# 查看表数据
SELECT COUNT(*) FROM users;    -- 应该有3条测试用户
SELECT COUNT(*) FROM gardens;  -- 应该有5条菜地数据
SELECT COUNT(*) FROM crops;    -- 应该有3条作物数据

# 退出
EXIT;
```

**期望看到的表列表:**
```
+----------------------------+
| Tables_in_garden_db        |
+----------------------------+
| comments                   |
| crop_growth_stages         |
| crops                      |
| gardens                    |
| iot_readings               |
| iot_sensors                |
| likes                      |
| orders                     |
| planting_records           |
| posts                      |
| reminders                  |
| services                   |
| smart_reminders            |
| users                      |
+----------------------------+
14 rows in set
```

#### **初始化后的测试数据**

脚本会自动创建以下测试数据:

**测试用户 (3个):**
- 测试用户1 (openid: test_openid_001)
- 测试用户2 (openid: test_openid_002)
- 管理员 (openid: admin_openid_001)

**菜地数据 (5个):**
- 阳光菜地A区01号 - 可租用 (300元/月)
- 阳光菜地A区02号 - 可租用 (250元/月)
- 阳光菜地B区01号 - 已租出 (350元/月)
- 阳光菜地B区02号 - 可租用 (400元/月)
- 阳光菜地C区01号 - 维护中 (200元/月)

**作物数据 (3种):**
- 番茄 (含完整生长阶段规则)
- 生菜
- 黄瓜

---

### 🔧 数据库初始化常见问题

#### 问题1: "Access denied for user 'root'@'localhost'"

**原因:** MySQL密码错误

**解决方案:**
```bash
# 确认MySQL root密码
# 如果忘记密码,需要重置:

# Windows:
net stop MySQL
mysqld --skip-grant-tables
# 在新窗口:
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
EXIT;

# Linux:
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
EXIT;
sudo systemctl restart mysql
```

#### 问题2: "Can't connect to MySQL server"

**原因:** MySQL服务未启动

**解决方案:**
```bash
# Windows:
net start MySQL

# Linux:
sudo systemctl start mysql
sudo systemctl enable mysql  # 设置开机自启

# Mac:
brew services start mysql
```

#### 问题3: "Database already exists"

**原因:** garden_db 数据库已存在

**解决方案:**
```bash
# 如果需要重新初始化,先删除旧数据库
mysql -u root -p

DROP DATABASE IF EXISTS garden_db;
EXIT;

# 然后重新运行初始化脚本
```

#### 问题4: "表已存在"错误

**原因:** 表已经创建过了

**解决方案:**
SQL脚本使用了 `DROP TABLE IF EXISTS`,理论上不会出现此问题。
如果出现,可以手动删除所有表或重新创建数据库。

---

### 步骤6️⃣：启动后端服务

```bash
# 确保在backend目录下
cd backend

# 确保虚拟环境已激活
# Windows: .\venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# 方式1：使用快捷脚本（推荐）
# Windows:
run.bat

# Linux/Mac:
./start.sh

# 方式2：直接使用Python
python -m app.main

# 方式3：使用uvicorn（开发环境）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 方式4：使用uvicorn（生产环境）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 步骤7️⃣：验证部署

打开浏览器访问：

- ✅ **API文档**: http://localhost:8000/api/docs
- ✅ **健康检查**: http://localhost:8000/health
- ✅ **根路径**: http://localhost:8000/

**期望看到的响应:**

```json
// http://localhost:8000/
{
  "message": "欢迎使用共享菜园云端小筑API",
  "version": "1.0.0",
  "status": "running"
}

// http://localhost:8000/health
{
  "status": "healthy"
}
```

**🎉 如果看到以上内容，说明后端部署成功！**

---

### 🐛 后端常见问题排查

#### 问题1: 虚拟环境无法激活

```bash
# Windows PowerShell执行策略限制
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后重新激活
.\venv\Scripts\activate
```

#### 问题2: pip install失败

```bash
# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

#### 问题3: MySQL连接失败

```bash
# 检查MySQL服务状态
# Windows:
net start MySQL

# Linux:
sudo systemctl status mysql

# 检查端口是否被占用
netstat -an | findstr 3306  # Windows
netstat -an | grep 3306     # Linux
```

#### 问题4: 端口8000被占用

```bash
# Windows - 查找并结束占用进程
netstat -ano | findstr :8000
taskkill /PID <PID号> /F

# Linux - 查找并结束占用进程
lsof -i :8000
kill -9 <PID号>

# 或者修改端口
uvicorn app.main:app --port 8001
```

---

## 📱 小程序部署（详细步骤）

### 步骤1️⃣：安装微信开发者工具

1. **下载工具**
   - 访问：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
   - 选择对应操作系统版本下载
   - 安装到本地

2. **登录开发者工具**
   - 打开微信开发者工具
   - 使用微信扫码登录

### 步骤2️⃣：注册小程序（如果还没有）

1. **注册小程序账号**
   - 访问：https://mp.weixin.qq.com/
   - 点击"立即注册"
   - 选择"小程序"类型
   - 填写相关信息完成注册

2. **获取AppID和Secret**
   - 登录小程序后台
   - 开发 -> 开发管理 -> 开发设置
   - 记录AppID（必须）
   - 生成并记录AppSecret（必须）

### 步骤3️⃣：配置后端微信设置

**编辑backend/.env文件，填入你的AppID和Secret:**

```env
# ⚠️ 重要：替换为你自己的微信小程序信息
WECHAT_APPID=wx1234567890abcdef     # 从小程序后台获取
WECHAT_SECRET=your_secret_key_here  # 从小程序后台获取
```

**验证配置:**
```bash
# 重启后端服务使配置生效
# Windows:
cd backend
run.bat

# Linux/Mac:
cd backend
./start.sh
```

### 步骤4️⃣：配置小程序API地址

**方式一：直接修改utils/request.js（推荐）**

编辑 `miniprogram/utils/request.js`:

```javascript
// 开发环境 - 本机部署
const BASE_URL = 'http://localhost:8000/api'

// 开发环境 - 局域网测试（替换为你的电脑IP）
// const BASE_URL = 'http://192.168.1.100:8000/api'

// 生产环境 - 上线后的域名
// const BASE_URL = 'https://your-domain.com/api'
```

**方式二：修改app.js全局配置**

编辑 `miniprogram/app.js`:

```javascript
App({
  globalData: {
    apiBase: 'http://localhost:8000/api',  // 开发环境
    // apiBase: 'https://your-domain.com/api'  // 生产环境
    userInfo: null
  }
})
```

### 步骤5️⃣：导入项目到微信开发者工具

1. **打开微信开发者工具**

2. **导入项目**
   - 点击"+"号（导入项目）
   - 填写以下信息：
     ```
     项目目录: 选择 miniprogram 文件夹
     AppID: 填入你的小程序AppID（或使用测试号）
     项目名称: 云端小筑
     ```
   - 点击"导入"

3. **配置开发设置**
   - 点击右上角"详情"
   - 选择"本地设置"
   - ✅ 勾选"不校验合法域名、web-view、TLS版本及HTTPS证书"
   - ✅ 勾选"启用调试"（可选）

### 步骤6️⃣：运行和测试小程序

1. **编译项目**
   - 点击工具栏的"编译"按钮
   - 等待编译完成

2. **查看模拟器**
   - 左侧会显示小程序界面
   - 检查是否正常显示

3. **检查控制台**
   - 查看是否有错误信息
   - 检查网络请求是否成功

4. **真机预览**
   - 点击"预览"按钮
   - 使用微信扫描二维码
   - 在手机上测试

### 步骤7️⃣：测试核心功能

依次测试以下功能：

- ✅ **首页**: 轮播图、功能入口显示正常
- ✅ **登录**: 能够成功登录（开发环境可能需要模拟登录）
- ✅ **菜地列表**: 能够获取并显示菜地数据
- ✅ **菜地详情**: 点击菜地查看详细信息
- ✅ **订单系统**: 创建订单、查看订单
- ✅ **社区功能**: 发帖、浏览帖子
- ✅ **个人中心**: 查看个人信息

---

### 🐛 小程序常见问题排查

#### 问题1: "request:fail url not in domain list"

**原因**: 未配置合法域名或未关闭域名校验

**解决方案**:
```
开发者工具 -> 详情 -> 本地设置
-> ✅ 勾选"不校验合法域名、web-view、TLS版本及HTTPS证书"
```

#### 问题2: 无法连接到后端API

**检查清单**:
```bash
# 1. 确认后端服务正在运行
# 访问 http://localhost:8000/health 应该返回 {"status":"healthy"}

# 2. 检查防火墙
# Windows防火墙可能阻止了8000端口

# 3. 检查API地址配置
# utils/request.js 中的 BASE_URL 是否正确

# 4. 查看开发者工具的网络面板
# 检查请求是否发出、状态码、响应内容
```

#### 问题3: 真机预览时无法访问localhost

**原因**: 手机无法访问电脑的localhost

**解决方案**:
```javascript
// 1. 查看电脑IP地址
// Windows: ipconfig
// Linux/Mac: ifconfig

// 2. 修改 miniprogram/utils/request.js
// 将 localhost 改为你的电脑IP
const BASE_URL = 'http://192.168.1.100:8000/api'  // 替换为你的IP

// 3. 确保电脑和手机在同一WiFi网络

// 4. 关闭电脑防火墙或开放8000端口
```

#### 问题4: 登录失败

**检查清单**:
```bash
# 1. 确认后端.env中的WECHAT_APPID和WECHAT_SECRET正确

# 2. 确认小程序AppID与后端配置一致

# 3. 开发环境可以使用模拟登录
# 修改 miniprogram/pages/login/login.js 添加测试账号

# 4. 查看后端日志，确认微信API调用是否成功
```

#### 问题5: 图片不显示

**原因**: 图片路径错误或资源缺失

**解决方案**:
```bash
# 1. 检查 miniprogram/images/ 目录下是否有相应图片

# 2. 确认图片路径是否正确
# 相对路径: /images/banner1.jpg
# 绝对路径: https://your-cdn.com/banner1.jpg

# 3. 检查图片格式是否支持（jpg, png, svg等）
```

---

### 📲 真机调试技巧

#### 局域网调试

```javascript
// 1. 获取电脑IP（同一WiFi下）
// Windows:
ipconfig | findstr IPv4

// Linux/Mac:
ifconfig | grep "inet "

// 2. 修改API地址
// miniprogram/utils/request.js
const BASE_URL = 'http://192.168.x.x:8000/api'  // 你的电脑IP

// 3. 确保后端监听所有地址
uvicorn app.main:app --host 0.0.0.0 --port 8000

// 4. 手机和电脑连接同一WiFi
// 5. 预览小程序即可在真机上测试
```

---

## 生产环境部署

### 后端部署

#### 1. 使用Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 2. 配置HTTPS

```bash
# 使用 Let's Encrypt 获取免费证书
certbot --nginx -d your-domain.com
```

#### 3. 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 创建启动脚本 start.sh
#!/bin/bash
cd /path/to/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 使用PM2启动
pm2 start start.sh --name garden-api
pm2 save
pm2 startup
```

### 小程序部署

#### 1. 配置生产环境API

```javascript
globalData: {
  apiBase: 'https://your-domain.com/api'
}
```

#### 2. 配置request合法域名

在微信公众平台：
1. 登录小程序后台
2. 开发 -> 开发设置 -> 服务器域名
3. 添加：`https://your-domain.com`

#### 3. 上传代码

1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目备注
3. 提交审核
4. 审核通过后发布

## 数据库备份

### 定时备份脚本

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="garden_db"

mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/garden_db_$DATE.sql

# 删除30天前的备份
find $BACKUP_DIR -name "garden_db_*.sql" -mtime +30 -delete
```

添加到crontab：
```bash
# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh
```

## 监控与日志

### 后端日志

日志配置在 `app/main.py` 中，默认输出到控制台。

生产环境建议配置日志文件：

```python
import logging

logging.basicConfig(
    filename='/var/log/garden-api/app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### 性能监控

推荐使用：
- Sentry - 错误追踪
- Prometheus + Grafana - 性能监控
- New Relic - APM监控

## 常见问题

### 1. 数据库连接失败

检查：
- MySQL服务是否启动
- 数据库连接配置是否正确
- 防火墙是否开放3306端口

### 2. 微信登录失败

检查：
- AppID和Secret是否正确
- 小程序request合法域名是否配置
- 网络是否能访问微信API

### 3. 小程序无法连接后端

检查：
- 后端服务是否启动
- API地址配置是否正确
- CORS配置是否正确

## 性能优化建议

### 后端优化

1. 使用Redis缓存热点数据
2. 数据库查询添加索引
3. 使用连接池管理数据库连接
4. 启用gzip压缩
5. 使用CDN加速静态资源

### 小程序优化

1. 图片压缩和懒加载
2. 请求合并和缓存
3. 分包加载
4. 避免频繁setData
5. 使用自定义组件

## 安全建议

1. **数据库安全**
   - 使用强密码
   - 限制远程访问
   - 定期备份

2. **API安全**
   - 启用HTTPS
   - 实现请求限流
   - 验证所有输入

3. **密钥管理**
   - 不要将密钥提交到代码仓库
   - 使用环境变量管理敏感信息
   - 定期更换密钥

## 技术支持

如遇问题，请检查：
1. 后端日志：`/var/log/garden-api/app.log`
2. 数据库日志：`/var/log/mysql/error.log`
3. Nginx日志：`/var/log/nginx/error.log`

## 更新日志

### v1.0.0 (2024-12-03)
- 初始版本发布
- 实现基础功能
- 完成核心API
- 小程序基础页面

---

**注意**：本项目为毕业设计项目，部署前请确保充分测试。
