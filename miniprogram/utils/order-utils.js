/**
 * 订单工具函数
 */

/**
 * 计算剩余支付时间（毫秒）
 * @param {String} createdAt - 订单创建时间
 * @param {Number} minutes - 支付时限（分钟），默认15分钟
 * @returns {Number} 剩余毫秒数，<= 0 表示已过期
 */
function calculateRemainingTime(createdAt, minutes = 15) {
  const created = new Date(createdAt)
  const deadline = new Date(created.getTime() + minutes * 60 * 1000)
  const now = new Date()
  return deadline.getTime() - now.getTime()
}

/**
 * 格式化剩余时间为 MM:SS
 * @param {Number} milliseconds - 毫秒数
 * @returns {String} 格式化的时间字符串
 */
function formatRemainingTime(milliseconds) {
  if (milliseconds <= 0) return '00:00'

  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * 格式化订单编号（补零10位）
 * @param {Number} orderId - 订单ID
 * @returns {String} 格式化的订单编号
 */
function formatOrderNo(orderId) {
  return String(orderId).padStart(10, '0')
}

/**
 * 获取订单状态文本
 * @param {String} status - 订单状态
 * @returns {String} 状态文本
 */
function getStatusText(status) {
  const statusMap = {
    'pending': '待支付',
    'paid': '已支付',
    'active': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知'
}

/**
 * 获取订单状态颜色类
 * @param {String} status - 订单状态
 * @returns {String} 颜色类名
 */
function getStatusClass(status) {
  return `status-${status}`
}

/**
 * 判断订单是否可以取消
 * @param {String} status - 订单状态
 * @returns {Boolean}
 */
function canCancelOrder(status) {
  return ['pending', 'paid'].includes(status)
}

/**
 * 判断订单是否可以支付
 * @param {String} status - 订单状态
 * @returns {Boolean}
 */
function canPayOrder(status) {
  return status === 'pending'
}

/**
 * 获取订单操作按钮配置
 * @param {Object} order - 订单对象
 * @returns {Array} 按钮配置数组
 */
function getOrderActions(order) {
  const actions = []

  switch (order.status) {
    case 'pending':
      actions.push(
        { text: '取消订单', type: 'secondary', action: 'cancel' },
        { text: '立即支付', type: 'primary', action: 'pay' }
      )
      break
    case 'paid':
      actions.push(
        { text: '取消订单', type: 'secondary', action: 'cancel' },
        { text: '订单详情', type: 'primary', action: 'detail' }
      )
      break
    case 'active':
      actions.push(
        { text: '查看菜地', type: 'secondary', action: 'garden' },
        { text: '订单详情', type: 'primary', action: 'detail' }
      )
      break
    case 'completed':
      actions.push(
        { text: '再次租用', type: 'secondary', action: 'rent-again' },
        { text: '订单详情', type: 'primary', action: 'detail' }
      )
      break
    case 'cancelled':
      actions.push(
        { text: '删除订单', type: 'secondary', action: 'delete' }
      )
      break
  }

  return actions
}

/**
 * 格式化日期时间
 * @param {String} dateTimeStr - ISO日期时间字符串
 * @param {Boolean} showTime - 是否显示时间
 * @returns {String} 格式化的日期时间
 */
function formatDateTime(dateTimeStr, showTime = true) {
  if (!dateTimeStr) return ''

  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  if (!showTime) {
    return `${year}-${month}-${day}`
  }

  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 计算租用月数
 * @param {String} startDate - 开始日期
 * @param {String} endDate - 结束日期
 * @returns {Number} 租用月数
 */
function calculateMonths(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const months = (end.getFullYear() - start.getFullYear()) * 12 +
                 (end.getMonth() - start.getMonth())

  return Math.max(months, 1)
}

module.exports = {
  calculateRemainingTime,
  formatRemainingTime,
  formatOrderNo,
  getStatusText,
  getStatusClass,
  canCancelOrder,
  canPayOrder,
  getOrderActions,
  formatDateTime,
  calculateMonths
}
