const storage = require('../../utils/checklist-storage')
const { searchTemplates, getTemplateById } = require('../../data/checklist-templates')

Page({
  data: {
    keyword: '',
    scenarioResults: [],
    checklistResults: [],
    hasSearched: false,
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({ keyword: options.keyword })
      this.doSearch(options.keyword)
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearchConfirm() {
    const kw = this.data.keyword.trim()
    if (!kw) {
      this.setData({ hasSearched: false, scenarioResults: [], checklistResults: [] })
      return
    }
    this.doSearch(kw)
  },

  doSearch(keyword) {
    const kw = keyword.toLowerCase()
    const scenarioResults = searchTemplates(keyword)
    const checklists = storage.getChecklists()
      .filter(c => c.title.toLowerCase().includes(kw))
      .map(c => {
        const total = c.groups.reduce((sum, g) => sum + g.items.length, 0)
        const done = c.groups.reduce((sum, g) => sum + g.items.filter(i => i.completed).length, 0)
        return { ...c, total, done, subtitle: `${done}/${total} · ${total}项` }
      })
    this.setData({ scenarioResults, checklistResults: checklists, hasSearched: true })
  },

  onClearKeyword() {
    this.setData({ keyword: '', hasSearched: false, scenarioResults: [], checklistResults: [] })
  },

  onScenarioTap(e) {
    const templateId = e.currentTarget.dataset.id
    const template = getTemplateById(templateId)
    if (!template) return
    wx.showModal({
      title: '创建清单',
      content: `从「${template.title}」创建清单副本？`,
      confirmColor: '#1a6b4a',
      confirmText: '创建',
      success: (res) => {
        if (res.confirm) {
          const checklist = storage.createFromTemplate(template)
          wx.navigateTo({ url: '/pages/checklist/detail?id=' + checklist.id })
        }
      }
    })
  },

  onChecklistTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/checklist/detail?id=' + id })
  },
})
