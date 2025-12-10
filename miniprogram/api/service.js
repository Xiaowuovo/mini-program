/**
 * 增值服务相关API
 */
const { request } = require('../utils/request.js')

/**
 * 获取服务列表
 */
function getServiceList(params = {}) {
  return request({
    url: '/services',
    method: 'GET',
    data: params
  })
}

/**
 * 获取服务详情
 */
function getServiceDetail(id) {
  return request({
    url: `/services/${id}`,
    method: 'GET'
  })
}

/**
 * 预约服务
 */
function bookService(data) {
  return request({
    url: '/service-orders',
    method: 'POST',
    data
  })
}

/**
 * 获取服务订单列表
 */
function getServiceOrders(params = {}) {
  return request({
    url: '/service-orders',
    method: 'GET',
    data: params
  })
}

/**
 * 获取服务订单详情
 */
function getServiceOrderDetail(id) {
  return request({
    url: `/service-orders/${id}`,
    method: 'GET'
  })
}

/**
 * 取消服务订单
 */
function cancelServiceOrder(id) {
  return request({
    url: `/service-orders/${id}/cancel`,
    method: 'PUT'
  })
}

/**
 * 完成服务订单
 */
function completeServiceOrder(id, data) {
  return request({
    url: `/service-orders/${id}/complete`,
    method: 'PUT',
    data
  })
}

module.exports = {
  getServiceList,
  getServiceDetail,
  bookService,
  getServiceOrders,
  getServiceOrderDetail,
  cancelServiceOrder,
  completeServiceOrder
}