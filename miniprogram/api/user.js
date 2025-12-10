// api/user.js
const { get, put } = require('../utils/request.js')

/**
 * 获取当前用户信息
 */
function getUserInfo() {
  return get('/users/me')
}

/**
 * 更新用户信息
 */
function updateUserInfo(data) {
  return put('/users/me', data)
}

module.exports = {
  getUserInfo,
  updateUserInfo
}
