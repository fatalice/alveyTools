<template>
  <div class="mock">
    <!-- 组卷设置 -->
    <div v-if="phase === 'setup'" class="panel setup">
      <div class="setup-grid">
        <div class="field">
          <label>分类</label>
          <t-select v-model="categoryId" placeholder="选择分类" clearable filterable @change="onCategoryChange">
            <t-option v-for="c in categories" :key="c._id" :value="c._id" :label="c.name" />
          </t-select>
        </div>
        <div class="field">
          <label>科目</label>
          <t-select v-model="courseId" placeholder="选择科目" clearable filterable :disabled="!categoryId" @change="onCourseChange">
            <t-option v-for="c in courses" :key="c._id" :value="c._id" :label="c.name" />
          </t-select>
        </div>
        <div class="field">
          <label>题库</label>
          <t-select v-model="bankId" placeholder="选择题库" clearable filterable :disabled="!courseId">
            <t-option v-for="b in banks" :key="b._id" :value="b._id" :label="b.name" />
          </t-select>
        </div>
        <div class="field">
          <label>题型</label>
          <t-select v-model="typeFilter" placeholder="题型">
            <t-option value="all" label="全部题型" />
            <t-option value="judgment" label="判断题" />
            <t-option value="single" label="单选题" />
            <t-option value="multiple" label="多选题" />
          </t-select>
        </div>
        <div class="field">
          <label>抽题数量</label>
          <t-input-number v-model="questionCount" :min="1" :max="500" />
        </div>
        <div class="field">
          <label>限时（分钟，0=不限）</label>
          <t-input-number v-model="timeLimitMin" :min="0" :max="300" />
        </div>
      </div>

      <div class="setup-row">
        <t-checkbox v-model="randomMode">随机抽题</t-checkbox>
        <t-tag v-if="bankMeta.total != null" theme="primary" variant="light">
          当前题库共 {{ bankMeta.total }} 题
          <template v-if="bankMeta.counts">
            （判 {{ bankMeta.counts.judgment || 0 }} / 单 {{ bankMeta.counts.single || 0 }} / 多 {{ bankMeta.counts.multiple || 0 }}）
          </template>
        </t-tag>
      </div>

      <div class="setup-actions">
        <t-button theme="default" variant="outline" :loading="metaLoading" :disabled="!bankId" @click="refreshMeta">刷新题量</t-button>
        <t-button theme="primary" size="large" :loading="starting" :disabled="!bankId" @click="startExam">开始模拟考试</t-button>
      </div>
    </div>

    <!-- 答题中 -->
    <div v-else-if="phase === 'exam'" class="exam">
      <div class="exam-top panel">
        <div class="exam-top-left">
          <t-button variant="text" @click="confirmQuit">退出</t-button>
          <span class="exam-title">{{ bankName }}</span>
          <t-tag variant="light">{{ index + 1 }} / {{ paper.length }}</t-tag>
        </div>
        <div class="exam-top-right">
          <span class="timer" :class="{ warn: remainingSec != null && remainingSec <= 60 }">
            {{ timerText }}
          </span>
          <t-button theme="primary" variant="outline" @click="confirmSubmit">交卷</t-button>
        </div>
      </div>

      <div class="exam-body">
        <div class="panel question-panel" v-if="current">
          <div class="q-meta">
            <t-tag theme="primary" variant="light">{{ typeLabel(current.type) }}</t-tag>
            <span class="q-num">#{{ current.num || index + 1 }}</span>
          </div>
          <div class="q-stem">{{ current.question }}</div>

          <div class="options">
            <div
              v-for="opt in current.options || []"
              :key="opt.key"
              class="option"
              :class="{ active: isSelected(opt.key) }"
              @click="toggleOption(opt.key)"
            >
              <span class="opt-key">{{ opt.key }}</span>
              <span class="opt-label">{{ opt.label }}</span>
            </div>
            <div v-if="current.type === 'judgment' && !(current.options || []).length" class="judgment-row">
              <t-button
                :theme="answers[current._id] === '正确' || answers[current._id] === '对' || answers[current._id] === 'T' ? 'primary' : 'default'"
                @click="setJudgment('正确')"
              >正确</t-button>
              <t-button
                :theme="answers[current._id] === '错误' || answers[current._id] === '错' || answers[current._id] === 'F' ? 'primary' : 'default'"
                @click="setJudgment('错误')"
              >错误</t-button>
            </div>
          </div>

          <div class="nav-row">
            <t-button variant="outline" :disabled="index <= 0" @click="goPrev">上一题</t-button>
            <t-button theme="primary" :disabled="index >= paper.length - 1" @click="goNext">下一题</t-button>
          </div>
        </div>

        <div class="panel sheet">
          <div class="sheet-title">答题卡</div>
          <div class="sheet-grid">
            <button
              v-for="(q, i) in paper"
              :key="q._id"
              class="sheet-item"
              :class="{ current: i === index, answered: !!answers[q._id] }"
              @click="index = i"
            >{{ i + 1 }}</button>
          </div>
          <div class="sheet-foot">
            已答 {{ answeredCount }} / {{ paper.length }}
          </div>
        </div>
      </div>
    </div>

    <!-- 成绩 -->
    <div v-else-if="phase === 'result'" class="result">
      <div class="panel result-hero">
        <div class="score">{{ score.correct }} / {{ score.total }}</div>
        <div class="score-sub">正确率 {{ score.rate }}% · 用时 {{ usedTimeText }}</div>
        <div class="result-actions">
          <t-button theme="primary" @click="phase = 'review'">查看解析</t-button>
          <t-button variant="outline" @click="restart">再考一次</t-button>
          <t-button variant="text" @click="backSetup">返回组卷</t-button>
        </div>
      </div>
    </div>

    <!-- 解析回顾 -->
    <div v-else-if="phase === 'review'" class="review">
      <div class="panel review-toolbar">
        <t-radio-group v-model="reviewFilter" variant="default-filled">
          <t-radio-button value="all">全部</t-radio-button>
          <t-radio-button value="wrong">只看错题</t-radio-button>
          <t-radio-button value="correct">只看对题</t-radio-button>
        </t-radio-group>
        <div>
          <t-button variant="outline" @click="phase = 'result'">返回成绩</t-button>
          <t-button theme="primary" variant="outline" @click="backSetup">重新组卷</t-button>
        </div>
      </div>

      <div v-for="item in reviewList" :key="item.q._id" class="panel review-card">
        <div class="review-head">
          <t-tag :theme="item.ok ? 'success' : 'danger'" variant="light">{{ item.ok ? '正确' : '错误' }}</t-tag>
          <t-tag variant="light">{{ typeLabel(item.q.type) }}</t-tag>
          <span class="q-num">第 {{ item.ord }} 题</span>
        </div>
        <div class="q-stem">{{ item.q.question }}</div>
        <div class="options readonly">
          <div
            v-for="opt in item.q.options || []"
            :key="opt.key"
            class="option"
            :class="{
              correct: String(item.q.answer || '').includes(opt.key),
              wrong: !item.ok && String(item.user || '').includes(opt.key) && !String(item.q.answer || '').includes(opt.key),
            }"
          >
            <span class="opt-key">{{ opt.key }}</span>
            <span class="opt-label">{{ opt.label }}</span>
          </div>
        </div>
        <div class="answer-line">
          你的答案：<strong>{{ item.user || '未作答' }}</strong>
          · 正确答案：<strong class="ok-text">{{ item.q.answer }}</strong>
        </div>
        <div v-if="item.q.explanation" class="expl">解析：{{ item.q.explanation }}</div>
      </div>

      <div v-if="!reviewList.length" class="empty-hint panel">没有符合筛选的题目</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { qb, examMeta } from '../api'

