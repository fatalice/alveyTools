const api = require('../../utils/api')

function formatTime(ts) {
  if (!ts) return ''
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
    note: null,
    categoryName: '',
    isMine: false,
    loading: true,
  },

  onLoad(options) {
    this.id = options.id
    this.load()
  },

  async load() {
    try {
      const myOpenid = await api.getOpenid().catch(() => '')
      const res = await api.noteDetail(this.id)
      const note = (res && res.data) || null
      let categoryName = ''
      if (note && note.categoryId) {
        try {
          const cres = await api.noteCategories()
          const cats = (cres && cres.data) || []
          categoryName = (cats.find((c) => c._id === note.categoryId) || {}).name || ''
        } catch (e) {}
      }
      if (note) note.timeText = formatTime(note.updatedAt || note.createdAt)
      this.setData({
        note,
        categoryName,
        isMine: !!(note && note.userId && note.userId === myOpenid),
        loading: false,
      })
    } catch (err) {
      console.error('note detail failed:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/notes/edit?id=${this.id}` })
  },

  onDelete() {
    wx.showModal({
      title: '删除笔记',
      content: '确定删除这篇笔记吗？',
      success: (r) => {
        if (r.confirm) this.doDelete()
      },
    })
  },

  async doDelete() {
    try {
      const res = await api.noteDelete(this.id)
      if (res && res.code === 200) {
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 600)
      } else {
        wx.showToast({ title: (res && res.message) || '删除失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },
})
