/**
 * 管理员相关API
 */
const { get } = require('../utils/request.js')

/**
 * 获取管理统计数据（仅管理员）
 */
function getAdminStats() {
  return get('/admin/stats')
}

/**
 * 获取所有用户列表（仅管理员）
 */
function getAdminUsers(params = {}) {
  return get('/admin/users', params)
}

/**
 * 获取首页公开统计数据（无需登录）
 */
function getPublicStats() {
  return get('/admin/public-stats', {}, false)
}

module.exports = {
  getAdminStats,
  getAdminUsers,
  getPublicStats
}
