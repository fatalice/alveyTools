const api = require('../../../utils/api')

const MOOD_MAP = {
  happy: { emoji: '😊', label: '开心' },
  normal: { emoji: '😐', label: '一般' },
  uncomfortable: { emoji: '😣', label: '不适' },
  tired: { emoji: '😴', label: '疲惫' },
  excited: { emoji: '🤩', label: '期待' },
  annoyed: { emoji: '😤', label: '烦躁' },
}

function formatTime(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

Page({
  data: {
    id: '',
    detail: null,
  },

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    if (this.data.id) this.loadDetail()
  },

  async loadDetail() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await api.getBraceDiaryDetail(this.data.id)
      const data = (res && res.data) || res
      const mood = MOOD_MAP[data.mood] || { emoji: '😐', label: data.mood }
      this.setData({
        detail: {
          ...data,
          images: data.images || [],
          moodEmoji: mood.emoji,
          moodLabel: mood.label,
          timeText: formatTime(data.eventTime),
          createdText: formatTime(data.createdAt),
        },
      })
    } catch (err) {
      console.error('loadDetail failed:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.detail.images,
    })
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/sheep-circle/brace-diary/edit?id=${this.data.id}` })
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmColor: '#fa5151',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          await api.deleteBraceDiary(this.data.id)
          wx.hideLoading()
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 800)
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  },
})