const phase = ref('setup') // setup | exam | result | review
const categories = ref([])
const allCourses = ref([])
const allBanks = ref([])
const courses = ref([])
const banks = ref([])
const categoryId = ref('')
const courseId = ref('')
const bankId = ref('')
const typeFilter = ref('all')
const questionCount = ref(50)
const timeLimitMin = ref(60)
const randomMode = ref(true)
const metaLoading = ref(false)
const starting = ref(false)
const bankMeta = ref({ total: null, counts: null })

const paper = ref([])
const index = ref(0)
const answers = ref({})
const remainingSec = ref(null)
const startedAt = ref(0)
const endedAt = ref(0)
const reviewFilter = ref('all')

let timer = null

const bankName = computed(() => banks.value.find((b) => b._id === bankId.value)?.name || '模拟考试')
const current = computed(() => paper.value[index.value] || null)
const answeredCount = computed(() => paper.value.filter((q) => !!answers.value[q._id]).length)

const score = computed(() => {
  let correct = 0
  paper.value.forEach((q) => {
    if (isCorrect(q, answers.value[q._id])) correct += 1
  })
  const total = paper.value.length || 1
  return {
    correct,
    total: paper.value.length,
    rate: Math.round((correct / total) * 100),
  }
})

const usedTimeText = computed(() => {
  const sec = Math.max(0, Math.floor(((endedAt.value || Date.now()) - startedAt.value) / 1000))
  return formatSec(sec)
})

