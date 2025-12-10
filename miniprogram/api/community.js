/**
 * 社区相关API
 */
const { request } = require('../utils/request.js')

/**
 * 获取帖子列表
 */
function getPostList(params = {}) {
  return request({
    url: '/community/posts',
    method: 'GET',
    data: params
  })
}

/**
 * 获取帖子详情
 */
function getPostDetail(id) {
  return request({
    url: `/community/posts/${id}`,
    method: 'GET'
  })
}

/**
 * 创建帖子
 */
function createPost(data) {
  return request({
    url: '/community/posts',
    method: 'POST',
    data
  })
}

/**
 * 删除帖子
 */
function deletePost(id) {
  return request({
    url: `/community/posts/${id}`,
    method: 'DELETE'
  })
}

/**
 * 点赞帖子
 */
function likePost(id) {
  return request({
    url: `/community/posts/${id}/like`,
    method: 'POST'
  })
}

/**
 * 取消点赞
 */
function unlikePost(id) {
  return request({
    url: `/community/posts/${id}/like`,
    method: 'DELETE'
  })
}

/**
 * 获取评论列表
 */
function getComments(postId, params = {}) {
  return request({
    url: `/community/posts/${postId}/comments`,
    method: 'GET',
    data: params
  })
}

/**
 * 添加评论
 */
function addComment(postId, data) {
  return request({
    url: `/community/posts/${postId}/comments`,
    method: 'POST',
    data
  })
}

/**
 * 删除评论
 */
function deleteComment(postId, commentId) {
  return request({
    url: `/community/comments/${commentId}`,
    method: 'DELETE'
  })
}

module.exports = {
  getPostList,
  getPostDetail,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  getComments,
  addComment,
  deleteComment
}
