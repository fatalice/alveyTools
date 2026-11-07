// recipe-list/index.js
const recipe = require('../../utils/recipe')

Page({
  data: {
    tab: 'browse',
    activeCat: 'all',
    cats: [
      { key: 'all', label: '全部' },
      { key: 'brunch', label: 'Brunch' },
      { key: 'steak', label: '牛排' },
      { key: 'pasta', label: '意面' },
      { key: 'salad', label: '沙拉' },
      { key: 'dessert', label: '甜点' },
    ],
    browseList: [],
    savedList: [],
    savedCount: 0,
    loading: true,
  },

  onLoad() {
    this.loadBrowse()
  },

  onShow() {
    // 从详情页返回后刷新收藏态
    if (this.data.tab === 'saved') {
      this.loadSaved()
    }
  },

  async loadBrowse() {
    this.setData({ loading: true })
    try {
      const list = await recipe.listRecipes(this.data.activeCat)
      // 标注每个菜谱的收藏态
      const likedIds = await this.getLikedIds()
      const annotated = list.map((r) => ({ ...r, liked: likedIds.includes(r._id) }))
      this.setData({ browseList: annotated, loading: false })
    } catch (e) {
      console.warn('loadBrowse fail', e)
      this.setData({ loading: false })
    }
  },

  async loadSaved() {
    this.setData({ loading: true })
    try {
      const list = await recipe.listLikedRecipes()
      this.setData({ savedList: list, savedCount: list.length, loading: false })
    } catch (e) {
      console.warn('loadSaved fail', e)
      this.setData({ loading: false })
    }
  },

  // 取当前用户所有收藏 recipeId（用于浏览列表标注红心）
  async getLikedIds() {
    try {
      return await recipe.listLikedIds()
    } catch (e) {
      return []
    }
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab })
    if (tab === 'browse') {
      this.loadBrowse()
    } else {
      this.loadSaved()
    }
  },

  onCatTap(e) {
    const cat = e.currentTarget.dataset.cat
    if (cat === this.data.activeCat) return
    this.setData({ activeCat: cat })
    this.loadBrowse()
  },

  onRecipeTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` })
  },

  async onLikeTap(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    const inSaved = !!e.currentTarget.dataset.saved
    const list = inSaved ? this.data.savedList : this.data.browseList
    const item = list[index]
    if (!item) return

    try {
      const nowLiked = await recipe.toggleLike(id, item.liked)
      // 更新当前列表该项
      if (inSaved) {
        // 已收藏 tab 里取消收藏 → 从列表移除
        const savedList = this.data.savedList.filter((_, i) => i !== index)
        this.setData({ savedList, savedCount: savedList.length })
      } else {
        this.setData({
          [`browseList[${index}].liked`]: nowLiked,
        })
      }
      wx.showToast({
        title: nowLiked ? '已收藏' : '已取消收藏',
        icon: 'none',
      })
    } catch (err) {
      wx.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  },
})
