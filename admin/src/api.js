import axios from 'axios'

const BASE_URL = 'https://wujiaqi12.site'

const http = axios.create({ baseURL: BASE_URL })

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('admin_token')
  if (token && config.data && typeof config.data === 'object') {
    config.data._token = token
  }
  return config
})

export function login(password) {
  return http.post('/admin/login', { password }).then(r => r.data)
}

export function getNotices() {
  return http.post('/admin/notices', {}).then(r => r.data)
}

export function saveNotice(data) {
  return http.post('/admin/notices', data).then(r => r.data)
}

export function deleteNotice(_id) {
  return http.post('/admin/notices/delete', { _id }).then(r => r.data)
}

export function getUsers() {
  return http.post('/admin/users', {}).then(r => r.data)
}

export function addScore(userId, points, desc) {
  return http.post('/admin/score/add', { userId, points, desc }).then(r => r.data)
}
