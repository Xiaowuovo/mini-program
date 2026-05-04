// pages/camera/camera.js
const CAMERA_URL = 'https://124.222.14.2/camera-final-correct.html'

Page({
  data: {
    cameraUrl: CAMERA_URL,
    loading: true
  },

  handleLoad() {
    this.setData({ loading: false })
  },

  handleError(e) {
    console.error('web-view error', e)
    this.setData({ loading: false })
  },

  handleMessage(e) {
    console.log('web-view message', e.detail.data)
  }
})