# 🍓 树莓派监控端部署指南

> 适用于树莓派 Zero 2W / 3B+ / 4B
> 实现低成本视频监控方案

---

## 📦 硬件清单

| 设备 | 型号推荐 | 价格 | 购买链接 |
|------|---------|------|----------|
| 树莓派 | Zero 2W / 4B 2GB | 150-300元 | 淘宝/京东 |
| 摄像头 | USB 1080P | 80元 | 罗技C270/奥尼A8 |
| TF卡 | 32GB Class 10 | 40元 | 闪迪/三星 |
| 电源 | 5V 3A Type-C | 30元 | 官方电源 |
| 外壳 | 防水IP65 | 30元 | 户外防护 |
| **总计** | - | **300-400元** | - |

---

## 🔧 系统安装

### 1. 下载系统镜像

```bash
# 推荐使用 Raspberry Pi OS Lite（无桌面）
# 下载地址：https://www.raspberrypi.com/software/operating-systems/

# 或使用命令下载
wget https://downloads.raspberrypi.org/raspios_lite_armhf/images/raspios_lite_armhf-2024-11-19/2024-11-19-raspios-bookworm-armhf-lite.img.xz
```

### 2. 烧录系统

**使用Raspberry Pi Imager（推荐）**：
1. 下载安装：https://www.raspberrypi.com/software/
2. 选择系统：Raspberry Pi OS Lite (32-bit)
3. 选择存储：你的TF卡
4. 高级设置：
   - ✅ 启用SSH
   - ✅ 设置用户名密码（pi / raspberry）
   - ✅ 配置WiFi（SSID和密码）
   - ✅ 设置时区（Asia/Shanghai）
5. 点击"写入"

### 3. 首次启动

```bash
# 插入TF卡，连接电源启动
# 等待约2分钟

# 查找树莓派IP（在路由器管理页面或使用工具）
# 或者使用：
nmap -sn 192.168.1.0/24

# SSH连接
ssh pi@192.168.1.xxx
# 密码：raspberry（或你设置的密码）
```

---

## 📥 安装依赖

### 1. 更新系统

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. 安装核心软件

```bash
# FFmpeg（视频处理）
sudo apt install -y ffmpeg

# ImageMagick（图片处理）
sudo apt install -y imagemagick

# Python依赖
sudo apt install -y python3 python3-pip

# 摄像头工具
sudo apt install -y v4l-utils

# 系统工具
sudo apt install -y curl wget git
```

### 3. 安装Python库

```bash
pip3 install requests pillow schedule
```

### 4. 测试摄像头

```bash
# 列出视频设备
v4l2-ctl --list-devices

# 测试拍照（如果有摄像头模块）
raspistill -o test.jpg

# 测试USB摄像头
ffmpeg -f v4l2 -i /dev/video0 -frames 1 test_usb.jpg
```

---

## 📂 部署脚本

### 1. 创建项目目录

```bash
mkdir -p ~/garden-monitor
cd ~/garden-monitor
```

### 2. 创建配置文件

```bash
nano config.sh
```

粘贴以下内容：

```bash
#!/bin/bash
# config.sh - 配置文件

# 服务器配置
SERVER_URL="https://yourserver.com/api/monitors/upload"
DEVICE_TOKEN="your_device_token_here"

# 菜地配置
GARDEN_ID=1
MONITOR_ID=1

# 摄像头配置
VIDEO_DEVICE="/dev/video0"

# 快照配置
SNAPSHOT_WIDTH=1280
SNAPSHOT_HEIGHT=720
SNAPSHOT_QUALITY=85

# 推流配置（实时模式）
RTMP_URL="rtmp://yourserver.com/live/garden_1"
STREAM_BITRATE=500
STREAM_FPS=15
```

保存并退出（Ctrl+O, Enter, Ctrl+X）

### 3. 快照脚本

```bash
nano snapshot.sh
```

粘贴以下内容：

