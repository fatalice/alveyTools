const api = require('../../utils/api')

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${h}:${min}`
}

Page({
  data: {
    list: [],
    categories: [],
    activeCategory: '',
    loading: true,
    myOpenid: '',
  },

  onShow() {
    this.loadAll()
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh())
  },

  async loadAll() {
    this.setData({ loading: true })
    const myOpenid = await api.getOpenid().catch(() => '')
    let categories = []
    try {
      const cres = await api.noteCategories()
      categories = (cres && cres.data) || []
    } catch (e) {
      categories = []
    }
    this.setData({ myOpenid, categories })
    await this.loadList()
  },

  async loadList() {
    try {
      const res = await api.notesList({ categoryId: this.data.activeCategory || undefined })
      const data = (res && res.data) || []
      const cats = this.data.categories
      const list = (Array.isArray(data) ? data : []).map((item) => ({
        ...item,
        timeText: formatTime(item.updatedAt || item.createdAt),
        contentPreview: (item.content || '').replace(/\s+/g, ' ').slice(0, 60),
        categoryName: (cats.find((c) => c._id === item.categoryId) || {}).name || '',
        isMine: !!item.userId && item.userId === this.data.myOpenid,
      }))
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('notes list failed:', err)
      this.setData({ list: [], loading: false })
    }
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id || ''
    this.setData({ activeCategory: id })
    this.loadList()
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/notes/edit' })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/notes/detail?id=${id}` })
  },
})
