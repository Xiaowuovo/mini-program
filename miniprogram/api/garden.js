// api/garden.js
const { get, post, put, del } = require('../utils/request.js')

/**
 * 获取菜地列表（公开接口，可选登录）
 */
function getGardenList(params = {}) {
  // needAuth设为false，但如果已登录会自动带token，后端会标记is_mine
  return get('/gardens', params, false)
}

/**
 * 获取我的菜地列表（需要登录）
 */
function getMyGardens(params = {}) {
  return get('/gardens/my', params, true)
}

/**
 * 获取菜地详情（公开接口，可选登录）
 */
function getGardenDetail(id) {
  return get(`/gardens/${id}`, {}, false)
}

/**
 * 创建菜地（管理员）
 */
function createGarden(data) {
  return post('/gardens', data)
}

/**
 * 更新菜地（管理员）
 */
function updateGarden(id, data) {
  return put(`/gardens/${id}`, data)
}

/**
 * 删除菜地（管理员）
 */
function deleteGarden(id) {
  return del(`/gardens/${id}`)
}

module.exports = {
  getGardenList,
  getMyGardens,
  getGardenDetail,
  createGarden,
  updateGarden,
  deleteGarden
}
