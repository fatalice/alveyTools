const storage = require('../../utils/checklist-storage')
const { CATEGORIES, TEMPLATES, getTemplatesByCategory, searchTemplates, getTemplateById } = require('../../data/checklist-templates')

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: 'all',
    scenarioList: [],
    keyword: '',
  },

  onLoad() {
    this.setData({ scenarioList: TEMPLATES })
  },

  onCategoryTap(e) {
    const catId = e.currentTarget.dataset.id
    const list = this.data.keyword ? searchTemplates(this.data.keyword) : getTemplatesByCategory(catId)
    this.setData({ activeCategory: catId, scenarioList: list })
  },

  onSearchInput(e) {
    const keyword = e.detail.value
    let list
    if (keyword) {
      list = searchTemplates(keyword)
    } else {
      list = getTemplatesByCategory(this.data.activeCategory)
    }
    this.setData({ keyword, scenarioList: list })
  },

  onClearSearch() {
    const list = getTemplatesByCategory(this.data.activeCategory)
    this.setData({ keyword: '', scenarioList: list })
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
})
