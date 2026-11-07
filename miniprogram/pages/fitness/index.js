// pages/fitness/index.js — 体重管理（4 tab：今日 / 记录 / 趋势 / 目标）
// 视觉参考 weight-app-b 方案 B：青绿主色 + 训练项目分色 + 数字联动
const api = require('../../utils/api')

// 训练类型模板：字段随类型变，消耗按 MET 计算
const TYPES = {
  stairs: {
    key: 'stairs', label: '爬楼梯', color: '#E8863A', soft: '#FDF0E3', met: 8.8,
    fields: [
      { key: 'floors', label: '楼层数', step: 1, min: 0 },
      { key: 'sMin', label: '时长 · 分钟', step: 1, min: 1 },
    ],
  },
  run: {
    key: 'run', label: '跑步', color: '#2F6BFF', soft: '#EAF0FF', met: 9.8,
    fields: [
      { key: 'km', label: '距离 · 公里', step: 0.5, min: 0, digits: 1 },
      { key: 'rMin', label: '时长 · 分钟', step: 1, min: 1 },
    ],
  },
  strength: {
    key: 'strength', label: '力量训练', color: '#7B61FF', soft: '#EFEBFF', met: 5.0,
    fields: [
      { key: 'sets', label: '组数', step: 1, min: 1 },
      { key: 'setMin', label: '时长 · 分钟', step: 5, min: 5 },
    ],
  },
  custom: {
    key: 'custom', label: '自定义', color: '#0B9A7A', soft: '#E0F4EE', met: 0,
    fields: [
      { key: 'name', label: '项目名称', text: true },
      { key: 'val', label: '数值 · 单位', text: true },
    ],
  },
}

const ACCENT = '#0B9A7A'

function pad(n) {
  return String(n).padStart(2, '0')
}

