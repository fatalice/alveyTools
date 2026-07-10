const storage = require('../../utils/checklist-storage')

Page({
  data: {
    checklist: null,
    groups: [],
    totalItems: 0,
    doneItems: 0,
    pendingItems: 0,
    progressPercent: 0,
    isFavorite: false,
    showFavorite: false,
  },

  onLoad(options) {
    this._id = options.id
  },

  onShow() {
    this.loadChecklist()
  },

  loadChecklist() {
    const checklist = storage.getChecklist(this._id)
    if (!checklist) {
      wx.showToast({ title: '清单不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }

    // Compute group-level stats for display in wxml
    const groups = checklist.groups.map(g => ({
      ...g,
      doneCount: g.items.filter(i => i.completed).length,
      totalCount: g.items.length,
    }))

    const totalItems = groups.reduce((sum, g) => sum + g.totalCount, 0)
    const doneItems = groups.reduce((sum, g) => sum + g.doneCount, 0)
    const pendingItems = totalItems - doneItems
    const progressPercent = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0
    const showFavorite = !!checklist.sourceScenarioId
    const isFavorite = showFavorite ? storage.isFavorite(checklist.sourceScenarioId) : false

    this.setData({
      checklist,
      groups,
      totalItems,
      doneItems,
      pendingItems,
      progressPercent,
      isFavorite,
      showFavorite,
    })
  },

  onToggleItem(e) {
    const { groupId, itemId } = e.currentTarget.dataset
    const updated = storage.toggleItem(this._id, groupId, itemId)
    if (updated) {
      this.loadChecklist()
    }
  },

  onEdit() {
    wx.navigateTo({ url: '/pages/checklist/edit?id=' + this._id })
  },

  onReset() {
    wx.showModal({
      title: '重置进度',
      content: '将清空所有勾选状态，清单内容不变。确定重置？',
      confirmColor: '#1a6b4a',
      success: (res) => {
        if (res.confirm) {
          storage.resetProgress(this._id)
          this.loadChecklist()
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  },

  onToggleFavorite() {
    if (!this.data.checklist.sourceScenarioId) return
    storage.toggleFavorite(this.data.checklist.sourceScenarioId)
    this.setData({ isFavorite: !this.data.isFavorite })
  },

  onEditTitle() {
    const current = this.data.checklist.title
    wx.showModal({
      title: '修改清单名称',
      editable: true,
      placeholderText: '输入新的清单名称',
      content: current,
      confirmColor: '#1a6b4a',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const newTitle = res.content.trim()
          const checklist = this.data.checklist
          checklist.title = newTitle
          storage.saveChecklist(checklist)
          this.setData({ checklist })
          wx.showToast({ title: '已修改', icon: 'success' })
        }
      }
    })
  },
})
