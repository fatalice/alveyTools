// pages/ai-exam/index.js
const exam = require('../../utils/exam')

Page({
  data: {
    view: 'home',
    loading: true,
    typeFilters: [],
    selectedType: 'all',
    randomMode: false,
    onlyWrong: false,
    progress: { stats: { total: 0, correct: 0, wrong: 0 }, wrongIds: [] },

    session: [],
    index: 0,
    current: null,
    selection: '',
    selectedKeys: [],
    submitted: false,
    isCorrect: false,
    finished: false,
    sessionStats: { total: 0, correct: 0 },
    finishRate: 0,
  },

  async onLoad() {
    this.refreshProgress()
    await this.loadData()
  },

  onShow() {
    this.refreshProgress()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      await exam.loadQuestions()
      this.setData({
        loading: false,
        typeFilters: exam.getTypeFilters(),
      })
    } catch (err) {
      console.error('加载题库失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '题库加载失败，请检查网络', icon: 'none', duration: 3000 })
    }
  },

  refreshProgress() {
    this.setData({ progress: exam.getProgress() })
  },

  onTypeTap(e) {
    this.setData({ selectedType: e.currentTarget.dataset.key })
  },

  onRandomChange(e) {
    this.setData({ randomMode: e.detail.value })
  },

  onWrongOnlyChange(e) {
    this.setData({ onlyWrong: e.detail.value })
  },

  startPractice() {
    if (!exam.isLoaded()) {
      wx.showToast({ title: '题库加载中，请稍候', icon: 'none' })
      return
    }

    const { selectedType, randomMode, onlyWrong, progress } = this.data
    let session = exam.buildSession(selectedType, randomMode)

    if (onlyWrong) {
      const wrongSet = new Set(progress.wrongIds || [])
      session = session.filter((q) => wrongSet.has(q.id || q._id))
      if (!session.length) {
        wx.showToast({ title: '暂无错题，先做几题吧', icon: 'none' })
        return
      }
    }

    this.setData({
      view: 'practice',
      session,
      index: 0,
      finished: false,
      sessionStats: { total: session.length, correct: 0 },
      ...this.buildQuestionState(session[0]),
    })
  },

  buildQuestionState(question) {
    if (!question) {
      return { current: null, selection: '', selectedKeys: [], submitted: false, isCorrect: false }
    }
    return {
      current: {
        ...question,
        typeLabel: exam.getTypeLabel(question.type),
      },
      selection: '',
      selectedKeys: [],
      submitted: false,
      isCorrect: false,
    }
  },

  onOptionTap(e) {
    if (this.data.submitted) return
    const key = String(e.currentTarget.dataset.key)
    const { current } = this.data
    if (!current) return

    if (current.type === 'multiple') {
      const set = new Set(this.data.selectedKeys)
      if (set.has(key)) set.delete(key)
      else set.add(key)
      const selectedKeys = Array.from(set).sort()
      this.setData({ selectedKeys, selection: selectedKeys.join('') })
      return
    }

    this.setData({ selection: key, selectedKeys: [key] })
  },

  submitAnswer() {
    const { current, selection, submitted, sessionStats } = this.data
    if (!current || submitted) return
    if (!selection) {
      wx.showToast({ title: '请先选择答案', icon: 'none' })
      return
    }

    const isCorrect = exam.checkAnswer(current, selection)
    const questionId = current.id || current._id
    exam.updateProgress(questionId, isCorrect)
    this.refreshProgress()

    this.setData({
      submitted: true,
      isCorrect,
      sessionStats: {
        ...sessionStats,
        correct: sessionStats.correct + (isCorrect ? 1 : 0),
      },
    })
  },

  nextQuestion() {
    const { session, index } = this.data
    const nextIndex = index + 1
    if (nextIndex >= session.length) {
      const { sessionStats } = this.data
      const finishRate = sessionStats.total
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0
      this.setData({ finished: true, finishRate })
      return
    }
    this.setData({
      index: nextIndex,
      finished: false,
      ...this.buildQuestionState(session[nextIndex]),
    })
  },

  prevQuestion() {
    const { session, index } = this.data
    if (index <= 0) return
    const prevIndex = index - 1
    this.setData({
      index: prevIndex,
      finished: false,
      ...this.buildQuestionState(session[prevIndex]),
    })
  },

  backHome() {
    this.setData({ view: 'home', finished: false })
    this.refreshProgress()
  },

  restartSession() {
    this.startPractice()
  },

  async reloadData() {
    exam.clearCache()
    await this.loadData()
  },
})
