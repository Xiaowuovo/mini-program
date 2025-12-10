# 共享菜园"云端小筑" - 后端服务

基于 Python + FastAPI 的微信小程序后端服务

## 技术栈

- **Python**: 3.12+
- **Web框架**: FastAPI
- **数据库**: MySQL 8.0
- **ORM**: SQLAlchemy
- **认证**: JWT
- **缓存**: Redis (可选)

## 项目结构

```
backend/
├── app/                    # 应用主目录
│   ├── api/               # API路由
│   │   ├── auth.py        # 认证接口
│   │   ├── users.py       # 用户接口
│   │   ├── gardens.py     # 菜地接口
│   │   ├── orders.py      # 订单接口
│   │   └── deps.py        # 依赖注入
│   ├── core/              # 核心模块
│   │   ├── config.py      # 配置管理
│   │   ├── database.py    # 数据库连接
│   │   └── security.py    # 安全认证
│   ├── models/            # 数据模型
│   │   ├── user.py        # 用户模型
│   │   ├── garden.py      # 菜地模型
│   │   ├── order.py       # 订单模型
│   │   ├── reminder.py    # 提醒模型
│   │   ├── service.py     # 服务模型
│   │   ├── post.py        # 帖子模型
│   │   └── comment.py     # 评论模型
│   ├── schemas/           # 数据Schema
│   │   ├── user.py
│   │   ├── garden.py
│   │   └── order.py
│   ├── services/          # 业务服务层
│   ├── utils/             # 工具函数
│   │   └── wechat.py      # 微信API
│   └── main.py            # 应用入口
├── venv/                  # Python虚拟环境
├── requirements.txt       # 依赖包列表
├── init_db.sql           # 数据库初始化脚本
├── .env.example          # 环境变量示例
└── README.md             # 项目说明

```

## 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境（如果未创建）
python -m venv venv

# 激活虚拟环境
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 安装依赖包
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
copy .env.example .env

# 编辑.env文件，填写必要的配置
# - 数据库连接信息
# - 微信小程序AppID和Secret
# - JWT密钥等
```

### 3. 初始化数据库

```bash
# 方式1: 使用MySQL命令行执行SQL脚本
mysql -u root -p < init_db.sql

# 方式2: 使用数据库客户端工具导入init_db.sql
```

### 4. 启动服务

```bash
# 方式1: 使用Python直接运行
python -m app.main

# 方式2: 使用uvicorn运行（推荐）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 访问API文档

启动成功后，访问以下地址查看API文档：

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## API接口说明

### 认证接口 `/api/auth`

- `POST /api/auth/wechat-login` - 微信登录

### 用户接口 `/api/users`

- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新当前用户信息

### 菜地接口 `/api/gardens`

- `GET /api/gardens` - 获取菜地列表
- `GET /api/gardens/{id}` - 获取菜地详情
- `POST /api/gardens` - 创建菜地（管理员）
- `PUT /api/gardens/{id}` - 更新菜地（管理员）
- `DELETE /api/gardens/{id}` - 删除菜地（管理员）

### 订单接口 `/api/orders`

- `GET /api/orders` - 获取订单列表
- `GET /api/orders/{id}` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/{id}/pay` - 支付订单
- `PUT /api/orders/{id}/cancel` - 取消订单

## 数据库表结构

核心数据表：

1. **users** - 用户表
2. **gardens** - 菜地表
3. **orders** - 订单表
4. **reminders** - 任务提醒表
5. **services** - 增值服务表
6. **posts** - 社区帖子表
7. **comments** - 评论表

详细表结构请参考 `init_db.sql`

## 开发说明

### 添加新的API接口

1. 在 `app/schemas/` 中定义数据Schema
2. 在 `app/api/` 中创建路由文件
3. 在 `app/api/__init__.py` 中注册路由

### 添加新的数据模型

1. 在 `app/models/` 中创建模型文件
2. 在 `app/models/__init__.py` 中导出模型
3. 更新数据库表结构

## 部署说明

### 生产环境部署

1. 使用 `gunicorn` 或 `uvicorn` 作为WSGI服务器
2. 使用 `nginx` 作为反向代理
3. 配置HTTPS证书
4. 设置环境变量 `DEBUG=False`
5. 配置日志记录
6. 定期备份数据库

### 使用Docker部署（可选）

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 注意事项

1. **安全性**：
   - 生产环境务必修改 `SECRET_KEY`
   - 不要提交 `.env` 文件到版本控制
   - 定期更新依赖包修复安全漏洞

2. **性能优化**：
   - 使用Redis缓存热点数据
   - 配置数据库连接池
   - 添加接口限流保护

3. **微信配置**：
   - 需要在微信公众平台配置服务器域名
   - 确保 `WECHAT_APPID` 和 `WECHAT_SECRET` 正确

## 开发进度

- [x] 项目初始化
- [x] 数据库设计
- [x] 核心模型创建
- [x] 认证模块
- [x] 用户接口
- [x] 菜地接口
- [x] 订单接口
- [ ] 增值服务接口
- [ ] 社区功能接口
- [ ] 任务提醒接口
- [ ] 视频服务集成

## 许可证

本项目仅用于学习和毕业设计，未经授权不得用于商业用途。
