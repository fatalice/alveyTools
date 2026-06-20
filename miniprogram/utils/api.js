// miniprogram/utils/api.js
// 集中管理所有 API 调用，通过自定义域名 + wx.request 方式

const BASE_URL = 'https://wujiaqi12.site'

// 核心请求封装
function request({ path, method = 'GET', data = null }) {
  return new Promise((resolve, reject) => {
    const opts = {
      url: `${BASE_URL}${path}`,
      method,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({ code: res.statusCode, message: res.data?.message || `HTTP ${res.statusCode}` })
        }
      },
      fail(err) {
        const errMsg = err.errMsg || String(err)
        if (errMsg.includes('timeout')) {
          reject({ code: 'TIMEOUT', message: '请求超时，请稍后重试' })
        } else {
          reject({ code: 'REQUEST_ERROR', message: errMsg })
        }
      },
    }
    if (data && method !== 'GET') {
      opts.data = data
    }
    wx.request(opts)
  })
}

// ---- 用户 / 身份 ----

function getWxContext() {
  return request({ path: '/api/getWxContext', method: 'GET' })
}

function genPersonalInfo(userId) {
  return request({ path: '/api/genPersonalInfo', method: 'POST', data: { userId } })
}

function savePersonalInfo(data) {
  return request({ path: '/api/savePersonalInfo', method: 'POST', data })
}

// ---- 麻将 ----

function mjCreateRoom(data) {
  return request({ path: '/api/mj/createRoom', method: 'POST', data })
}

function mjJoinRoom(data) {
  return request({ path: '/api/mj/joinRoom', method: 'POST', data })
}

function mjGetRoom(roomId) {
  return request({ path: '/api/mj/getRoom', method: 'POST', data: { roomId } })
}

function mjFindMyRoom(userId) {
  return request({ path: '/api/mj/findMyRoom', method: 'POST', data: { userId } })
}

function mjLeaveRoom(data) {
  return request({ path: '/api/mj/leaveRoom', method: 'POST', data })
}

function mjRecordRound(data) {
  return request({ path: '/api/mj/recordRound', method: 'POST', data })
}

function mjUndoRound(data) {
  return request({ path: '/api/mj/undoRound', method: 'POST', data })
}

function mjEndGame(data) {
  return request({ path: '/api/mj/endGame', method: 'POST', data })
}

function mjListGames(data) {
  return request({ path: '/api/mj/listGames', method: 'POST', data })
}

function mjGetGame(data) {
  return request({ path: '/api/mj/getGame', method: 'POST', data })
}

// ---- 文件上传 ----

function uploadFile(data) {
  return request({ path: '/api/upload', method: 'POST', data })
}

// ---- 内容发布 ----

function release(data) {
  return request({ path: '/api/release', method: 'POST', data })
}

function getHomeCards(category = '', limit = 20) {
  const query = category ? `?category=${category}&limit=${limit}` : `?limit=${limit}`
  return request({ path: `/home/cards${query}`, method: 'GET' })
}

function getHomeSwipers() {
  return request({ path: '/home/swipers', method: 'GET' })
}

// ---- 工具 ----

function echo() {
  return request({ path: '/echo', method: 'GET' })
}

// ---- 题库 ----

function getExamMeta() {
  return request({ path: '/api/exam/meta', method: 'POST' })
}

function getExamQuestions(data) {
  return request({ path: '/api/exam/questions', method: 'POST', data })
}

// ---- 留言板 ----

function getMessages() {
  return request({ path: '/api/messages/list', method: 'GET' })
}

function postMessage(data) {
  return request({ path: '/api/messages/post', method: 'POST', data })
}

// ---- 积分 ----

function getScoreInfo(data) {
  return request({ path: '/api/score/info', method: 'POST', data })
}

function scoreCheckin(data) {
  return request({ path: '/api/score/checkin', method: 'POST', data })
}

module.exports = {
  BASE_URL,
  request,
  getWxContext,
  genPersonalInfo,
  savePersonalInfo,
  mjCreateRoom, mjJoinRoom, mjGetRoom, mjFindMyRoom,
  mjLeaveRoom, mjRecordRound, mjUndoRound, mjEndGame,
  mjListGames, mjGetGame,
  uploadFile, release,
  getHomeCards, getHomeSwipers,
  echo,
  getExamMeta, getExamQuestions,
  getMessages, postMessage,
  getScoreInfo, scoreCheckin,
}
