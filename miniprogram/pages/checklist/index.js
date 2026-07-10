const storage = require('../../utils/checklist-storage')
const { TEMPLATES } = require('../../data/checklist-templates')

Page({
  data: {
    continueList: [],
    scenarioList: [],
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const continueList = storage.getIncompleteChecklists(3).map(c => {
      const total = c.groups.reduce((sum, g) => sum + g.items.length, 0)
      const done = c.groups.reduce((sum, g) => sum + g.items.filter(i => i.completed).length, 0)
      return { ...c, total, done, progressText: done + '/' + total }
    })
    this.setData({
      continueList,
      scenarioList: TEMPLATES,
    })
  },

  onNewChecklist() {
    wx.showActionSheet({
      itemList: ['从场景开始', '自定义清单'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.redirectTo({ url: '/pages/checklist/scenarios' })
        } else {
          const checklist = storage.createBlankChecklist()
          wx.navigateTo({ url: '/pages/checklist/detail?id=' + checklist.id })
        }
      }
    })
  },

  onFromScenario() {
    wx.redirectTo({ url: '/pages/checklist/scenarios' })
  },

  onCustomCreate() {
    const checklist = storage.createBlankChecklist()
    wx.navigateTo({ url: '/pages/checklist/detail?id=' + checklist.id })
  },

  onSearchTap() {
    wx.navigateTo({ url: '/pages/checklist/search' })
  },

  onContinueTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/checklist/detail?id=' + id })
  },

  onContinueAll() {
    wx.navigateTo({ url: '/pages/checklist/list' })
  },

  onScenarioTap(e) {
    const templateId = e.currentTarget.dataset.id
    const { getTemplateById } = require('../../data/checklist-templates')
    const template = getTemplateById(templateId)
    if (template) {
      const checklist = storage.createFromTemplate(template)
      wx.navigateTo({ url: '/pages/checklist/detail?id=' + checklist.id })
    }
  },
})
