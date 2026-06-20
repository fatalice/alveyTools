const api = require('../../../utils/api')

function formatTime(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${month}/${day} ${h}:${m}`
}

Page({
  data: {
    notices: [],
  },

  onShow() {
    this.fetchNotices()
  },

  async fetchNotices() {
    try {
      const res = await api.request({ path: '/api/notices', method: 'GET' })
      const list = ((res && res.data) || []).map(item => ({
        ...item,
        timeText: formatTime(item.createdAt),
      }))
      this.setData({ notices: list })
    } catch (err) {
      console.error('fetchNotices failed:', err)
    }
  },
})
