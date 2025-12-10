/**
 * 订单相关API
 */
const { request } = require('../utils/request.js')

/**
 * 获取订单列表
 */
function getOrderList(params = {}) {
  return request({
    url: '/orders',
    method: 'GET',
    data: params
  })
}

/**
 * 获取订单详情
 */
function getOrderDetail(id) {
  return request({
    url: `/orders/${id}`,
    method: 'GET'
  })
}

/**
 * 创建订单
 */
function createOrder(data) {
  return request({
    url: '/orders',
    method: 'POST',
    data
  })
}

/**
 * 取消订单
 */
function cancelOrder(id) {
  return request({
    url: `/orders/${id}/cancel`,
    method: 'PUT'
  })
}

/**
 * 支付订单
 */
function payOrder(id, paymentData) {
  return request({
    url: `/orders/${id}/pay`,
    method: 'PUT',
    data: paymentData
  })
}

/**
 * 完成订单
 */
function completeOrder(id) {
  return request({
    url: `/orders/${id}/complete`,
    method: 'PUT'
  })
}

module.exports = {
  getOrderList,
  getOrderDetail,
  createOrder,
  cancelOrder,
  payOrder,
  completeOrder
}