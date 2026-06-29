const CACHE_KEY = 'exchange_rate_cache'

const CURRENCIES = [
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'KRW', name: '韩元', flag: '🇰🇷' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' },
  { code: 'VND', name: '越南盾', flag: '🇻🇳' },
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

Page({
  data: {
    currencies: CURRENCIES,
    baseCurrency: 'CNY',
    baseAmount: '100',
    rates: {},
    results: [],
    updateTime: '',
    loading: false,
    canRefresh: true,
  },

  onLoad() {
    this.loadCache()
    this.calcResults()
  },

  loadCache() {
    const cache = wx.getStorageSync(CACHE_KEY)
    if (cache && cache.date === todayStr()) {
      this.setData({
        rates: cache.rates,
        updateTime: cache.updateTime,
        canRefresh: false,
      })
    }
  },

  async onRefresh() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://open.er-api.com/v6/latest/USD',
          success: (r) => r.statusCode === 200 ? resolve(r.data) : reject(r),
          fail: reject,
        })
      })

      if (res.result !== 'success') throw new Error('API error')

      const usdRates = res.rates
      const rates = {}
      CURRENCIES.forEach(from => {
        rates[from.code] = {}
        CURRENCIES.forEach(to => {
          if (from.code === to.code) {
            rates[from.code][to.code] = 1
          } else {
            rates[from.code][to.code] = usdRates[to.code] / usdRates[from.code]
          }
        })
      })

      const now = new Date()
      const updateTime = `${todayStr()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      wx.setStorageSync(CACHE_KEY, { date: todayStr(), rates, updateTime })
      this.setData({ rates, updateTime, canRefresh: false, loading: false })
      this.calcResults()
      wx.showToast({ title: '汇率已更新', icon: 'success' })
    } catch (err) {
      console.error('fetch rate failed:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '获取汇率失败', icon: 'none' })
    }
  },

  onBaseTap(e) {
    this.setData({ baseCurrency: e.currentTarget.dataset.code })
    this.calcResults()
  },

  onAmountInput(e) {
    this.setData({ baseAmount: e.detail.value })
    this.calcResults()
  },

  calcResults() {
    const { rates, baseCurrency, baseAmount } = this.data
    const amount = parseFloat(baseAmount) || 0
    if (!rates[baseCurrency]) {
      this.setData({ results: [] })
      return
    }
    const results = CURRENCIES
      .filter(c => c.code !== baseCurrency)
      .map(c => ({
        ...c,
        rate: rates[baseCurrency][c.code],
        converted: (amount * rates[baseCurrency][c.code]).toFixed(2),
      }))
    this.setData({ results })
  },
})
