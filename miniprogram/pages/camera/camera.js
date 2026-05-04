// pages/camera/camera.js
const app = getApp()

Page({
  data: {
    cameraUrl: '',
    loading: true,
    gardenId: null,
    gardenName: ''
  },

  onLoad(options) {
    const { gardenId, gardenName, videoUrl } = options

    // 如果有菜地信息，设置标题
    if (gardenName) {
      wx.setNavigationBarTitle({
        title: `${decodeURIComponent(gardenName)} - 视频监控`
      })
    }

    // 保存菜地ID用于后续可能的功能扩展
    this.setData({
      gardenId: gardenId || null,
      gardenName: gardenName || ''
    })

    // 优先用跳转参数携带的 URL，其次用全局配置
    const url = (videoUrl ? decodeURIComponent(videoUrl) : '') || app.globalData.cameraUrl || ''
    if (!url) {
      this.setData({ loading: false })
      wx.showModal({
        title: '监控未配置',
        content: '当前菜地暂未配置视频监控，请联系管理员。',
        showCancel: false,
        confirmText: '返回',
        success: () => { wx.navigateBack() }
      })
      return
    }

    this.setData({ cameraUrl: url });
  },

  // web-view 加载完成
  handleLoad(e) {
    console.log('web-view 加载完成', e);
    this.setData({
      loading: false
    });
  },

  // web-view 加载错误
  handleError(e) {
    console.error('web-view 加载错误', e);
    this.setData({
      loading: false
    });

    wx.showModal({
      title: '加载失败',
      content: '无法加载摄像头页面，请检查网络连接或联系管理员。\n\n错误信息：' + (e.detail.errMsg || '未知错误'),
      showCancel: true,
      cancelText: '返回',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          // 重新加载
          this.setData({
            loading: true,
            cameraUrl: ''
          });
          setTimeout(() => {
            this.setData({
              cameraUrl: app.globalData.cameraUrl || ''
            });
          }, 100);
        } else {
          // 返回上一页
          wx.navigateBack();
        }
      }
    });
  },

  // 接收 web-view 发送的消息
  handleMessage(e) {
    console.log('收到 web-view 消息', e.detail.data);
  },

  onShareAppMessage() {
    return {
      title: '远程摄像头监控',
      path: '/pages/index/index'
    };
  }
})