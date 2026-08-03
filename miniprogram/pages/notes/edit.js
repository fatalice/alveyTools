const api = require('../../utils/api')

Page({
  data: {
    id: '',
    title: '',
    content: '',
    categoryId: '',
    categories: [],
    categoryNames: ['未分类'],
    categoryIndex: 0,
    saving: false,
  },

  onLoad(options) {
    this.setData({ id: options.id || '' })
    wx.setNavigationBarTitle({ title: options.id ? '编辑笔记' : '新建笔记' })
    this.loadCategories().then(() => {
      if (options.id) this.loadNote()
    })
  },

  async loadCategories() {
    try {
      const res = await api.noteCategories()
      const categories = (res && res.data) || []
      this.setData({
        categories,
        categoryNames: ['未分类'].concat(categories.map((c) => c.name)),
      })
    } catch (e) {
      // 分类加载失败不阻塞编辑
    }
  },

  async loadNote() {
    try {
      const res = await api.noteDetail(this.data.id)
      const note = (res && res.data) || null
      if (!note) return
      let idx = 0
      if (note.categoryId) {
        idx = this.data.categories.findIndex((c) => c._id === note.categoryId) + 1
        if (idx < 0) idx = 0
      }
      this.setData({
        title: note.title || '',
        content: note.content || '',
        categoryId: note.categoryId || '',
        categoryIndex: idx,
      })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onTitle(e) {
    this.setData({ title: e.detail.value })
  },
  onContent(e) {
    this.setData({ content: e.detail.value })
  },
  onCategoryChange(e) {
    const idx = Number(e.detail.value)
    const cat = this.data.categories[idx - 1]
    this.setData({ categoryIndex: idx, categoryId: cat ? cat._id : '' })
  },

  async onSave() {
    const { id, title, content, categoryId } = this.data
    if (!title.trim()) {
      wx.showToast({ title: '请填标题', icon: 'none' })
      return
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填内容', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      const res = id
        ? await api.noteUpdate({ _id: id, title, content, categoryId })
        : await api.noteCreate({ title, content, categoryId })
      if (res && res.code === 200) {
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 600)
      } else {
        wx.showToast({ title: (res && res.message) || '保存失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },
})
