const storage = require('../../utils/checklist-storage')

Page({
  data: {
    checklistCount: 0,
    customTemplateCount: 0,
    favoriteCount: 0,
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const checklists = storage.getChecklists()
    const customTemplates = storage.getCustomTemplates()
    const favorites = storage.getFavorites()
    this.setData({
      checklistCount: checklists.length,
      customTemplateCount: customTemplates.length,
      favoriteCount: favorites.length,
    })
  },

  onMenuTap(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'list') {
      wx.navigateTo({ url: '/pages/checklist/list' })
    } else if (type === 'favorites') {
      wx.navigateTo({ url: '/pages/checklist/list?type=favorites' })
    } else if (type === 'templates') {
      wx.navigateTo({ url: '/pages/checklist/list?type=templates' })
    } else if (type === 'edited') {
      wx.navigateTo({ url: '/pages/checklist/list?type=edited' })
    } else if (type === 'data-info') {
      this.showDataInfo()
    }
  },

  showDataInfo() {
    wx.showModal({
      title: '本地数据说明',
      content: '羊羊清单的所有数据仅保存在本机微信缓存中，不会上传到服务器。清理微信缓存或卸载微信会导致数据丢失，请知悉。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#1a6b4a',
    })
  },
})
