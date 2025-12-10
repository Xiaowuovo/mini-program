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
 */
function testLogin(nickname = '测试用户') {
  return post('/auth/test-login', { nickname }, false)
}

module.exports = {
  wechatLogin,
  testLogin
}
