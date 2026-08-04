// miniprogram/utils/exam.js
// 题库逻辑模块 — 按 bankId 从云端加载
const api = require('./api')

const CACHE_TTL = 1000 * 60 * 60 * 24 // 缓存24小时

let _bankId = ''
let _meta = null
let _questions = []
let _loaded = false

function cacheKey(bankId) {
  return bankId ? `ai_exam_cache_${bankId}` : 'ai_exam_cache'
}

function progressKey(bankId) {
  return bankId ? `ai_exam_progress_${bankId}` : 'ai_exam_progress'
}

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function loadQuestions(bankId) {
  const id = bankId || ''
  if (_loaded && _questions.length && _bankId === id) return

  if (_bankId !== id) {
    _questions = []
    _meta = null
    _loaded = false
    _bankId = id
  }

  if (!id) {
    throw new Error('缺少题库 bankId')
  }

  try {
    const cache = wx.getStorageSync(cacheKey(id))
    if (cache && cache.questions && cache.ts && Date.now() - cache.ts < CACHE_TTL) {
      _questions = cache.questions
      _meta = cache.meta
      _loaded = true
      _bankId = id
      return
    }
  } catch (e) {}

  const metaRes = await api.getExamMeta({ bankId: id })
  _meta = metaRes.data || metaRes

  const total = _meta.total || 0
  const allQuestions = []
  const PAGE_SIZE = 100

  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    const res = await api.getExamQuestions({ bankId: id, type: 'all', offset, limit: PAGE_SIZE })
    const qs = (res.data && res.data.questions) || res.questions || []
    allQuestions.push(...qs)
  }

  allQuestions.sort((a, b) => (a.num || 0) - (b.num || 0))
  _questions = allQuestions
  _loaded = true
  _bankId = id

  try {
    wx.setStorageSync(cacheKey(id), { questions: _questions, meta: _meta, ts: Date.now() })
  } catch (e) {}
}

function getBankId() {
  return _bankId
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

function getProgress(bankId) {
  const id = bankId !== undefined ? bankId : _bankId
  try {
    return wx.getStorageSync(progressKey(id)) || { stats: { total: 0, correct: 0, wrong: 0 }, wrongIds: [] }
  } catch (e) {
    return { stats: { total: 0, correct: 0, wrong: 0 }, wrongIds: [] }
  }
}

function saveProgress(progress, bankId) {
  const id = bankId !== undefined ? bankId : _bankId
  try {
    wx.setStorageSync(progressKey(id), progress)
  } catch (e) {}
}

function updateProgress(questionId, isCorrect, bankId) {
  const progress = getProgress(bankId)
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
  saveProgress(next, bankId)
  return next
}

function getTypeLabel(type) {
  const map = { judgment: '判断题', single: '单选题', multiple: '多选题' }
  return map[type] || type
}

function isLoaded() {
  return _loaded
}

function clearCache(bankId) {
  const id = bankId !== undefined ? bankId : _bankId
  try {
    wx.removeStorageSync(cacheKey(id))
  } catch (e) {}
  if (!bankId || bankId === _bankId) {
    _questions = []
    _meta = null
    _loaded = false
  }
}

module.exports = {
  loadQuestions,
  getBankId,
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
