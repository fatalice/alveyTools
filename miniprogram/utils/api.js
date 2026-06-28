// miniprogram/utils/api.js
// 通过 wx.request 调用云托管，启动时获取 openid 缓存

const BASE_URL = 'https://wujiaqi12.site'
const OPENID_KEY = 'alvey_openid'

let _openid = ''

function getOpenid() {
  if (_openid) return Promise.resolve(_openid)
  const cached = wx.getStorageSync(OPENID_KEY)
  if (cached) {
    _openid = cached
    return Promise.resolve(_openid)
  }
  return new Promise((resolve) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) { resolve(''); return }
        wx.request({
          url: `${BASE_URL}/api/auth/openid`,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: loginRes.code },
          success(res) {
            const openid = res.data && res.data.data && res.data.data.openid
            if (openid) {
              _openid = openid
              wx.setStorageSync(OPENID_KEY, openid)
            }
            resolve(_openid)
          },
          fail() { resolve('') },
        })
      },
      fail() { resolve('') },
    })
  })
}

function request({ path, method = 'GET', data = null }) {
  return new Promise(async (resolve, reject) => {
    const openid = await getOpenid()
    const opts = {
      url: `${BASE_URL}${path}`,
      method,
      header: {
        'Content-Type': 'application/json',
        'X-WX-OPENID': openid,
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({ code: res.statusCode, message: res.data?.message || `HTTP ${res.statusCode}` })
        }
      },
      fail(err) {
        const errMsg = err.errMsg || String(err)
        reject({ code: 'REQUEST_ERROR', message: errMsg })
      },
    }
    if (method !== 'GET') {
      opts.data = { ...(data || {}), _openid: openid }
    }
    wx.request(opts)
  })
}

// ---- 用户 / 身份 ----

function getWxContext() {
  return request({ path: '/api/getWxContext', method: 'GET' })
}

function genPersonalInfo() {
  return request({ path: '/api/genPersonalInfo', method: 'POST', data: {} })
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

function mjFindMyRoom() {
  return request({ path: '/api/mj/findMyRoom', method: 'POST', data: {} })
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

function getScoreInfo() {
  return request({ path: '/api/score/info', method: 'POST', data: {} })
}

function scoreCheckin() {
  return request({ path: '/api/score/checkin', method: 'POST', data: {} })
}

// ---- 牙套日记 ----

function getBraceDiaryList() {
  return request({ path: '/api/brace-diary/list', method: 'POST', data: {} })
}

function getBraceDiaryDetail(id) {
  return request({ path: '/api/brace-diary/detail', method: 'POST', data: { id } })
}

function createBraceDiary(data) {
  return request({ path: '/api/brace-diary/create', method: 'POST', data })
}

function updateBraceDiary(data) {
  return request({ path: '/api/brace-diary/update', method: 'POST', data })
}

function deleteBraceDiary(id) {
  return request({ path: '/api/brace-diary/delete', method: 'POST', data: { _id: id } })
}

module.exports = {
  BASE_URL,
  getOpenid,
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
  getBraceDiaryList, getBraceDiaryDetail,
  createBraceDiary, updateBraceDiary, deleteBraceDiary,
}
