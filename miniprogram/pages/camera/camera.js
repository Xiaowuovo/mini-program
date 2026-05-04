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
    const { gardenId, gardenName } = options

    // 如果有菜地信息，设置标题
    if (gardenName) {
      wx.setNavigationBarTitle({
        title: `${gardenName} - 视频监控`
      })
    }

    // 保存菜地ID用于后续可能的功能扩展
    this.setData({
      gardenId: gardenId || null,
      gardenName: gardenName || ''
    })


    // 获取摄像头URL
    const url = app.globalData.cameraUrl || 'https://124.222.14.2:19302/demos/camera.html';