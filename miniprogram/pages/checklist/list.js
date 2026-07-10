const storage = require('../../utils/checklist-storage')
const { getTemplateById } = require('../../data/checklist-templates')

const CATEGORY_NAMES = {
  travel: '出行',
  growth: '成长',
  family: '家庭',
  baby: '母婴',
  errands: '办事',
}

Page({
  data: {
    checklists: [],
    filterType: '',
    isEmpty: false,
  },

  onLoad(options) {
    this.setData({ filterType: options.type || '' })
  },

  onShow() {
    this.loadList()
  },

  loadList() {
    let checklists = storage.getChecklists()
    if (this.data.filterType === 'edited') {
      checklists = checklists.filter(c => c.isEdited)
    }
    const mapped = checklists.map(c => {
      const total = c.groups.reduce((sum, g) => sum + g.items.length, 0)
      const done = c.groups.reduce((sum, g) => sum + g.items.filter(i => i.completed).length, 0)
      const categoryName = CATEGORY_NAMES[c.category] || c.category || '未分类'
      return {
        ...c,
        total,
        done,
        categoryName,
        subtitle: `${categoryName} · ${done}/${total} · ${total}项`,
      }
    }).sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    this.setData({ checklists: mapped, isEmpty: mapped.length === 0 })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/checklist/detail?id=' + id })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除清单',
      content: '确定删除这份清单吗？删除后不可恢复。',
      confirmColor: '#e74c3c',
      confirmText: '删除',
      success: (res) => {
        if (res.confirm) {
          storage.deleteChecklist(id)
          this.loadList()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  onFromScenario() {
    wx.redirectTo({ url: '/pages/checklist/scenarios' })
  },
})