function dateKey(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function todayKey() {
  return dateKey(new Date())
}

function fmtMD(key) {
  if (!key) return ''
  const p = key.split('-')
  return `${Number(p[1])} 月 ${Number(p[2])} 日`
}

function fmtClock(ts) {
  const d = new Date(ts)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function fmtDateCn(key) {
  const d = new Date(key + 'T00:00:00')
  const W = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${W[d.getDay()]}`
}

Page({
  data: {
    tab: 'today',
    loggedIn: false,
    nickname: '',
    loginVisible: false,

    // 今日
    dateCn: '',
    todayWeight: 0,
    prevWeight: 0,
    deltaText: '',
    deltaUp: false,
    ringPct: 0,
    goalWeight: 0,
    leftText: '--',
    delta30Text: '--',
    weight7: [],
    hasWeight: false,
    hasGoal: false,
    hasSpark: false,
    emptyTip: '',
    week: [],
    weekCount: 0,
    weekTarget: 5,
    todayLogs: [],
    etaLine: '',
    etaSub: '',

    // 记录
    recDate: todayKey(),
    recDateCn: '',
    logTime: '',
    recWeight: '',
    types: Object.keys(TYPES).map((k) => ({
      key: k, label: TYPES[k].label, color: TYPES[k].color, soft: TYPES[k].soft,
    })),
    curType: 'stairs',
    fields: [],
    fieldValues: {},
    kcal: 0,
    kcalBasis: '',
    lastLogText: '',

    // 趋势
    range: 30,
    rangeText: '30 天',
    trendWeight: 0,
    trendDelta: '',
    trendSeries: [],
    trendMin: 0,
    trendMax: 0,
    dist: [],
    statCells: [],

    // 目标
    startWeight: 0,
    goalInput: 0,
    rateInput: 0.5,
    weekTargetInput: 5,
    goalPct: 0,
    goalNote: '',
    etaGoal: '--',
    etaSubGoal: '',

    loading: false,
    saving: false,
  },

  onLoad() {
    this.setData({ dateCn: fmtDateCn(todayKey()), recDateCn: fmtDateCn(todayKey()) })
    this.applyType('stairs')
    this.loadAll()
  },

  onShow() {
    this.checkLogin()
    // 首页「记录体重」跳过来时，直接落到「记录」tab
    const want = wx.getStorageSync('alvey_fitness_tab')
    if (want) {
      wx.removeStorageSync('alvey_fitness_tab')
      if (want !== this.data.tab) this.setData({ tab: want })
    }
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  checkLogin() {
    const loggedIn = api.isLoggedIn()
    this.setData({ loggedIn })
    if (!loggedIn) return
    api
      .genPersonalInfo(api.ensureUserId())
      .then((res) => {
        const info = (res && res.data) || {}
        this.setData({ nickname: info.name || '' })
      })
      .catch(() => {})
  },

  async loadAll() {
    this.setData({ loading: true })
    try {
      const [ov, items, logs, goal, trend] = await Promise.all([
        api.fitness('overview'),
        api.fitness('items'),
        api.fitness('logs', { date: todayKey() }),
        api.fitness('goal'),
        api.fitness('trend', { days: this.data.range }),
      ])
      const ovData = ov.data || ov
      const itemList = items.data || []
      const logList = logs.data || []
      const goalData = goal.data || {}
      const trendData = trend.data || {}

      this.setData({
        items: itemList,
        goal: goalData,
        trendRaw: trendData,
        loading: false,
      })

      this.applyOverview(ovData)
      this.applyEmptyState(ovData)
      this.applyItems(itemList)
      this.applyLogs(logList)
      this.applyGoal(goalData, ovData)
      this.applyTrend(trendData)
    } catch (e) {
      console.error('fitness load failed:', e)
      this.setData({ loading: false })
    }
  },

  /* ================= 今日 ================= */

  applyOverview(ov) {
    const goal = ov.goal || {}
    const todayWeight = ov.todayWeight || 0
    const prevWeight = ov.prevWeight || 0
    const delta = todayWeight - prevWeight

    // 迷你走势：只取有记录的日期
    const weight7 = (ov.weight7 || []).map((d) => ({ date: d.date, weight: d.weight }))

    let etaLine = ''
    let etaSub = ''
    if (ov.eta) {
      etaLine = `按每周 −${goal.weeklyRate || 0.5} kg，${ov.eta.date}到 ${(goal.goalWeight || 0).toFixed(1)} kg`
      etaSub = `还需 ${ov.eta.weeks} 周`
    } else {
      etaLine = '去「目标」页设置目标体重，就能算出预计达成日'
      etaSub = ''
    }

    this.setData({
      dateCn: fmtDateCn(ov.today || todayKey()),
      todayWeight: todayWeight ? todayWeight.toFixed(1) : '--',
      prevWeight,
      deltaText: prevWeight && todayWeight ? `${delta <= 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(1)} kg 较昨日` : '还没有对比数据',
      deltaUp: delta > 0,
      ringPct: ov.ringPct || 0,
      goalWeight: goal.goalWeight || 0,
      leftText: ov.left ? `${ov.left.toFixed(1)} kg` : '--',
      delta30Text: ov.delta30 ? `${ov.delta30 > 0 ? '+' : '−'}${Math.abs(ov.delta30).toFixed(1)} kg` : '--',
      weight7,
      week: ov.week || [],
      weekCount: ov.weekCount || 0,
      weekTarget: (goal && goal.weekTarget) || 5,
      todayLogs: this.decorateLogs(ov.todayLogs || []),
      etaLine,
      etaSub,
    })

    // 记录页的体重输入默认带今日体重
    if (!this.data.recWeight && todayWeight) {
      this.setData({ recWeight: todayWeight.toFixed(1) })
    }
    this.updateKcal()
    this.drawRing(ov.ringPct || 0)
  },

  // 首次访问：完全没有数据时，各处显示占位而非 '--'
  applyEmptyState(ov) {
    if (!ov) return
    const hasWeight = !!ov.todayWeight
    const hasGoal = !!((ov.goal && ov.goal.goalWeight) || 0)
    const valid7 = (ov.weight7 || []).filter((d) => d.weight !== null && d.weight !== undefined)
    this.setData({
      hasWeight,
      hasGoal,
      hasSpark: valid7.length >= 2,
      emptyTip: hasWeight ? '' : '还没有记录过体重，去「记录」页称第一次',
    })
  },

  // 目标进度环
  drawRing(pct) {
    wx.createSelectorQuery()
      .in(this)
      .select('#goalRing')
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

        const cx = w / 2
        const cy = h / 2
        const r = Math.min(w, h) / 2 - 8
        ctx.clearRect(0, 0, w, h)

        // 底环
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = '#ECF1F6'
        ctx.lineWidth = 8
        ctx.stroke()

        // 进度环
        if (pct > 0) {
          ctx.beginPath()
          ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * Math.PI * 2)
          ctx.strokeStyle = '#0B9A7A'
          ctx.lineWidth = 8
          ctx.lineCap = 'round'
          ctx.stroke()
        }
      })
  },

  /* ================= 记录 ================= */

  applyItems(items) {
    // 预设四种类型；用户自定义项目排在后面
    const preset = this.data.types.map((t) => ({ ...t }))
    const custom = (items || [])
      .filter((it) => it.type === 'custom')
      .map((it) => ({
        key: 'custom', label: it.name, color: it.color, soft: it.soft, itemId: it._id,
      }))
    this.setData({ items, typeList: preset.concat(custom) })
  },

  applyLogs(logs) {
    const list = this.decorateLogs(logs || [])
    this.setData({ todayLogs: list })
    const last = list[0]
    this.setData({
      lastLogText: last
        ? `${last.dateShort} ${last.name} ${last.summary}`
        : '',
    })
  },

  // 训练记录装饰：算副标题与消耗
  decorateLogs(logs) {
    return (logs || []).map((l) => {
      const tpl = TYPES[l.type] || TYPES.custom
      let sub = ''
      let summary = ''
      if (l.type === 'stairs') {
        const f = l.fields || {}
        sub = `${f.floors || 0} 层 · ${f.sMin || 0} 分钟 · ${Math.round((f.floors || 0) * 3)} 米`
        summary = `${f.floors || 0} 层 · ${f.sMin || 0} 分钟`
      } else if (l.type === 'run') {
        const f = l.fields || {}
        const pace = f.km ? Math.round((f.rMin * 60) / f.km) : 0
        const paceText = pace ? `${Math.floor(pace / 60)}'${pad(pace % 60)}"` : "--'--'"
        sub = `${(f.km || 0).toFixed(1)} 公里 · ${f.rMin || 0} 分钟 · ${paceText}`
        summary = `${(f.km || 0).toFixed(1)} 公里 · ${f.rMin || 0} 分钟`
      } else if (l.type === 'strength') {
        const f = l.fields || {}
        sub = `${f.sets || 0} 组 · ${f.setMin || 0} 分钟`
        summary = `${f.sets || 0} 组 · ${f.setMin || 0} 分钟`
      } else {
        const f = l.fields || {}
        sub = f.val || ''
        summary = f.val || ''
      }
      const d = new Date(l.createdAt)
      return {
        ...l,
        dateShort: `${d.getMonth() + 1}/${d.getDate()}`,
        time: fmtClock(l.createdAt),
        sub,
        summary,
        kcalText: l.kcal ? `${l.kcal}` : '--',
        color: l.color || tpl.color,
        soft: tpl.soft,
      }
    })
  },

  applyType(typeKey) {
    const tpl = TYPES[typeKey] || TYPES.custom
    const values = {}
    tpl.fields.forEach((f) => {
      values[f.key] = f.text ? '' : f.key === 'km' ? 0 : f.min
    })
    this.setData({
      curType: typeKey,
      fields: tpl.fields.map((f) => ({ ...f, color: tpl.color })),
      fieldValues: values,
    })
    this.updateKcal()
  },

  onTypeTap(e) {
    const key = e.currentTarget.dataset.type
    this.applyType(key)
  },

  onFieldStep(e) {
    const { field, dir } = e.currentTarget.dataset
    const def = (this.data.fields || []).find((f) => f.key === field)
    if (!def || def.text) return
    const cur = Number(this.data.fieldValues[field] || 0)
    let next = cur + def.step * (Number(dir) || 0)
    if (def.min !== undefined) next = Math.max(def.min, next)
    next = Math.round(next * 100) / 100
    const values = { ...this.data.fieldValues, [field]: next }
    this.setData({ fieldValues: values })
    this.updateKcal()
  },

  onFieldInput(e) {
    const { field } = e.currentTarget.dataset
    const values = { ...this.data.fieldValues, [field]: e.detail.value }
    this.setData({ fieldValues: values })
  },

  onWeightInput(e) {
    this.setData({ recWeight: e.detail.value })
    this.updateKcal()
  },

  // 消耗 = MET × 体重 × 时长（改体重时同步变）
  updateKcal() {
    const tpl = TYPES[this.data.curType] || TYPES.custom
    const w = Number(this.data.recWeight || this.data.todayWeight || 0)
    const v = this.data.fieldValues || {}
    let kcal = 0
    let basis = ''
    if (tpl.met > 0 && w > 0) {
      let minutes = 0
      if (this.data.curType === 'stairs') minutes = Number(v.sMin || 0)
      else if (this.data.curType === 'run') minutes = Number(v.rMin || 0)
      else if (this.data.curType === 'strength') minutes = Number(v.setMin || 0)
      kcal = Math.round(tpl.met * w * minutes / 60)
      basis = `体重 ${w.toFixed(1)}kg\nMET ${tpl.met} · ${tpl.label}`
    } else {
      basis = '自定义项目\n手动填写'
    }
    this.setData({ kcal, kcalBasis: basis })
  },

  async onSaveWeight() {
    const w = Number(this.data.recWeight)
    if (!w || w <= 0) {
      wx.showToast({ title: '先填个体重', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await api.fitness('saveWeight', { date: this.data.recDate, weight: w })
      wx.showToast({ title: '体重已保存', icon: 'success' })
      await this.loadAll()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  async onSaveLog() {
    if (this.data.saving) return
    const tpl = TYPES[this.data.curType] || TYPES.custom
    const v = this.data.fieldValues || {}
    const name = tpl.key === 'custom' ? (v.name || '自定义') : tpl.label
    if (tpl.key === 'custom' && !v.name) {
      wx.showToast({ title: '给项目起个名字', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await api.fitness('addLog', {
        date: this.data.recDate,
        name,
        type: tpl.key,
        color: tpl.color,
        fields: v,
        kcal: this.data.kcal,
      })
      wx.showToast({ title: '已保存 · ' + name, icon: 'success' })
      await this.loadAll()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  /* ================= 趋势 ================= */

  onRangeTap(e) {
    const days = Number(e.currentTarget.dataset.days)
    this.setData({ range: days, rangeText: days + ' 天' })
    api
      .fitness('trend', { days })
      .then((res) => {
        const t = res.data || {}
        this.setData({ trendRaw: t })
        this.applyTrend(t)
      })
      .catch(() => {})
  },

  applyTrend(t) {
    const series = t.series || []
    const last = [...series].reverse().find((s) => s.weight !== null)
    const delta = t.delta || 0
    const goal = this.data.goalWeight || 0

    const dist = (t.dist || []).map((d) => ({
      ...d,
      pct: t.totalCount ? Math.round((d.count / t.totalCount) * 100) : 0,
    }))
    const totalCount = (t.dist || []).reduce((a, d) => a + d.count, 0)

    const stats = t.stats || {}
    const validCount = series.filter((s) => s.weight !== null).length
    this.setData({
      trendWeight: last ? last.weight.toFixed(1) : '--',
      trendDelta: validCount >= 2 ? `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)} kg / ${this.data.range} 天` : '数据不足',
      trendSeries: series,
      hasSpark: validCount >= 2,
      trendMin: t.min || 0,
      trendMax: t.max || 0,
      dist,
      statCells: [
        { k: '累计训练', v: stats.totalTrain || 0, u: '次' },
        { k: '坚持天数', v: stats.streak || 0, u: '天' },
        { k: '训练项目', v: (t.dist || []).length, u: '种' },
        { k: '记录天数', v: series.filter((s) => s.weight !== null).length, u: '天' },
      ],
    })
    // 目标线需要传给图表
    this.setData({ trendGoal: goal })
  },

  /* ================= 目标 ================= */

  applyGoal(goal, ov) {
    const start = goal.startWeight || 0
    const goalW = goal.goalWeight || 0
    const now = (ov && ov.todayWeight) || 0
    let pct = 0
    if (start > 0 && goalW > 0 && start > goalW) {
      pct = Math.max(0, Math.min(100, ((start - now) / (start - goalW)) * 100))
    }
    const done = start > 0 && now > 0 ? Math.max(0, start - now) : 0
    const left = goalW > 0 && now > 0 ? Math.max(0, now - goalW) : 0

    let etaGoal = '--'
    let etaSubGoal = ''
    if (goalW > 0 && now > 0 && goal.weeklyRate > 0) {
      const weeks = Math.max(0, (now - goalW) / goal.weeklyRate)
      const d = new Date()
      d.setDate(d.getDate() + Math.round(weeks * 7))
      etaGoal = `${d.getMonth() + 1} 月 ${d.getDate()} 日`
      etaSubGoal = `按每周 ${goal.weeklyRate} kg 估算 · 还需 ${weeks.toFixed(1)} 周`
    }

    this.setData({
      startWeight: start ? start.toFixed(1) : '--',
      startInput: start || 0,
      goalInput: goalW || 0,
      rateInput: goal.weeklyRate || 0.5,
      weekTargetInput: goal.weekTarget || 5,
      goalPct: Math.round(pct),
      goalNote: start > 0 && now > 0 ? `已完成 ${done.toFixed(1)} kg，还差 ${left.toFixed(1)} kg` : '先记录体重，再设目标',
      etaGoal,
      etaSubGoal,
    })
  },

  onGoalStep(e) {
    const { field, dir } = e.currentTarget.dataset
    const step = field === 'rate' ? 0.25 : 0.5
    const d = Number(dir) || 0
    if (field === 'goal') {
      const next = Math.max(0, Math.round((Number(this.data.goalInput || 0) + step * d) * 10) / 10)
      this.setData({ goalInput: next })
    } else if (field === 'start') {
      const next = Math.max(0, Math.round((Number(this.data.startInput || 0) + step * d) * 10) / 10)
      this.setData({ startInput: next })
    } else if (field === 'rate') {
      const next = Math.min(2, Math.max(0.1, Math.round((Number(this.data.rateInput || 0.5) + step * d) * 100) / 100))
      this.setData({ rateInput: next })
    } else if (field === 'weekTarget') {
      const next = Math.min(14, Math.max(1, Math.round(Number(this.data.weekTargetInput || 5) + d)))
      this.setData({ weekTargetInput: next })
    }
  },

  async onSaveGoal() {
    try {
      await api.fitness('saveGoal', {
        startWeight: this.data.startInput,
        goalWeight: this.data.goalInput,
        weeklyRate: this.data.rateInput,
        weekTarget: this.data.weekTargetInput,
      })
      wx.showToast({ title: '目标已保存', icon: 'success' })
      await this.loadAll()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  /* ================= Tab ================= */

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab })
  },

  /* ================= 登录 ================= */

  onGoLogin() {
    this.setData({ loginVisible: true })
  },

  onLoginClose() {
    this.setData({ loginVisible: false })
  },

  onLoginSuccess(e) {
    const detail = (e && e.detail) || {}
    this.setData({ loginVisible: false, nickname: detail.name || '' })
    this.loadAll()
  },
})
