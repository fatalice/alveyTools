// index.js
const recipe = require('../../utils/recipe')

// 开心羊圈入口项：仅白名单 openid 可见，默认不在 tools 里展示
const SHEEP_TOOL = {
  key: 'sheep',
  icon: '🐑',
  name: '开心羊圈',
  desc: '考试 · 笔记 · 社区，你的私人领地',
  bg: '#f4e4d2',
  badge: '私人',
  badgeBg: '#f4e4d2',
  badgeFg: '#b85a22',
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 64,
    menuRight: 110,
    greeting: '下午好',
    dateStr: '',
    featured: null,
    toolCount: 2,
    tools: [
      {
        key: 'recipe',
        icon: '🍽',
        name: '菜谱大全',
        desc: '西式菜谱 · 官方精选',
        bg: '#f4e4d2',
        badge: 'brunch',
        badgeBg: '#f4e4d2',
        badgeFg: '#b85a22',
      },
      {
        key: 'toolbox',
        icon: '🔧',
        name: '工具箱',
        desc: '汇率换算等实用小工具',
        bg: '#e7f3ec',
        badge: '12 个',
        badgeBg: '#e7f3ec',
        badgeFg: '#156a39',
      },
    ],
  },

  onLoad() {
    this.computeNav()
    this.setGreeting()
    this.loadFeatured()
    this.checkSheepAccess()
  },

  // 白名单校验通过才把羊圈入口加入 tools，避免无关人员看到产生疑惑
  async checkSheepAccess() {
    const api = require('../../utils/api')
    const allowed = await api.isSheepAllowed()
    if (allowed) {
      this.setData({
        tools: [...this.data.tools, SHEEP_TOOL],
        toolCount: this.data.tools.length + 1,
      })
    }
  },

  onShow() {
    // 从详情页取消收藏后回到首页，主推卡无需刷新；如需可在此 reload
  },

  // 根据微信胶囊位置算自定义导航栏尺寸
  computeNav() {
    const sys = wx.getWindowInfo()
    const menu = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = sys.statusBarHeight
    const navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height + statusBarHeight
    const menuRight = sys.windowWidth - menu.left + 8
    this.setData({ statusBarHeight, navBarHeight, menuRight })
  },

  setGreeting() {
    const h = new Date().getHours()
    let g = '晚上好'
    if (h < 6) g = '凌晨好'
    else if (h < 12) g = '早上好'
    else if (h < 14) g = '中午好'
    else if (h < 18) g = '下午好'
    const d = new Date()
    const week = '日一二三四五六'[d.getDay()]
    this.setData({
      greeting: g,
      dateStr: `周${week} · ${d.getMonth() + 1}/${d.getDate()}`,
    })
  },

  async loadFeatured() {
    try {
      const list = await recipe.listRecipes('', 1)
      if (list.length) this.setData({ featured: list[0] })
    } catch (e) {
      console.warn('featured load fail', e)
    }
  },

  onFeaturedTap(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` })
  },

  onToolTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'recipe') {
      wx.navigateTo({ url: '/pages/recipe-list/index' })
    } else if (key === 'toolbox') {
      wx.navigateTo({ url: '/pages/toolbox/index' })
    } else if (key === 'sheep') {
      const api = require('../../utils/api')
      api.isSheepAllowed().then((allowed) => {
        if (!allowed) {
          wx.showToast({ title: '私人领地，暂不开门', icon: 'none' })
          return
        }
        wx.navigateTo({ url: '/pages/sheep-circle/index' })
      })
    }
  },
})