```bash
#!/bin/bash
# snapshot.sh - 定时快照脚本

# 加载配置
source ~/garden-monitor/config.sh

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> ~/garden-monitor/snapshot.log
}

log "开始拍照..."

# 创建临时目录
TEMP_DIR="/tmp/garden_snapshots"
mkdir -p $TEMP_DIR

# 生成文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="garden${GARDEN_ID}_monitor${MONITOR_ID}_${TIMESTAMP}.jpg"
FILEPATH="${TEMP_DIR}/${FILENAME}"

# 拍照
if [ -c "$VIDEO_DEVICE" ]; then
    # USB摄像头
    ffmpeg -f v4l2 \
        -video_size ${SNAPSHOT_WIDTH}x${SNAPSHOT_HEIGHT} \
        -i $VIDEO_DEVICE \
        -frames 1 \
        -q:v 2 \
        $FILEPATH \
        -loglevel quiet

    if [ $? -ne 0 ]; then
        log "ERROR: 拍照失败"
        exit 1
    fi
else
    log "ERROR: 摄像头设备不存在"
    exit 1
fi

log "拍照成功: $FILENAME"

# 压缩图片
convert $FILEPATH \
    -quality $SNAPSHOT_QUALITY \
    -resize ${SNAPSHOT_WIDTH}x${SNAPSHOT_HEIGHT} \
    $FILEPATH

FILE_SIZE=$(stat -f%z "$FILEPATH" 2>/dev/null || stat -c%s "$FILEPATH")
log "文件大小: ${FILE_SIZE} bytes"

# 上传到服务器
log "开始上传..."

UPLOAD_RESPONSE=$(curl -X POST \
    -H "X-Device-Token: $DEVICE_TOKEN" \
    -F "file=@${FILEPATH}" \
    -F "garden_id=$GARDEN_ID" \
    -F "monitor_id=$MONITOR_ID" \
    -w "%{http_code}" \
    -s \
    $SERVER_URL)

HTTP_CODE="${UPLOAD_RESPONSE: -3}"

if [ "$HTTP_CODE" == "200" ]; then
    log "上传成功"
else
    log "ERROR: 上传失败，HTTP状态码: $HTTP_CODE"
fi

# 清理临时文件
rm $FILEPATH
log "快照任务完成\n"

# 清理旧日志（保留7天）
find ~/garden-monitor -name "*.log" -mtime +7 -delete
```

保存并设置权限：

```bash
chmod +x snapshot.sh
```

### 4. 实时推流脚本

```bash
nano stream.sh
```

粘贴以下内容：

```bash
#!/bin/bash
# stream.sh - 实时推流脚本

# 加载配置
source ~/garden-monitor/config.sh

# 日志
echo "[$(date)] 开始推流..." >> ~/garden-monitor/stream.log

# 检查是否已在推流
if [ -f /tmp/stream.pid ]; then
    PID=$(cat /tmp/stream.pid)
    if ps -p $PID > /dev/null; then
        echo "推流进程已存在: $PID"
        exit 1
    fi
fi

# 开始推流
ffmpeg -f v4l2 \
    -framerate $STREAM_FPS \
    -video_size 640x480 \
    -i $VIDEO_DEVICE \
    -c:v h264_omx \
    -b:v ${STREAM_BITRATE}k \
    -maxrate ${STREAM_BITRATE}k \
    -bufsize $((STREAM_BITRATE * 2))k \
    -preset ultrafast \
    -g 30 \
    -f flv \
    $RTMP_URL \
    >> ~/garden-monitor/stream.log 2>&1 &

# 保存PID
echo $! > /tmp/stream.pid

echo "[$(date)] 推流已启动，PID: $!" >> ~/garden-monitor/stream.log
```

保存并设置权限：

```bash
chmod +x stream.sh
```

### 5. 停止推流脚本

```bash
nano stop_stream.sh
```

粘贴以下内容：

