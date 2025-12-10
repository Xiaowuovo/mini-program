# 共享菜园"云端小筑"部署指南

## 环境要求

### 后端环境
- Python 3.12+
- MySQL 8.0+
- Redis 7.0+（可选）

### 小程序环境
- 微信开发者工具
- 微信小程序账号（AppID）

## 后端部署

### 1. 安装Python依赖

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（Windows）
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

复制环境变量模板：
```bash
copy .env.example .env
```

编辑 `.env` 文件，配置以下内容：

```env
# 数据库配置
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/garden_db

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# JWT密钥（务必修改）
SECRET_KEY=your-super-secret-key-change-in-production

# 其他配置...
```

### 3. 初始化数据库

使用MySQL客户端执行初始化脚本：

```bash
# 方式1：使用mysql命令行
mysql -u root -p < init_db.sql

# 方式2：使用数据库管理工具
# 打开 init_db.sql 并在数据库客户端中执行
```

### 4. 启动后端服务

```bash
# 开发环境
python -m app.main

# 或使用 uvicorn（推荐）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

服务启动后访问：
- API文档：http://localhost:8000/api/docs
- 健康检查：http://localhost:8000/health

## 小程序部署

### 1. 配置API地址

编辑 `miniprogram/app.js`，配置后端API地址：

```javascript
globalData: {
  apiBase: 'http://localhost:8000/api',  // 开发环境
  // apiBase: 'https://your-domain.com/api'  // 生产环境
}
```

### 2. 配置小程序AppID

在微信开发者工具中：
1. 打开项目设置
2. 填入你的AppID
3. 配置request合法域名（生产环境）

### 3. 配置后端微信设置

确保后端 `.env` 文件中的微信配置正确：

```env
WECHAT_APPID=wx1234567890abcdef  # 与小程序AppID一致
WECHAT_SECRET=your_secret_key
```

### 4. 运行小程序

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 编译项目
3. 在模拟器或真机中预览

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