const timerText = computed(() => {
  if (remainingSec.value == null) return '不限时'
  return formatSec(remainingSec.value)
})

const reviewList = computed(() => {
  const list = paper.value.map((q, i) => {
    const user = answers.value[q._id] || ''
    const ok = isCorrect(q, user)
    return { q, user, ok, ord: i + 1 }
  })
  if (reviewFilter.value === 'wrong') return list.filter((x) => !x.ok)
  if (reviewFilter.value === 'correct') return list.filter((x) => x.ok)
  return list
})

watch(bankId, () => {
  bankMeta.value = { total: null, counts: null }
  if (bankId.value) refreshMeta()
})

function formatSec(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function typeLabel(t) {
  return { judgment: '判断题', single: '单选题', multiple: '多选题' }[t] || t
}

function normalizeAns(ans, type) {
  const raw = String(ans || '').trim()
  if (type === 'multiple') return raw.split('').sort().join('')
  if (type === 'judgment') {
    if (['正确', '对', 'T', 'true', 'TRUE', 'A'].includes(raw)) return '正确'
    if (['错误', '错', 'F', 'false', 'FALSE', 'B'].includes(raw)) return '错误'
  }
  return raw
}

function isCorrect(q, user) {
  return normalizeAns(user, q.type) === normalizeAns(q.answer, q.type)
}

function isSelected(key) {
  const q = current.value
  if (!q) return false
  const val = answers.value[q._id] || ''
  if (q.type === 'multiple') return val.includes(key)
  return val === key
}

function toggleOption(key) {
  const q = current.value
  if (!q) return
  if (q.type === 'multiple') {
    const set = new Set((answers.value[q._id] || '').split('').filter(Boolean))
    if (set.has(key)) set.delete(key)
    else set.add(key)
    answers.value = { ...answers.value, [q._id]: Array.from(set).sort().join('') }
  } else {
    answers.value = { ...answers.value, [q._id]: key }
  }
}

function setJudgment(val) {
  const q = current.value
  if (!q) return
  answers.value = { ...answers.value, [q._id]: val }
}

function goPrev() {
  if (index.value > 0) index.value -= 1
}
function goNext() {
  if (index.value < paper.value.length - 1) index.value += 1
}

async function loadTree() {
  const res = await qb('getTree')
  if (res.code !== 200) {
    MessagePlugin.error(res.message || '加载题库失败')
    return
  }
  categories.value = res.data?.categories || []
  allCourses.value = res.data?.courses || []
  allBanks.value = res.data?.banks || []
}

function onCategoryChange() {
  courseId.value = ''
  bankId.value = ''
  courses.value = allCourses.value.filter((c) => c.categoryId === categoryId.value)
  banks.value = []
}

function onCourseChange() {
  bankId.value = ''
  banks.value = allBanks.value.filter((b) => b.courseId === courseId.value)
}

async function refreshMeta() {
  if (!bankId.value) return
  metaLoading.value = true
  try {
    const r = await examMeta({ bankId: bankId.value })
    const data = r.data
    if (r.code === 200 && data) {
      bankMeta.value = { total: data.total, counts: data.counts }
      if (questionCount.value > data.total && data.total > 0) {
        questionCount.value = data.total
      }
    } else {
      const res = await qb('listQuestions', { bankId: bankId.value, type: typeFilter.value, offset: 0, limit: 1 })
      if (res.code === 200) bankMeta.value = { total: res.data?.total || 0, counts: null }
    }
  } catch (e) {
    MessagePlugin.error('获取题量失败')
  } finally {
    metaLoading.value = false
  }
}

async function fetchAllQuestions(bankIdVal, type) {
  const all = []
  let offset = 0
  const limit = 100
  let total = Infinity
  while (offset < total) {
    const res = await qb('listQuestions', { bankId: bankIdVal, type, offset, limit })
    if (res.code !== 200) throw new Error(res.message || '拉取题目失败')
    const qs = res.data?.questions || []
    total = res.data?.total ?? qs.length
    all.push(...qs)
    offset += qs.length
    if (!qs.length) break
  }
  return all
}

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function startExam() {
  if (!bankId.value) {
    MessagePlugin.warning('请先选择题库')
    return
  }
  starting.value = true
  try {
    let list = await fetchAllQuestions(bankId.value, typeFilter.value)
    if (!list.length) {
      MessagePlugin.warning('该题库没有可用题目')
      return
    }
    if (randomMode.value) list = shuffle(list)
    const n = Math.min(questionCount.value || list.length, list.length)
    paper.value = list.slice(0, n)
    answers.value = {}
    index.value = 0
    startedAt.value = Date.now()
    endedAt.value = 0
    clearTimer()
    if (timeLimitMin.value > 0) {
      remainingSec.value = timeLimitMin.value * 60
      timer = setInterval(() => {
        remainingSec.value -= 1
        if (remainingSec.value <= 0) {
          remainingSec.value = 0
          finishExam(true)
        }
      }, 1000)
    } else {
      remainingSec.value = null
    }
    phase.value = 'exam'
  } catch (e) {
    MessagePlugin.error(e.message || '组卷失败')
  } finally {
    starting.value = false
  }
}

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function finishExam(auto = false) {
  clearTimer()
  endedAt.value = Date.now()
  phase.value = 'result'
  if (auto) MessagePlugin.warning('时间到，已自动交卷')
}

function confirmSubmit() {
  const unanswered = paper.value.length - answeredCount.value
  const dlg = DialogPlugin.confirm({
    header: '确认交卷？',
    body: unanswered > 0 ? `还有 ${unanswered} 题未作答，确定交卷吗？` : '确定提交试卷并查看成绩？',
    onConfirm: () => {
      finishExam(false)
      dlg.destroy()
    },
  })
}

function confirmQuit() {
  const dlg = DialogPlugin.confirm({
    header: '退出考试？',
    body: '退出后当前作答不会保留。',
    onConfirm: () => {
      clearTimer()
      phase.value = 'setup'
      dlg.destroy()
    },
  })
}

function restart() {
  startExam()
}

function backSetup() {
  clearTimer()
  phase.value = 'setup'
  paper.value = []
  answers.value = {}
}

onBeforeUnmount(() => clearTimer())

loadTree()
</script>

<style scoped>
.mock { display: flex; flex-direction: column; gap: 16px; }

.panel {
  background: #fff;
  border: 1px solid var(--line, #e8ebe9);
  border-radius: 14px;
  padding: 20px;
}

.setup-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 13px; color: #66736e; }

.setup-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
}

.setup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.exam-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.exam-top-left, .exam-top-right, .result-actions, .review-toolbar, .nav-row, .judgment-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-title { font-weight: 600; font-size: 16px; }

.timer {
  font-variant-numeric: tabular-nums;
  font-size: 20px;
  font-weight: 600;
  color: #1a2d27;
}
.timer.warn { color: #d54941; }

.exam-body {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 16px;
}

.q-meta { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
.q-num { color: #88948f; font-size: 13px; }
.q-stem {
  font-size: 16px;
  line-height: 1.7;
  color: #1a2d27;
  margin-bottom: 18px;
  white-space: pre-wrap;
}

.options { display: flex; flex-direction: column; gap: 10px; }
.option {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e8ebe9;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.option:hover { border-color: #2f8a76; }
.option.active {
  border-color: #2f8a76;
  background: rgba(47, 138, 118, 0.08);
}
.option.correct {
  border-color: #2ba471;
  background: rgba(43, 164, 113, 0.1);
}
.option.wrong {
  border-color: #d54941;
  background: rgba(213, 73, 65, 0.08);
}
.opt-key {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f3f5f4;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.opt-label { line-height: 1.5; }

.nav-row { margin-top: 20px; justify-content: space-between; }

.sheet-title { font-weight: 600; margin-bottom: 12px; }
.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.sheet-item {
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e8ebe9;
  background: #fff;
  cursor: pointer;
}
.sheet-item.answered { background: rgba(47, 138, 118, 0.15); border-color: #2f8a76; }
.sheet-item.current { outline: 2px solid #2f8a76; }
.sheet-foot { margin-top: 12px; font-size: 13px; color: #66736e; }

.result-hero { text-align: center; padding: 48px 24px; }
.score {
  font-size: 48px;
  font-weight: 700;
  color: #1a2d27;
  font-family: var(--font-display, inherit);
}
.score-sub { margin: 8px 0 24px; color: #66736e; }
.result-actions { justify-content: center; }

.review-toolbar { display: flex; justify-content: space-between; align-items: center; }
.review-card { display: flex; flex-direction: column; gap: 10px; }
.review-head { display: flex; gap: 8px; align-items: center; }
.answer-line { font-size: 14px; color: #44514c; }
.ok-text { color: #2ba471; }
.expl {
  background: #f6f8f7;
  border-radius: 10px;
  padding: 12px 14px;
  line-height: 1.7;
  color: #44514c;
  font-size: 14px;
}
.empty-hint { color: #88948f; text-align: center; padding: 24px; }

@media (max-width: 960px) {
  .setup-grid { grid-template-columns: 1fr; }
  .exam-body { grid-template-columns: 1fr; }
}
</style>