```bash
#!/bin/bash
# stop_stream.sh - 停止推流

if [ -f /tmp/stream.pid ]; then
    PID=$(cat /tmp/stream.pid)
    kill $PID 2>/dev/null
    rm /tmp/stream.pid
    echo "[$(date)] 推流已停止" >> ~/garden-monitor/stream.log
else
    echo "没有推流进程"
fi
```

保存并设置权限：

```bash
chmod +x stop_stream.sh
```

---

## ⏰ 设置定时任务

### 1. 编辑Crontab

```bash
crontab -e
```

### 2. 添加定时任务

```cron
# 每15分钟拍照一次
*/15 * * * * /home/pi/garden-monitor/snapshot.sh

# 每天凌晨2点清理旧快照
0 2 * * * find /tmp/garden_snapshots -type f -mtime +7 -delete

# 每天凌晨3点重启（可选）
# 0 3 * * * sudo reboot
```

保存并退出

### 3. 验证定时任务

```bash
# 查看当前定时任务
crontab -l

# 查看cron日志
sudo tail -f /var/log/syslog | grep CRON
```

---

## 🧪 测试

### 1. 测试快照功能

```bash
# 手动执行快照脚本
cd ~/garden-monitor
./snapshot.sh

# 查看日志
tail -20 snapshot.log

# 检查临时目录
ls -lh /tmp/garden_snapshots
```

### 2. 测试推流功能

```bash
# 启动推流
./stream.sh

# 查看推流进程
ps aux | grep ffmpeg

# 查看推流日志
tail -f stream.log

# 停止推流
./stop_stream.sh
```

### 3. 性能监控

```bash
# 查看CPU和内存
htop

# 查看温度
vcgencmd measure_temp

# 查看网络
iftop
```

---

## 🔧 常见问题

### Q1: 摄像头无法识别

```bash
# 检查USB设备
lsusb

# 检查视频设备
ls -l /dev/video*

# 查看摄像头详情
v4l2-ctl --list-formats-ext -d /dev/video0
```

### Q2: 拍照黑屏/画面异常

```bash
# 调整亮度和对比度
ffmpeg -f v4l2 \
    -i /dev/video0 \
    -vf "eq=brightness=0.1:contrast=1.2" \
    -frames 1 \
    test.jpg
```

### Q3: 推流卡顿

```bash
# 降低分辨率和码率
# 修改 config.sh
STREAM_BITRATE=300  # 从500降低到300
```

### Q4: 上传失败

```bash
# 测试网络
ping -c 4 yourserver.com

# 测试上传接口
curl -X POST \
    -H "X-Device-Token: your_token" \
    -F "file=@test.jpg" \
    https://yourserver.com/api/monitors/upload
```

---

## 🚀 优化建议

### 1. 开机自启动

```bash
# 创建系统服务
sudo nano /etc/systemd/system/garden-monitor.service
```

粘贴：

```ini
[Unit]
Description=Garden Monitor Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/garden-monitor
ExecStart=/home/pi/garden-monitor/snapshot.sh
Restart=always
RestartSec=900

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable garden-monitor
sudo systemctl start garden-monitor
```

### 2. 看门狗（防止假死）

```bash
# 安装看门狗
sudo apt install watchdog

# 配置
sudo nano /etc/watchdog.conf

# 取消注释：
# watchdog-device = /dev/watchdog
# max-load-1 = 24

# 启动
sudo systemctl enable watchdog
sudo systemctl start watchdog
```

### 3. 节能模式

```bash
# 禁用HDMI（节省20mA）
sudo /opt/vc/bin/tvservice -o

# 禁用WiFi LED
echo 0 | sudo tee /sys/class/leds/led0/brightness

# 禁用网口LED
echo none | sudo tee /sys/class/leds/led1/trigger
```

---

## 📚 完整部署脚本

创建一键部署脚本：

```bash
nano install.sh
```

粘贴内容（见下一条消息）
