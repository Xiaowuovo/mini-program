# 故障排查指南

> 遇到问题？这里有详细的解决方案

## 🔍 快速诊断

### 1. 检查清单

运行以下命令快速诊断问题：

```bash
# 检查Python版本
python --version

# 检查后端环境
cd backend
python check_env.py

# 检查数据库连接
mysql -u root -p -e "SHOW DATABASES;"
```

## 🐛 常见问题

### 后端问题

#### ❌ ModuleNotFoundError: No module named 'fastapi'

**症状**：启动后端时报错缺少模块

**原因**：
1. 依赖包未安装
2. 虚拟环境未激活
3. Python环境不正确

**解决方案**：

**步骤1：确认虚拟环境**
```bash
cd backend

# 检查虚拟环境是否存在
dir venv  # Windows
ls venv   # Linux/Mac
```

**步骤2：安装依赖**
```bash
# 使用安装脚本（推荐）
install.bat  # Windows

# 或手动安装
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**步骤3：验证安装**
```bash
python check_env.py
```

**如果下载速度慢，使用国内镜像**：
```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

#### ❌ NameError: name 'Optional' is not defined

**症状**：导入错误

**原因**：某些文件缺少 `typing.Optional` 导入

**解决方案**：已在代码中修复，重新拉取代码即可

#### ❌ FastAPIError: Invalid args for response field

**症状**：
```
FastAPIError: Invalid args for response field!
Hint: check that typing.Optional[app.models.user.User] is a valid Pydantic field type
```

**原因**：在路由参数中错误使用了SQLAlchemy模型类型

**常见位置**：
- `community.py` 中的路由函数
- 其他API文件中类似的模式

**解决方案**：

已修复所有相关问题。如果仍有错误，检查路由函数参数：

❌ **错误写法**：
```python
async def get_post(
    post_id: int,
    current_user: Optional[User] = None,  # 错误！不能直接用模型类型
    db: Session = Depends(get_db)
):
```

✅ **正确写法1**（公开接口，不需要登录）：
```python
async def get_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    current_user = None  # 在函数内部设置
```

✅ **正确写法2**（需要登录的接口）：
```python
async def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),  # 使用依赖注入
    db: Session = Depends(get_db)
):
```

**验证修复**：
```bash
cd backend
verify_fix.bat
```

#### ❌ 控制台输出乱码

**症状**：中文显示为乱码，如 `鏈嶅姟宸插惎鍔?`

**原因**：Windows控制台默认使用GBK编码

**解决方案**：

**方式1：使用新的启动脚本（推荐）**
```bash
cd backend
run.bat
```

**方式2：手动设置编码**
```bash
chcp 65001
set PYTHONIOENCODING=utf-8
python -m app.main
```

**方式3：永久设置**
1. 右键点击控制台标题栏 → 属性
2. 选项 → 旧版控制台
3. 取消勾选"使用旧版控制台"

#### ❌ Address already in use (端口占用)

**症状**：启动时提示端口已被占用

**解决方案**：

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :8000

# 结束进程（PID是上一步找到的进程ID）
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8000
kill -9 <PID>
```

**或者更改端口**：
```bash
# 在启动时指定其他端口
uvicorn app.main:app --port 8001
```

#### ❌ 数据库连接失败

**症状**：
```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError)
(2003, "Can't connect to MySQL server")
```

**原因**：
1. MySQL服务未启动
2. 连接配置错误
3. 数据库不存在

**解决方案**：

**步骤1：检查MySQL服务**
```bash
# Windows - 打开服务管理
services.msc
# 找到 MySQL80，确保状态为"正在运行"

# 或使用命令行
net start MySQL80

# Linux
sudo systemctl status mysql
sudo systemctl start mysql
```

**步骤2：检查配置**
```bash
# 编辑 backend/.env 文件
DATABASE_URL=mysql+pymysql://root:你的密码@localhost:3306/garden_db
```

**步骤3：创建数据库**
```bash
mysql -u root -p < backend/init_db.sql
```

**步骤4：测试连接**
```bash
mysql -u root -p -e "USE garden_db; SHOW TABLES;"
```

### 小程序问题

#### ❌ 小程序无法连接后端

**症状**：所有API请求都失败

**原因**：
1. 后端未启动
2. API地址配置错误
3. 网络问题

**解决方案**：

**步骤1：确认后端运行**
```bash
# 浏览器访问
http://localhost:8000/health
# 应该返回: {"status": "healthy"}
```

**步骤2：检查小程序配置**

编辑 `miniprogram/app.js`：
```javascript
globalData: {
  apiBase: 'http://localhost:8000/api'  // 确认地址正确
}
```

**步骤3：检查开发者工具设置**
1. 点击右上角"详情"
2. 本地设置
3. 勾选"不校验合法域名..."

#### ❌ 微信登录失败

**症状**：登录时返回错误

**原因**：
1. AppID/Secret未配置
2. code无效
3. 网络问题

**解决方案**：

**开发环境**：
```javascript
// 使用测试号
// 在微信公众平台申请测试号
```

**生产环境**：
```bash
# 配置 backend/.env
WECHAT_APPID=你的AppID
WECHAT_SECRET=你的Secret

