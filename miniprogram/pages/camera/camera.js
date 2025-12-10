// pages/camera/camera.js
const app = getApp()

Page({
  data: {
    cameraUrl: '',
    loading: true
  },

  onLoad() {
    // 获取摄像头URL
    const url = app.globalData.cameraUrl || 'https://124.222.14.2:19302/demos/camera.html';

    this.setData({
      cameraUrl: url
    });
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
              cameraUrl: app.globalData.cameraUrl || 'https://124.222.14.2:19302/demos/camera.html'
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