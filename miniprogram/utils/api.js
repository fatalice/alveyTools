// miniprogram/utils/api.js
// 集中管理所有 callContainer 调用，统一配置、错误处理与 Cloud 实例管理

const ENV_ID = 'cloudenv1-d4gkp36fb4243e78c'
const SERVICE_NAME = 'fataliceenv'

// 懒加载单例 Cloud 实例（callContainer 需要独立的 Cloud 对象）
let _cloudInstance = null
async function getCloudInstance() {
  if (_cloudInstance) return _cloudInstance
  _cloudInstance = new wx.cloud.Cloud({ resourceEnv: ENV_ID })
  await _cloudInstance.init()
  return _cloudInstance
}

// 重置 Cloud 实例（用于出错后重新初始化）
function resetCloudInstance() {
  _cloudInstance = null
}

// 核心 callContainer 包装
async function callContainer({ path, method = 'GET', data = null, header = {} }) {
  const c1 = await getCloudInstance()
  const opts = {
    path,
    method,
    header: {
      'X-WX-SERVICE': SERVICE_NAME,
      ...header,
    },
  }
  if (data && method !== 'GET') {
    opts.data = data
  }
  try {
    const res = await c1.callContainer(opts)
    let body = res.data
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { return body }
    }
    return body
  } catch (err) {
    const errMsg = (err.errMsg || String(err))
    if (errMsg.includes('Environment not found') || errMsg.includes('env check invalid')) {
      throw { code: 'ENV_NOT_FOUND', message: '云开发环境未找到，请检查 envId 配置' }
    }
    if (errMsg.includes('service not found') || errMsg.includes('not exist') || errMsg.includes('no such service')) {
      throw { code: 'SERVICE_NOT_FOUND', message: '云托管服务未找到，请确认 fataliceenv 已部署' }
    }
    if (errMsg.includes('timeout')) {
      throw { code: 'TIMEOUT', message: '请求超时，请稍后重试' }
    }
    throw { code: 'CALL_CONTAINER_ERROR', message: errMsg }
  }
}

// ---- 用户 / 身份 ----

function getWxContext() {
  return callContainer({ path: '/api/getWxContext', method: 'GET' })
}

function genPersonalInfo(userId) {
  return callContainer({ path: '/api/genPersonalInfo', method: 'POST', data: { userId } })
}

function savePersonalInfo(data) {
  return callContainer({ path: '/api/savePersonalInfo', method: 'POST', data })
}

// ---- 麻将 ----

function mjCreateRoom(data) {
  return callContainer({ path: '/api/mj/createRoom', method: 'POST', data })
}

function mjJoinRoom(data) {
  return callContainer({ path: '/api/mj/joinRoom', method: 'POST', data })
}

function mjGetRoom(roomId) {
  return callContainer({ path: '/api/mj/getRoom', method: 'POST', data: { roomId } })
}

function mjFindMyRoom(userId) {
  return callContainer({ path: '/api/mj/findMyRoom', method: 'POST', data: { userId } })
}

function mjLeaveRoom(data) {
  return callContainer({ path: '/api/mj/leaveRoom', method: 'POST', data })
}

function mjRecordRound(data) {
  return callContainer({ path: '/api/mj/recordRound', method: 'POST', data })
}

function mjUndoRound(data) {
  return callContainer({ path: '/api/mj/undoRound', method: 'POST', data })
}

function mjEndGame(data) {
  return callContainer({ path: '/api/mj/endGame', method: 'POST', data })
}

function mjListGames(data) {
  return callContainer({ path: '/api/mj/listGames', method: 'POST', data })
}

function mjGetGame(data) {
  return callContainer({ path: '/api/mj/getGame', method: 'POST', data })
}

// ---- 文件上传 ----

function uploadFile(data) {
  return callContainer({ path: '/api/upload', method: 'POST', data })
}

// ---- 内容发布 ----

function release(data) {
  return callContainer({ path: '/api/release', method: 'POST', data })
}

function getHomeCards(category = '', limit = 20) {
  const query = category ? `?category=${category}&limit=${limit}` : `?limit=${limit}`
  return callContainer({ path: `/home/cards${query}`, method: 'GET' })
}

function getHomeSwipers() {
  return callContainer({ path: '/home/swipers', method: 'GET' })
}

// ---- 工具 ----

function echo(data) {
  return callContainer({ path: '/echo', method: 'GET' })
}

module.exports = {
  ENV_ID,
  SERVICE_NAME,
  callContainer,
  getCloudInstance,
  resetCloudInstance,
  getWxContext,
  genPersonalInfo,
  savePersonalInfo,
  mjCreateRoom, mjJoinRoom, mjGetRoom, mjFindMyRoom,
  mjLeaveRoom, mjRecordRound, mjUndoRound, mjEndGame,
  mjListGames, mjGetGame,
  uploadFile, release,
  getHomeCards, getHomeSwipers,
  echo,
}