# 重启后端服务
```

### 数据库问题

#### ❌ PowerShell重定向错误

**症状**：
```
"<"运算符是为将来使用而保留的。
RedirectionNotSupported
```

**原因**：PowerShell不支持 `<` 重定向操作符

**解决方案**：

**方式1：使用初始化脚本（推荐）**
```bash
cd backend
init_database.bat  # CMD
.\init_database.ps1  # PowerShell
```

**方式2：切换到CMD**
```cmd
cmd
cd C:\Users\Administrator\Desktop\学校\毕业设计1\backend
mysql -u root -p < init_db.sql
```

**方式3：PowerShell使用管道**
```powershell
cd backend
Get-Content init_db.sql | mysql -u root -p
```

#### ❌ 表不存在

**症状**：
```
sqlalchemy.exc.ProgrammingError: (pymysql.err.ProgrammingError)
(1146, "Table 'garden_db.users' doesn't exist")
```

**解决方案**：
```bash
# 重新执行数据库脚本
mysql -u root -p < backend/init_db.sql

# 或在MySQL中手动执行
mysql -u root -p
source C:/path/to/backend/init_db.sql
```

#### ❌ 字符编码问题

**症状**：中文显示乱码

**解决方案**：

确保数据库使用UTF-8编码：
```sql
ALTER DATABASE garden_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 依赖安装问题

#### ❌ pip安装超时

**症状**：`pip install` 下载很慢或超时

**解决方案**：

**使用国内镜像源**：
```bash
# 临时使用
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 永久配置
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

**常用镜像源**：
- 清华：https://pypi.tuna.tsinghua.edu.cn/simple
- 阿里云：https://mirrors.aliyun.com/pypi/simple/
- 豆瓣：https://pypi.douban.com/simple/

#### ❌ Microsoft Visual C++ 14.0 is required

**症状**：安装某些包时报错需要编译器

**解决方案**：
1. 下载安装 Microsoft C++ Build Tools
2. 或使用预编译的wheel包
3. 或使用conda安装

## 🔧 开发工具问题

### VSCode配置

**Python环境识别**：

创建 `.vscode/settings.json`：
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/Scripts/python.exe",
  "python.terminal.activateEnvironment": true
}
```

### 微信开发者工具

**问题：编译失败**

**解决**：
1. 检查project.config.json配置
2. 清除缓存：工具 → 清除缓存
3. 重启开发者工具

## 📝 日志查看

### 后端日志

后端日志会输出到控制台，包含：
- 请求信息
- 错误堆栈
- SQL语句（开发模式）

**增加日志详细度**：
```python
# app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 小程序日志

**查看方法**：
1. 微信开发者工具
2. 控制台（Console）
3. 网络（Network）

## 🆘 获取帮助

### 1. 查看文档

- [QUICK_START.md](QUICK_START.md) - 快速开始
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [README.md](README.md) - 项目说明

### 2. 运行检查脚本

```bash
# 环境检查
cd backend
python check_env.py

# API测试
python test_api.py
```

### 3. 重新安装

如果问题依旧，尝试完全重新安装：

```bash
# 1. 删除虚拟环境
cd backend
rmdir /s venv  # Windows
rm -rf venv    # Linux/Mac

# 2. 重新安装
install.bat  # Windows
```

## 📊 环境要求确认

### 最低要求

| 软件 | 版本 | 检查命令 |
|------|------|----------|
| Python | 3.8+ | `python --version` |
| MySQL | 8.0+ | `mysql --version` |
| pip | 20.0+ | `pip --version` |

### 推荐配置

| 软件 | 版本 | 说明 |
|------|------|------|
| Python | 3.12 | 开发使用版本 |
| MySQL | 8.0.33 | 稳定版 |
| pip | 最新 | `python -m pip install --upgrade pip` |

## ✅ 验证步骤

确认一切正常：

```bash
# 1. 后端健康检查
curl http://localhost:8000/health

# 2. API文档访问
# 浏览器打开 http://localhost:8000/api/docs

# 3. 数据库连接
mysql -u root -p -e "USE garden_db; SELECT COUNT(*) FROM users;"

# 4. 运行测试
cd backend
python test_api.py
```

## 🎯 最后的办法

如果以上都不能解决问题：

1. **检查Python版本**：确保是3.8+
2. **完全重装**：删除venv，重新创建
3. **检查防火墙**：可能阻止了端口访问
4. **查看完整错误**：复制完整的错误信息进行搜索

---

**提示**：大部分问题都是由于依赖未安装或配置错误导致的。先运行 `check_env.py` 和 `test_api.py` 进行诊断。
