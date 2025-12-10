// utils/request.js
const app = getApp()

/**
 * 封装的HTTP请求方法
 * @param {String} url 请求地址
 * @param {String} method 请求方法
 * @param {Object} data 请求数据
 * @param {Boolean} needAuth 是否需要认证
 */
function request(url, method = 'GET', data = {}, needAuth = true) {
  // 兼容对象传参方式
  if (typeof url === 'object') {
    const params = url
    url = params.url
    method = params.method || 'GET'
    data = params.data || {}
    needAuth = params.needAuth !== undefined ? params.needAuth : true
  }

  return new Promise((resolve, reject) => {
    // 构建完整URL
    const fullUrl = `${app.globalData.apiBase}${url}`

    // 构建请求头
    const header = {
      'Content-Type': 'application/json'
    }

    // 如果需要认证，添加Token
    if (needAuth) {
      const token = app.getToken()

      if (token) {
        header['Authorization'] = `Bearer ${token}`
      } else {
        // 未登录，跳转到登录页
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          app.navigateToLogin()
        }, 1500)
        reject(new Error('未登录'))
        return
      }
    }

    // 发起请求
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        if (res.statusCode === 200) {
          // 请求成功
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // 未授权，清除登录信息
          wx.showToast({
            title: '登录已过期',
            icon: 'none'
          })
          app.clearLoginInfo()
          setTimeout(() => {
            app.navigateToLogin()
          }, 1500)
          reject(new Error('未授权'))
        } else {
          // 其他错误
          console.error('请求错误:', res.statusCode, res.data)

          let errorMsg = '请求失败'
          if (res.data) {
            if (res.data.detail) {
              // FastAPI标准错误格式
              if (Array.isArray(res.data.detail)) {
                // 验证错误
                errorMsg = res.data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('; ')
              } else {
                errorMsg = res.data.detail
              }
            } else if (res.data.message) {
              errorMsg = res.data.message
            }
          }

          wx.showToast({
            title: errorMsg.substring(0, 20),
            icon: 'none',
            duration: 3000
          })
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * GET请求
 */
function get(url, data = {}, needAuth = true) {
  return request(url, 'GET', data, needAuth)
}

/**
 * POST请求
 */
function post(url, data = {}, needAuth = true) {
  return request(url, 'POST', data, needAuth)
}

/**
 * PUT请求
 */
function put(url, data = {}, needAuth = true) {
  return request(url, 'PUT', data, needAuth)
}

/**
 * DELETE请求
 */
function del(url, data = {}, needAuth = true) {
  return request(url, 'DELETE', data, needAuth)
}

/**
 * 上传文件
 */
function uploadFile(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${app.globalData.apiBase}${url}`
    const token = app.getToken()

    const header = {}
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    wx.uploadFile({
      url: fullUrl,
      filePath: filePath,
      name: name,
      formData: formData,
      header: header,
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          resolve(data)
        } else {
          const errorMsg = '上传失败'
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        console.error('上传失败:', err)
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile
}
