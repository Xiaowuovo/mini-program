#!/bin/bash
# install.sh - 一键部署脚本
# 用途：自动安装和配置树莓派监控系统

set -e  # 遇到错误立即退出

echo "======================================"
echo "  🍓 树莓派监控系统一键部署脚本"
echo "======================================"
echo ""

# 检查是否为root
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本"
    echo "示例: sudo bash install.sh"
    exit 1
fi

# 获取实际用户（即使使用sudo）
ACTUAL_USER=${SUDO_USER:-$(whoami)}
USER_HOME=$(eval echo ~$ACTUAL_USER)

echo "📋 当前用户: $ACTUAL_USER"
echo "📁 用户目录: $USER_HOME"
echo ""

# 步骤1：更新系统
echo "步骤 1/6: 更新系统..."
apt update
apt upgrade -y

# 步骤2：安装依赖
echo ""
echo "步骤 2/6: 安装依赖包..."
apt install -y \
    ffmpeg \
    imagemagick \
    python3 \
    python3-pip \
    v4l-utils \
    curl \
    wget \
    git \
    htop \
    iftop

pip3 install requests pillow schedule

# 步骤3：创建项目目录
echo ""
echo "步骤 3/6: 创建项目目录..."
PROJECT_DIR="$USER_HOME/garden-monitor"
mkdir -p $PROJECT_DIR
chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR

# 步骤4：询问配置信息
echo ""
echo "步骤 4/6: 配置信息..."
read -p "请输入服务器地址（例如：https://yourserver.com）: " SERVER_URL
read -p "请输入设备Token: " DEVICE_TOKEN
read -p "请输入菜地ID: " GARDEN_ID
read -p "请输入监控点ID: " MONITOR_ID

# 步骤5：生成配置文件
echo ""
echo "步骤 5/6: 生成配置文件..."
cat > $PROJECT_DIR/config.sh << EOF
#!/bin/bash
# config.sh - 自动生成的配置文件

# 服务器配置
SERVER_URL="${SERVER_URL}/api/monitors/upload"
DEVICE_TOKEN="$DEVICE_TOKEN"

# 菜地配置
GARDEN_ID=$GARDEN_ID
MONITOR_ID=$MONITOR_ID

# 摄像头配置
VIDEO_DEVICE="/dev/video0"

# 快照配置
SNAPSHOT_WIDTH=1280
SNAPSHOT_HEIGHT=720
SNAPSHOT_QUALITY=85

# 推流配置
RTMP_URL="${SERVER_URL%/*}/live/garden_${GARDEN_ID}"
STREAM_BITRATE=500
STREAM_FPS=15
EOF

# 下载脚本文件
echo ""
echo "步骤 6/6: 创建脚本文件..."

# snapshot.sh
cat > $PROJECT_DIR/snapshot.sh << 'EOF'
#!/bin/bash
# snapshot.sh - 定时快照脚本

source ~/garden-monitor/config.sh

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> ~/garden-monitor/snapshot.log
}

log "开始拍照..."

TEMP_DIR="/tmp/garden_snapshots"
mkdir -p $TEMP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="garden${GARDEN_ID}_monitor${MONITOR_ID}_${TIMESTAMP}.jpg"
FILEPATH="${TEMP_DIR}/${FILENAME}"

if [ -c "$VIDEO_DEVICE" ]; then
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

convert $FILEPATH \
    -quality $SNAPSHOT_QUALITY \
    -resize ${SNAPSHOT_WIDTH}x${SNAPSHOT_HEIGHT} \
    $FILEPATH

FILE_SIZE=$(stat -c%s "$FILEPATH")
log "文件大小: ${FILE_SIZE} bytes"

log "开始上传..."

HTTP_CODE=$(curl -X POST \
    -H "X-Device-Token: $DEVICE_TOKEN" \
    -F "file=@${FILEPATH}" \
    -F "garden_id=$GARDEN_ID" \
    -F "monitor_id=$MONITOR_ID" \
    -w "%{http_code}" \
    -s \
    -o /dev/null \
    $SERVER_URL)

if [ "$HTTP_CODE" == "200" ]; then
    log "上传成功"
else
    log "ERROR: 上传失败，HTTP状态码: $HTTP_CODE"
fi

rm $FILEPATH
log "快照任务完成\n"

find ~/garden-monitor -name "*.log" -mtime +7 -delete
EOF

# stream.sh
cat > $PROJECT_DIR/stream.sh << 'EOF'
#!/bin/bash
# stream.sh - 实时推流脚本

source ~/garden-monitor/config.sh

echo "[$(date)] 开始推流..." >> ~/garden-monitor/stream.log

if [ -f /tmp/stream.pid ]; then
    PID=$(cat /tmp/stream.pid)
    if ps -p $PID > /dev/null; then
        echo "推流进程已存在: $PID"
        exit 1
    fi
fi

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

echo $! > /tmp/stream.pid

echo "[$(date)] 推流已启动，PID: $!" >> ~/garden-monitor/stream.log
EOF

# stop_stream.sh
cat > $PROJECT_DIR/stop_stream.sh << 'EOF'
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
EOF

# 设置权限
chmod +x $PROJECT_DIR/*.sh
chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR

# 配置Crontab
echo ""
echo "配置定时任务..."
(crontab -u $ACTUAL_USER -l 2>/dev/null; echo "*/15 * * * * $PROJECT_DIR/snapshot.sh") | crontab -u $ACTUAL_USER -
(crontab -u $ACTUAL_USER -l; echo "0 2 * * * find /tmp/garden_snapshots -type f -mtime +7 -delete") | crontab -u $ACTUAL_USER -

# 测试摄像头
echo ""
echo "测试摄像头..."
if [ -c "/dev/video0" ]; then
    echo "✅ 摄像头设备检测成功"
    v4l2-ctl --list-devices
else
    echo "❌ 警告：未检测到摄像头设备"
fi

# 完成
echo ""
echo "======================================"
echo "  ✅ 安装完成！"
echo "======================================"
echo ""
echo "📂 项目目录: $PROJECT_DIR"
echo "📝 配置文件: $PROJECT_DIR/config.sh"
echo ""
echo "🧪 测试命令:"
echo "  sudo -u $ACTUAL_USER $PROJECT_DIR/snapshot.sh"
echo ""
echo "📋 定时任务已设置（每15分钟拍照）"
echo "  查看: crontab -l"
echo ""
echo "🔍 查看日志:"
echo "  tail -f $PROJECT_DIR/snapshot.log"
echo ""
echo "🎥 手动推流:"
echo "  $PROJECT_DIR/stream.sh"
echo "  $PROJECT_DIR/stop_stream.sh"
echo ""
echo "======================================"
