// utils/recipe.js
// 菜谱相关：走 HTTP 后端（wujiaqi12.site/api/recipes），复用 api.js 的 request()
// 后端用 admin SDK 服务端访问云数据库，不依赖小程序 appid 关联 CloudBase 环境

// 列出菜谱（按分类筛选，默认全部）
function listRecipes(cat, limit = 50) {
  const api = require('./api')
  return api
    .request({ path: '/api/recipes', method: 'POST', data: { action: 'list', cat, limit } })
    .then((r) => r.data)
}

// 单个菜谱详情
function getRecipe(id) {
  const api = require('./api')
  return api
    .request({ path: '/api/recipes', method: 'POST', data: { action: 'detail', _id: id } })
    .then((r) => r.data)
}

// 当前用户收藏的菜谱（完整菜谱数组，用于「已收藏」tab）
function listLikedRecipes() {
  const api = require('./api')
  return api
    .request({ path: '/api/recipes', method: 'POST', data: { action: 'liked' } })
    .then((r) => r.data)
}

// 当前用户收藏的 recipeId 数组（轻量，用于列表页标注红心）
function listLikedIds() {
  const api = require('./api')
  return api
    .request({ path: '/api/recipes', method: 'POST', data: { action: 'likedIds' } })
    .then((r) => r.data)
}

// 某菜谱是否已被当前用户收藏
function isLiked(recipeId) {
  const api = require('./api')
  return api
    .request({ path: '/api/recipes', method: 'POST', data: { action: 'isLiked', recipeId } })
    .then((r) => r.data.liked)
}

// 切换收藏：liked=true 表示已收藏 → 取消；false → 添加。返回新的收藏态
function toggleLike(recipeId, liked) {
  const api = require('./api')
  const action = liked ? 'unlike' : 'like'
  return api
    .request({ path: '/api/recipes', method: 'POST', data: { action, recipeId } })
    .then((r) => r.data.liked)
}

module.exports = {
  listRecipes,
  getRecipe,
  listLikedRecipes,
  listLikedIds,
  isLiked,
  toggleLike,
}
