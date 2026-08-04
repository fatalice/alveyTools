import axios from 'axios'

const BASE_URL = 'https://wujiaqi12.site'

const http = axios.create({ baseURL: BASE_URL, timeout: 30000 })

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('admin_token')
  if (token && config.data && typeof config.data === 'object') {
    config.data._token = token
  }
  if (token) {
    config.headers['x-admin-token'] = token
  }
  return config
})

http.interceptors.response.use(
  (res) => {
    const data = res.data
    if (data && data.code === 403) {
      sessionStorage.removeItem('admin_token')
      if (!location.hash.includes('/login')) {
        location.hash = '#/login'
      }
    }
    return data
  },
  (err) => Promise.reject(err)
)

export function login(password) {
  return http.post('/admin/login', { password })
}

export function changePassword(oldPassword, newPassword) {
  return http.post('/admin/password', { oldPassword, newPassword })
}

export function getNotices() {
  return http.post('/admin/notices', {})
}

export function saveNotice(data) {
  return http.post('/admin/notices', data)
}

export function deleteNotice(_id) {
  return http.post('/admin/notices/delete', { _id })
}

export function getUsers() {
  return http.post('/admin/users', {})
}

export function addScore(userId, points, desc) {
  return http.post('/admin/score/add', { userId, points, desc })
}

export function qb(action, data = {}) {
  return http.post('/admin/qb', { action, ...data })
}

export function notes(action, data = {}) {
  return http.post('/admin/notes', { action, ...data })
}

export function examMeta(data = {}) {
  return http.post('/api/exam/meta', data)
}
