// miniprogram/utils/exam.js
// 题库逻辑模块 — 从云端 API 加载题目数据
const api = require('./api')

const STORAGE_KEY = 'ai_exam_progress'
const CACHE_KEY = 'ai_exam_cache'
const CACHE_TTL = 1000 * 60 * 60 * 24 // 缓存24小时

let _meta = null
let _questions = []
let _loaded = false

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 从云端加载题库，带本地缓存
async function loadQuestions() {
  if (_loaded && _questions.length) return

  // 尝试读取本地缓存
  try {
    const cache = wx.getStorageSync(CACHE_KEY)
    if (cache && cache.questions && cache.ts && Date.now() - cache.ts < CACHE_TTL) {
      _questions = cache.questions
      _meta = cache.meta
      _loaded = true
      return
    }
  } catch (e) {}

  // 从云端拉取
  const metaRes = await api.getExamMeta()
  _meta = metaRes.data || metaRes

  const total = _meta.total || 900
  const allQuestions = []
  const PAGE_SIZE = 100

  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    const res = await api.getExamQuestions({ type: 'all', offset, limit: PAGE_SIZE })
    const qs = (res.data && res.data.questions) || res.questions || []
    allQuestions.push(...qs)
  }

  _questions = allQuestions
  _loaded = true

  // 写入本地缓存
  try {
    wx.setStorageSync(CACHE_KEY, { questions: _questions, meta: _meta, ts: Date.now() })
  } catch (e) {}
}

function getMeta() {
  return _meta || { total: 0, counts: { judgment: 0, single: 0, multiple: 0 } }
}

function getTypeFilters() {
  const m = getMeta()
  return [
    { key: 'all', label: '全部', count: m.total || _questions.length },
    { key: 'judgment', label: '判断题', count: m.counts ? m.counts.judgment : 0 },
    { key: 'single', label: '单选题', count: m.counts ? m.counts.single : 0 },
    { key: 'multiple', label: '多选题', count: m.counts ? m.counts.multiple : 0 },
  ]
}

function filterQuestions(typeKey) {
  if (typeKey === 'all') return _questions.slice()
  return _questions.filter((q) => q.type === typeKey)
}

function buildSession(typeKey, randomMode) {
  const list = filterQuestions(typeKey)
  return randomMode ? shuffle(list) : list
}

function normalizeSelection(selection, type) {
  if (type === 'judgment') return selection
  if (type === 'single') return selection
  return selection.split('').sort().join('')
}

function checkAnswer(question, selection) {
  const user = normalizeSelection(selection, question.type)
  const correct = normalizeSelection(question.answer, question.type)
  return user === correct
}

function getProgress() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || { stats: { total: 0, correct: 0, wrong: 0 }, wrongIds: [] }
  } catch (e) {
    return { stats: { total: 0, correct: 0, wrong: 0 }, wrongIds: [] }
  }
}

function saveProgress(progress) {
  try {
    wx.setStorageSync(STORAGE_KEY, progress)
  } catch (e) {}
}

function updateProgress(questionId, isCorrect) {
  const progress = getProgress()
  const answered = progress.answered || {}
  const wrongIds = new Set(progress.wrongIds || [])

  answered[questionId] = { correct: isCorrect, at: Date.now() }
  if (isCorrect) {
    wrongIds.delete(questionId)
  } else {
    wrongIds.add(questionId)
  }

  const next = {
    answered,
    wrongIds: Array.from(wrongIds),
    stats: {
      total: Object.keys(answered).length,
      correct: Object.values(answered).filter((item) => item.correct).length,
      wrong: wrongIds.size,
    },
  }
  saveProgress(next)
  return next
}

function getTypeLabel(type) {
  const map = { judgment: '判断题', single: '单选题', multiple: '多选题' }
  return map[type] || type
}

function isLoaded() {
  return _loaded
}

function clearCache() {
  try {
    wx.removeStorageSync(CACHE_KEY)
  } catch (e) {}
  _questions = []
  _meta = null
  _loaded = false
}

module.exports = {
  loadQuestions,
  getMeta,
  getTypeFilters,
  buildSession,
  checkAnswer,
  getProgress,
  updateProgress,
  getTypeLabel,
  isLoaded,
  clearCache,
}
