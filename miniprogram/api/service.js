/**
 * 增值服务相关API
 */
const { request } = require('../utils/request.js')

/**
 * 获取服务价格配置（无需登录）
 */
function getServicePrices() {
  return request({
    url: '/services/prices',
    method: 'GET'
  })
}

/**
 * 获取我的服务订单列表
 */
function getMyServiceOrders(params = {}) {
  return request({
    url: '/services',
    method: 'GET',
    data: params
  })
}

/**
 * 获取服务订单详情
 */
function getServiceOrderDetail(id) {
  return request({
    url: `/services/${id}`,
    method: 'GET'
  })
}

/**
 * 预约服务（需要 order_id + service_type）
 */
function bookService(data) {
  return request({
    url: '/services',
    method: 'POST',
    data
  })
}

/**
 * 取消服务订单
 */
function cancelServiceOrder(id) {
  return request({
    url: `/services/${id}/cancel`,
    method: 'PUT'
  })
}

module.exports = {
  getServicePrices,
  getMyServiceOrders,
  getServiceOrderDetail,
  bookService,
  cancelServiceOrder
}