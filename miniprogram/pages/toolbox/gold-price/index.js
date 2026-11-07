// pages/toolbox/gold-price/index.js
// 金价查询：实时价格 + 近 30 日走势图（canvas 手绘），点击「更新」刷新
const api = require('../../../utils/api')

// 走势图只有一条序列，涨跌方向由折线几何表达；颜色不重复编码方向，
// 红绿仅保留在带 +/- 符号的报价数字上（红绿色盲下仍可读）。
const LINE_COLOR = '#b85a22'
const LINE_FILL = 'rgba(184, 90, 34, 0.16)'

Page({
  data: {
    loading: false,
    quote: null,
    history: [],
    up: true,
    changeStr: '',
    changePctStr: '',
    updateTime: '',
  },

  onLoad() {
    this.load()
  },

  onReady() {
    this.draw()
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh())
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  async load() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await api.getGoldPrice()
      const d = (res && res.data) || res
      const change = Number(d.change || 0)
      const changePct = Number(d.changePct || 0)
      this.setData({
        quote: d,
        history: d.history || [],
        up: change >= 0,
        changeStr: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
        changePctStr: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
        updateTime: this.formatTime(d.time),
        loading: false,
      })
      this.draw()
    } catch (e) {
      console.error('load gold price failed:', e)
      this.setData({ loading: false })
      wx.showToast({ title: '获取金价失败', icon: 'none' })
    }
  },

  onRefreshTap() {
    if (this.data.loading) {
      wx.showToast({ title: '正在更新', icon: 'none' })
      return
    }
    this.load().then(() => {
      if (!this.data.loading) wx.showToast({ title: '已更新', icon: 'none' })
    })
  },

  formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
  },

  // ---- 走势图 ----

  draw() {
    const history = this.data.history
    if (!history.length) return
    wx.createSelectorQuery()
      .in(this)
      .select('#goldChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        const item = res && res[0]
        if (!item || !item.node) return
        const canvas = item.node
        const ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2
        const w = item.width
        const h = item.height
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)
        this.renderChart(ctx, w, h, history)
      })
  },

  renderChart(ctx, w, h, history) {
    const padL = 46
    const padR = 46
    const padT = 16
    const padB = 26
    const cw = w - padL - padR
    const ch = h - padT - padB

    const prices = history.map((d) => d.close)
    let min = Math.min.apply(null, prices)
    let max = Math.max.apply(null, prices)
    const range = max - min || 1
    min -= range * 0.1
    max += range * 0.1

    const x = (i) => padL + (i * cw) / (history.length - 1)
    const y = (p) => padT + ch - ((p - min) / (max - min)) * ch

    // 横向网格 + 左侧价格刻度
    ctx.strokeStyle = '#f2f2f2'
    ctx.lineWidth = 1
    ctx.fillStyle = '#868a86'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 3; i += 1) {
      const gy = padT + (ch * i) / 3
      ctx.beginPath()
      ctx.moveTo(padL, gy)
      ctx.lineTo(w - padR, gy)
      ctx.stroke()
      ctx.fillText((max - ((max - min) * i) / 3).toFixed(1), padL - 6, gy)
    }

    // 折线下方渐变填充
    const grad = ctx.createLinearGradient(0, padT, 0, padT + ch)
    grad.addColorStop(0, LINE_FILL)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.beginPath()
    ctx.moveTo(x(0), y(history[0].close))
    for (let i = 1; i < history.length; i += 1) ctx.lineTo(x(i), y(history[i].close))
    ctx.lineTo(x(history.length - 1), padT + ch)
    ctx.lineTo(x(0), padT + ch)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // 折线
    ctx.beginPath()
    ctx.moveTo(x(0), y(history[0].close))
    for (let i = 1; i < history.length; i += 1) ctx.lineTo(x(i), y(history[i].close))
    ctx.strokeStyle = LINE_COLOR
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 最新点 + 直接标值（不依赖颜色读数）
    const last = history[history.length - 1]
    const lx = x(history.length - 1)
    const ly = y(last.close)
    ctx.beginPath()
    ctx.arc(lx, ly, 7, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(184, 90, 34, 0.16)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = LINE_COLOR
    ctx.fill()

    const label = last.close.toFixed(2)
    ctx.font = '600 11px sans-serif'
    const tw = ctx.measureText(label).width
    const bx = Math.min(lx + 8, w - tw - 12)
    const by = Math.max(ly - 10, 2)
    ctx.beginPath()
    ctx.moveTo(bx + 8, by)
    ctx.arcTo(bx + tw + 8, by, bx + tw + 8, by + 18, 8)
    ctx.arcTo(bx + tw + 8, by + 18, bx, by + 18, 8)
    ctx.arcTo(bx, by + 18, bx, by, 8)
    ctx.arcTo(bx, by, bx + tw + 8, by, 8)
    ctx.closePath()
    ctx.fillStyle = LINE_COLOR
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, bx + 4, by + 9)

    // X 轴日期（跨度一年，用 年-月）
    ctx.fillStyle = '#868a86'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const picks = [0, Math.floor((history.length - 1) / 2), history.length - 1]
    picks.forEach((i) => {
      const label2 = String(history[i].date).slice(0, 7)
      const tx = i === 0 ? padL + 14 : i === history.length - 1 ? w - padR - 14 : x(i)
      ctx.fillText(label2, tx, h - 8)
    })
  },
})
