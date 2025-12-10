// api/auth.js
const { post } = require('../utils/request.js')

/**
 * 微信登录
 */
function wechatLogin(code) {
  return post('/auth/wechat-login', { code }, false)
}

/**
 * 测试登录（开发用）
 * @param {string} nickname - 用户昵称
 * @param {string} role - 用户角色（tenant/admin）
 */
function testLogin(nickname = '测试用户', role = 'tenant') {
  return post('/auth/test-login', { nickname, role }, false)
}

module.exports = {
  wechatLogin,
  testLogin
}
