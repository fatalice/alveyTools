// pages/index/index.js — 首页（布局 1：体重管理整卡打头 + 三宫格入口 + 今日动态）
const api = require('../../utils/api')

const C = {
  weight: '#0B9A7A',
  smoke: '#DE8A2B',
  tool: '#2F6BFF',
  food: '#DE5779',
  sheep: '#7B61FF',
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmtClock(ts) {
  const d = new Date(ts)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 64,
    menuRight: 110,
    greeting: '下午好',
    dateStr: '',
    initial: 'A',

    // Hero
    weightText: '--',
    deltaText: '',
    goalText: '未设置',
    leftText: '--',
    ringPct: 0,
    weight7: [],
    hasWeight: false,

    // 宫格
    smokeCount: 0,
    toolCount: 4,
    recipeCount: 0,
    showSheep: false,

    // 动态
    feed: [],
  },

  onLoad() {
    this.computeNav()
    this.setGreeting()
    this.loadAll()
  },

  onShow() {
    this.checkSheepAccess()
    this.checkLogin()
    this.loadAll()
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh())
  },

  computeNav() {
    const win = wx.getWindowInfo()
    const menu = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = win.statusBarHeight
    const navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height + statusBarHeight
    const menuRight = win.windowWidth - menu.left + 8
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
      dateStr: `${d.getMonth() + 1}月${d.getDate()}日 · 周${week}`,
    })
  },

  async loadAll() {
    // 三路数据并发，任一失败不影响其他渲染
    const [ov, smoke, logs] = await Promise.all([
      this.safe(() => api.fitness('overview'), null),
      this.safe(() => api.smokeState(), null),
      this.safe(() => api.fitness('logs', { date: todayKey() }), null),
    ])

    const ovData = (ov && ov.data) || ov
    const smokeData = (smoke && smoke.data) || smoke
    const logData = (logs && logs.data) || logs

    this.applyOverview(ovData)
    this.applySmoke(smokeData)
    this.buildFeed(ovData, smokeData, logData)
    this.loadRecipeCount()
  },

  safe(fn, fallback) {
    return fn().catch((e) => {
      console.warn('home load failed:', e)
      return fallback
    })
  },

  applyOverview(ov) {
    if (!ov) return
    const goal = ov.goal || {}
    const todayWeight = ov.todayWeight || 0
    const prevWeight = ov.prevWeight || 0
    const delta = todayWeight - prevWeight

    const weight7 = (ov.weight7 || []).map((d) => ({ date: d.date, weight: d.weight }))
    // 只有一条有效记录时趋势图没有意义，至少两条才画
    const validCount = weight7.filter((d) => d.weight !== null && d.weight !== undefined).length

    this.setData({
      weightText: todayWeight ? todayWeight.toFixed(1) : '--',
      deltaText:
        todayWeight && prevWeight
          ? `${delta <= 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(1)} kg 较昨日`
          : '',
      goalText: goal.goalWeight ? `${goal.goalWeight.toFixed(1)} kg` : '未设置',
      leftText: ov.left ? `${ov.left.toFixed(1)} kg` : '--',
      ringPct: ov.ringPct || 0,
      weight7,
      hasWeight: validCount >= 2,
    })
  },

  applySmoke(smoke) {
    if (!smoke) return
    const count = (smoke.today && smoke.today.count) || 0
    this.setData({ smokeCount: count })
  },

  // 今日动态：体重 / 抽烟 / 训练 三路合并，按时间倒序
  buildFeed(ov, smoke, logs) {
    const list = []

    // 体重
    if (ov && ov.todayWeight) {
      const prev = ov.prevWeight || 0
      const delta = ov.todayWeight - prev
      list.push({
        key: 'weight',
        color: C.weight,
        title: '体重',
        text: prev
          ? ` ${ov.todayWeight.toFixed(1)} kg · 较昨日 ${delta <= 0 ? '−' : '+'}${Math.abs(delta).toFixed(1)}`
          : ` ${ov.todayWeight.toFixed(1)} kg`,
        time: '',
        sort: 0,
      })
    }

    // 抽烟记录
    const recs = (smoke && smoke.today && smoke.today.records) || []
    recs.forEach((r, i) => {
      list.push({
        key: `smoke-${r.t}`,
        color: C.smoke,
        title: '记一支',
        text: ` 今日第 ${recs.length - i} 支`,
        time: fmtClock(r.t),
        sort: r.t,
      })
    })

    // 训练记录
    const tl = (logs && logs.length) || 0
    ;(logs || []).forEach((l) => {
      const f = l.fields || {}
      let sub = ''
      if (l.type === 'stairs') sub = ` ${f.floors || 0} 层 · ${f.sMin || 0} 分钟`
      else if (l.type === 'run') sub = ` ${(f.km || 0).toFixed(1)} 公里 · ${f.rMin || 0} 分钟`
      else if (l.type === 'strength') sub = ` ${f.sets || 0} 组 · ${f.setMin || 0} 分钟`
      else sub = ` ${f.val || ''}`
      list.push({
        key: `log-${l._id}`,
        color: C.weight,
        title: l.name || '训练',
        text: sub,
        time: fmtClock(l.createdAt),
        sort: l.createdAt,
      })
    })

    // 体重没有精确时间，排最前；其余按时间倒序
    list.sort((a, b) => {
      if (a.sort === 0 && b.sort === 0) return 0
      if (a.sort === 0) return -1
      if (b.sort === 0) return 1
      return b.sort - a.sort
    })

    this.setData({ feed: list.slice(0, 8) })
  },

  // 菜谱总数（列表接口拉一次后缓存）
  loadRecipeCount() {
    const cached = wx.getStorageSync('alvey_recipe_count')
    if (cached) {
      this.setData({ recipeCount: cached })
      return
    }
    api
      .request({ path: '/api/recipes', method: 'POST', data: { action: 'list', limit: 200 } })
      .then((res) => {
        const list = (res && res.data) || []
        if (list.length) {
          wx.setStorageSync('alvey_recipe_count', list.length)
          this.setData({ recipeCount: list.length })
        }
      })
      .catch(() => {})
  },

  async checkSheepAccess() {
    const allowed = await api.isSheepAllowed()
    this.setData({ showSheep: allowed })
  },

  // 头像首字：登录后取昵称首字，未登录用 A
  checkLogin() {
    if (!api.isLoggedIn()) return
    api
      .genPersonalInfo(api.ensureUserId())
      .then((res) => {
        const info = (res && res.data) || {}
        const name = (info.name || '').trim()
        if (name) this.setData({ initial: name[0].toUpperCase() })
      })
      .catch(() => {})
  },

  // ===== 交互 =====

  onAvatarTap() {
    wx.switchTab({ url: '/pages/my/index' })
  },

  onHeroTap() {
    wx.navigateTo({ url: '/pages/fitness/index' })
  },

  onWeighTap() {
    // 记录体重 → 跳体重管理并直接落到「记录」tab
    wx.setStorageSync('alvey_fitness_tab', 'log')
    wx.navigateTo({ url: '/pages/fitness/index' })
  },

  onFeedAll() {
    wx.navigateTo({ url: '/pages/fitness/index' })
  },

  onToolTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'smoke') {
      wx.navigateTo({ url: '/pages/smoke/index' })
    } else if (key === 'toolbox') {
      wx.navigateTo({ url: '/pages/toolbox/index' })
    } else if (key === 'recipe') {
      wx.navigateTo({ url: '/pages/recipe-list/index' })
    } else if (key === 'fitness') {
      wx.navigateTo({ url: '/pages/fitness/index' })
    } else if (key === 'sheep') {
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
