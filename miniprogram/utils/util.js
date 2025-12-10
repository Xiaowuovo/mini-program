// utils/util.js

/**
 * 格式化时间
 */
function formatTime(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 格式化日期
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${[year, month, day].map(formatNumber).join('-')}`
}

/**
 * 数字补零
 */
function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 时间距离现在的描述
 */
function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) return `${years}年前`
  if (months > 0) return `${months}个月前`
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

/**
 * 防抖函数
 */
function debounce(func, wait = 500) {
  let timeout
  return function() {
    const context = this
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}

/**
 * 节流函数
 */
function throttle(func, wait = 500) {
  let timeout
  return function() {
    const context = this
    const args = arguments
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null
        func.apply(context, args)
      }, wait)
    }
  }
}

/**
 * 显示加载提示
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示成功提示
 */
function showSuccess(title = '操作成功') {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 */
function showError(title = '操作失败') {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 显示确认对话框
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: title,
      content: content,
      success: (res) => {
        if (res.confirm) {
          resolve(true)
        } else {
          reject(false)
        }
      },
      fail: reject
    })
  })
}

/**
 * 设置页面标题
 */
function setTitle(title) {
  wx.setNavigationBarTitle({
    title: title
  })
}

/**
 * 价格格式化（元）
 */
function formatPrice(price) {
  return `¥${parseFloat(price).toFixed(2)}`
}

/**
 * 手机号格式化（隐藏中间4位）
 */
function formatPhone(phone) {
  if (!phone || phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 图片预览
 */
function previewImage(current, urls) {
  wx.previewImage({
    current: current,
    urls: urls
  })
}

/**
 * 复制到剪贴板
 */
function copyText(text) {
  wx.setClipboardData({
    data: text,
    success: () => {
      showSuccess('已复制')
    }
  })
}

/**
 * 拨打电话
 */
function makePhoneCall(phoneNumber) {
  wx.makePhoneCall({
    phoneNumber: phoneNumber
  })
}

/**
 * 获取地址栏参数
 */
function getUrlParams(url) {
  const params = {}
  const search = url.split('?')[1]
  if (search) {
    search.split('&').forEach(item => {
      const [key, value] = item.split('=')
      params[key] = decodeURIComponent(value)
    })
  }
  return params
}

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  timeAgo,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showConfirm,
  setTitle,
  formatPrice,
  formatPhone,
  previewImage,
  copyText,
  makePhoneCall,
  getUrlParams
}
