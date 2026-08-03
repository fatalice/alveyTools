<template>
  <div class="qb">
    <div class="crumb">
      <strong>层级</strong>
      <span>分类</span>
      <span v-if="selectedCategory">/ {{ selectedCategory.name }}</span>
      <span v-if="selectedCourse">/ {{ selectedCourse.name }}</span>
      <span v-if="selectedBank">/ {{ selectedBank.name }}</span>
    </div>

    <div class="qb-grid">
      <!-- 分类 -->
      <div class="panel col">
        <div class="col-head">
          <h3>1. 分类</h3>
          <t-button size="small" theme="primary" variant="outline" @click="openCat()">新增</t-button>
        </div>
        <div v-if="!categories.length" class="empty-hint">例如：考研题库</div>
        <div
          v-for="item in categories"
          :key="item._id"
          class="list-item"
          :class="{ active: selectedCategoryId === item._id }"
          @click="selectCategory(item)"
        >
          <div class="item-main">
            <div class="item-title">{{ item.name }}</div>
            <div class="item-sub">{{ item.description || '暂无描述' }}</div>
          </div>
          <div class="item-ops" @click.stop>
            <t-button size="small" variant="text" @click="openCat(item)">编辑</t-button>
            <t-button size="small" variant="text" theme="danger" @click="removeCat(item)">删</t-button>
          </div>
        </div>
      </div>

      <!-- 课程 -->
      <div class="panel col">
        <div class="col-head">
          <h3>2. 课程</h3>
          <t-button size="small" theme="primary" variant="outline" :disabled="!selectedCategoryId" @click="openCourse()">新增</t-button>
        </div>
        <div v-if="!selectedCategoryId" class="empty-hint">先选择分类</div>
        <div v-else-if="!courses.length" class="empty-hint">例如：政治 / 英语 / 数学 / 专业课</div>
        <div
          v-for="item in courses"
          :key="item._id"
          class="list-item"
          :class="{ active: selectedCourseId === item._id }"
          @click="selectCourse(item)"
        >
          <div class="item-main">
            <div class="item-title">{{ item.name }}</div>
            <div class="item-sub">{{ item.description || '暂无描述' }}</div>
          </div>
          <div class="item-ops" @click.stop>
            <t-button size="small" variant="text" @click="openCourse(item)">编辑</t-button>
            <t-button size="small" variant="text" theme="danger" @click="removeCourse(item)">删</t-button>
          </div>
        </div>
      </div>

      <!-- 题库 -->
      <div class="panel col">
        <div class="col-head">
          <h3>3. 题库</h3>
          <t-button size="small" theme="primary" variant="outline" :disabled="!selectedCourseId" @click="openBank()">新增</t-button>
        </div>
        <div v-if="!selectedCourseId" class="empty-hint">先选择课程</div>
        <div v-else-if="!banks.length" class="empty-hint">例如：2024 真题 / 模拟卷一</div>
        <div
          v-for="item in banks"
          :key="item._id"
          class="list-item"
          :class="{ active: selectedBankId === item._id }"
          @click="selectBank(item)"
        >
          <div class="item-main">
            <div class="item-title">{{ item.name }}</div>
            <div class="item-sub">{{ item.description || '暂无描述' }}</div>
          </div>
          <div class="item-ops" @click.stop>
            <t-button size="small" variant="text" @click="openBank(item)">编辑</t-button>
            <t-button size="small" variant="text" theme="danger" @click="removeBank(item)">删</t-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 题目 -->
    <div class="panel questions" style="margin-top: 16px">
      <div class="toolbar">
        <div class="toolbar-left">
          <h3 style="margin:0">4. 题目{{ selectedBank ? ` · ${selectedBank.name}` : '' }}</h3>
          <t-tag v-if="questionTotal != null" theme="default" variant="light">共 {{ questionTotal }} 题</t-tag>
        </div>
        <div class="toolbar-right">
          <t-select v-model="questionType" style="width: 120px" @change="fetchQuestions">
            <t-option value="all" label="全部题型" />
            <t-option value="judgment" label="判断题" />
            <t-option value="single" label="单选题" />
            <t-option value="multiple" label="多选题" />
          </t-select>
          <t-button theme="primary" :disabled="!selectedBankId" @click="openQuestion()">新增题目</t-button>
          <t-button variant="outline" :disabled="!selectedBankId" @click="openImport">批量导入</t-button>
        </div>
      </div>

      <div v-if="!selectedBankId" class="empty-hint">选择题库后管理题目</div>
      <t-table
        v-else
        :data="questions"
        :columns="questionColumns"
        row-key="_id"
        :loading="questionsLoading"
      />
    </div>

    <!-- 分类弹窗 -->
    <t-dialog v-model:visible="catDialog" :header="catForm._id ? '编辑分类' : '新增分类'" @confirm="saveCat" :confirm-btn="{ loading: saving }">
      <t-form>
        <t-form-item label="名称"><t-input v-model="catForm.name" placeholder="如：考研题库" /></t-form-item>
        <t-form-item label="描述"><t-textarea v-model="catForm.description" /></t-form-item>
        <t-form-item label="排序"><t-input-number v-model="catForm.sort" :min="0" /></t-form-item>
      </t-form>
    </t-dialog>

    <!-- 课程弹窗 -->
    <t-dialog v-model:visible="courseDialog" :header="courseForm._id ? '编辑课程' : '新增课程'" @confirm="saveCourse" :confirm-btn="{ loading: saving }">
      <t-form>
        <t-form-item label="名称"><t-input v-model="courseForm.name" placeholder="如：政治" /></t-form-item>
        <t-form-item label="描述"><t-textarea v-model="courseForm.description" /></t-form-item>
        <t-form-item label="排序"><t-input-number v-model="courseForm.sort" :min="0" /></t-form-item>
      </t-form>
    </t-dialog>

    <!-- 题库弹窗 -->
    <t-dialog v-model:visible="bankDialog" :header="bankForm._id ? '编辑题库' : '新增题库'" @confirm="saveBank" :confirm-btn="{ loading: saving }">
      <t-form>
        <t-form-item label="名称"><t-input v-model="bankForm.name" placeholder="如：2024真题" /></t-form-item>
        <t-form-item label="描述"><t-textarea v-model="bankForm.description" /></t-form-item>
        <t-form-item label="排序"><t-input-number v-model="bankForm.sort" :min="0" /></t-form-item>
      </t-form>
    </t-dialog>

    <!-- 题目弹窗 -->
    <t-dialog
      v-model:visible="questionDialog"
      :header="questionForm._id ? '编辑题目' : '新增题目'"
      width="720px"
      @confirm="saveQuestion"
      :confirm-btn="{ loading: saving }"
    >
      <t-form label-width="80px">
        <t-form-item label="题型">
          <t-radio-group v-model="questionForm.type">
            <t-radio value="judgment">判断</t-radio>
            <t-radio value="single">单选</t-radio>
            <t-radio value="multiple">多选</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="题号"><t-input-number v-model="questionForm.num" :min="0" /></t-form-item>
        <t-form-item label="题干"><t-textarea v-model="questionForm.question" :autosize="{ minRows: 3 }" /></t-form-item>
        <t-form-item v-if="questionForm.type !== 'judgment'" label="选项">
          <div class="opt-list">
            <div v-for="(opt, idx) in questionForm.options" :key="idx" class="opt-row">
              <t-input v-model="opt.key" style="width: 64px" placeholder="A" />
              <t-input v-model="opt.label" placeholder="选项内容" style="flex:1" />
              <t-button variant="text" theme="danger" @click="questionForm.options.splice(idx, 1)">删</t-button>
            </div>
            <t-button size="small" variant="outline" @click="addOption">加选项</t-button>
          </div>
        </t-form-item>
        <t-form-item v-else label="选项">
          <t-tag>自动使用 正确 / 错误</t-tag>
        </t-form-item>
        <t-form-item label="答案">
          <t-input v-model="questionForm.answer" :placeholder="questionForm.type === 'multiple' ? '如 ABC' : questionForm.type === 'judgment' ? '如 正确 或 T' : '如 A'" />
        </t-form-item>
        <t-form-item label="解析"><t-textarea v-model="questionForm.explanation" /></t-form-item>
      </t-form>
    </t-dialog>

    <!-- 导入弹窗 -->
    <t-dialog v-model:visible="importDialog" header="批量导入题目 JSON" width="720px" @confirm="doImport" :confirm-btn="{ loading: saving }">
      <p class="import-tip">粘贴题目数组 JSON。字段：type, question, options[{key,label}], answer, explanation, num</p>
      <t-textarea v-model="importText" :autosize="{ minRows: 12 }" placeholder='[{"type":"single","question":"...","options":[{"key":"A","label":"..."}],"answer":"A"}]' />
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { Button as TButton, MessagePlugin } from 'tdesign-vue-next'
import { qb } from '../api'

const saving = ref(false)
const categories = ref([])
const courses = ref([])
const banks = ref([])
const questions = ref([])
const questionTotal = ref(null)
const questionsLoading = ref(false)
const questionType = ref('all')

const selectedCategoryId = ref('')
const selectedCourseId = ref('')
const selectedBankId = ref('')

const selectedCategory = computed(() => categories.value.find((x) => x._id === selectedCategoryId.value))
const selectedCourse = computed(() => courses.value.find((x) => x._id === selectedCourseId.value))
const selectedBank = computed(() => banks.value.find((x) => x._id === selectedBankId.value))

const catDialog = ref(false)
const courseDialog = ref(false)
const bankDialog = ref(false)
const questionDialog = ref(false)
const importDialog = ref(false)
const importText = ref('')

const catForm = ref({ _id: '', name: '', description: '', sort: 0 })
const courseForm = ref({ _id: '', name: '', description: '', sort: 0 })
const bankForm = ref({ _id: '', name: '', description: '', sort: 0 })
const questionForm = ref(emptyQuestion())

function emptyQuestion() {
  return {
    _id: '',
    type: 'single',
    num: 0,
    question: '',
    options: [
      { key: 'A', label: '' },
      { key: 'B', label: '' },
      { key: 'C', label: '' },
      { key: 'D', label: '' },
    ],
    answer: '',
    explanation: '',
  }
}

const typeLabel = { judgment: '判断', single: '单选', multiple: '多选' }

const questionColumns = [
  { colKey: 'num', title: '题号', width: 70 },
  { colKey: 'type', title: '题型', width: 80, cell: (_, { row }) => typeLabel[row.type] || row.type },
  { colKey: 'question', title: '题干', ellipsis: true },
  { colKey: 'answer', title: '答案', width: 90 },
  {
    colKey: 'op',
    title: '操作',
    width: 140,
    cell: (_, { row }) =>
      h('div', { style: 'display:flex;gap:6px' }, [
        h(TButton, { size: 'small', variant: 'text', onClick: () => openQuestion(row) }, () => '编辑'),
        h(TButton, { size: 'small', variant: 'text', theme: 'danger', onClick: () => removeQuestion(row) }, () => '删除'),
      ]),
  },
]

async function refreshTree() {
  const res = await qb('getTree')
  if (res.code !== 200) {
    MessagePlugin.error(res.message || '加载失败')
    return
  }
  categories.value = res.data.categories || []
  if (selectedCategoryId.value) {
    courses.value = (res.data.courses || []).filter((c) => c.categoryId === selectedCategoryId.value)
  }
  if (selectedCourseId.value) {
    banks.value = (res.data.banks || []).filter((b) => b.courseId === selectedCourseId.value)
  }
}

async function selectCategory(item) {
  selectedCategoryId.value = item._id
  selectedCourseId.value = ''
  selectedBankId.value = ''
  banks.value = []
  questions.value = []
  questionTotal.value = null
  const res = await qb('listCourses', { categoryId: item._id })
  courses.value = res.data || []
}

async function selectCourse(item) {
  selectedCourseId.value = item._id
  selectedBankId.value = ''
  questions.value = []
  questionTotal.value = null
  const res = await qb('listBanks', { courseId: item._id })
  banks.value = res.data || []
}

async function selectBank(item) {
  selectedBankId.value = item._id
  await fetchQuestions()
}

async function fetchQuestions() {
  if (!selectedBankId.value) return
  questionsLoading.value = true
  try {
    const res = await qb('listQuestions', {
      bankId: selectedBankId.value,
      type: questionType.value,
      offset: 0,
      limit: 100,
    })
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '加载题目失败')
      return
    }
    questions.value = res.data.questions || []
    questionTotal.value = res.data.total
  } finally {
    questionsLoading.value = false
  }
}

function openCat(item) {
  catForm.value = item
    ? { _id: item._id, name: item.name, description: item.description || '', sort: item.sort || 0 }
    : { _id: '', name: '', description: '', sort: categories.value.length }
  catDialog.value = true
}

async function saveCat() {
  saving.value = true
  try {
    const res = await qb('saveCategory', catForm.value)
    if (res.code !== 200) return MessagePlugin.error(res.message || '保存失败')
    catDialog.value = false
    await refreshTree()
    MessagePlugin.success('已保存')
  } finally {
    saving.value = false
  }
}

async function removeCat(item) {
  if (!confirm(`删除分类「${item.name}」？`)) return
  const res = await qb('deleteCategory', { _id: item._id })
  if (res.code !== 200) return MessagePlugin.error(res.message || '删除失败')
  if (selectedCategoryId.value === item._id) {
    selectedCategoryId.value = ''
    selectedCourseId.value = ''
    selectedBankId.value = ''
    courses.value = []
    banks.value = []
    questions.value = []
  }
  await refreshTree()
}

function openCourse(item) {
  courseForm.value = item
    ? { _id: item._id, name: item.name, description: item.description || '', sort: item.sort || 0 }
    : { _id: '', name: '', description: '', sort: courses.value.length }
  courseDialog.value = true
}

async function saveCourse() {
  saving.value = true
  try {
    const res = await qb('saveCourse', {
      ...courseForm.value,
      categoryId: selectedCategoryId.value,
    })
    if (res.code !== 200) return MessagePlugin.error(res.message || '保存失败')
    courseDialog.value = false
    const list = await qb('listCourses', { categoryId: selectedCategoryId.value })
    courses.value = list.data || []
    MessagePlugin.success('已保存')
  } finally {
    saving.value = false
  }
}

async function removeCourse(item) {
  if (!confirm(`删除课程「${item.name}」？`)) return
  const res = await qb('deleteCourse', { _id: item._id })
  if (res.code !== 200) return MessagePlugin.error(res.message || '删除失败')
  if (selectedCourseId.value === item._id) {
    selectedCourseId.value = ''
    selectedBankId.value = ''
    banks.value = []
    questions.value = []
  }
  const list = await qb('listCourses', { categoryId: selectedCategoryId.value })
  courses.value = list.data || []
}

function openBank(item) {
  bankForm.value = item
    ? { _id: item._id, name: item.name, description: item.description || '', sort: item.sort || 0 }
    : { _id: '', name: '', description: '', sort: banks.value.length }
  bankDialog.value = true
}

async function saveBank() {
  saving.value = true
  try {
    const res = await qb('saveBank', {
      ...bankForm.value,
      courseId: selectedCourseId.value,
      categoryId: selectedCategoryId.value,
    })
    if (res.code !== 200) return MessagePlugin.error(res.message || '保存失败')
    bankDialog.value = false
    const list = await qb('listBanks', { courseId: selectedCourseId.value })
    banks.value = list.data || []
    MessagePlugin.success('已保存')
  } finally {
    saving.value = false
  }
}

async function removeBank(item) {
  if (!confirm(`删除题库「${item.name}」？`)) return
  const res = await qb('deleteBank', { _id: item._id })
  if (res.code !== 200) return MessagePlugin.error(res.message || '删除失败')
  if (selectedBankId.value === item._id) {
    selectedBankId.value = ''
    questions.value = []
    questionTotal.value = null
  }
  const list = await qb('listBanks', { courseId: selectedCourseId.value })
  banks.value = list.data || []
}

function openQuestion(item) {
  if (item) {
    questionForm.value = {
      _id: item._id,
      type: item.type,
      num: item.num || 0,
      question: item.question || '',
      options: Array.isArray(item.options) && item.options.length ? item.options.map((o) => ({ ...o })) : emptyQuestion().options,
      answer: item.answer || '',
      explanation: item.explanation || '',
    }
  } else {
    questionForm.value = emptyQuestion()
  }
  questionDialog.value = true
}

function addOption() {
  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const next = keys[questionForm.value.options.length] || 'X'
  questionForm.value.options.push({ key: next, label: '' })
}

async function saveQuestion() {
  saving.value = true
  try {
    const payload = { ...questionForm.value, bankId: selectedBankId.value }
    if (payload.type === 'judgment' && (!payload.options || !payload.options.length)) {
      payload.options = [
        { key: 'T', label: '正确' },
        { key: 'F', label: '错误' },
      ]
    }
    const res = await qb('saveQuestion', payload)
    if (res.code !== 200) return MessagePlugin.error(res.message || '保存失败')
    questionDialog.value = false
    await fetchQuestions()
    MessagePlugin.success('已保存')
  } finally {
    saving.value = false
  }
}

async function removeQuestion(row) {
  if (!confirm('确定删除该题？')) return
  const res = await qb('deleteQuestion', { _id: row._id })
  if (res.code !== 200) return MessagePlugin.error(res.message || '删除失败')
  await fetchQuestions()
}

function openImport() {
  importText.value = ''
  importDialog.value = true
}

async function doImport() {
  let questionsPayload
  try {
    questionsPayload = JSON.parse(importText.value)
  } catch {
    MessagePlugin.error('JSON 格式不正确')
    return
  }
  if (!Array.isArray(questionsPayload)) {
    MessagePlugin.error('需要题目数组')
    return
  }
  saving.value = true
  try {
    const res = await qb('importQuestions', {
      bankId: selectedBankId.value,
      questions: questionsPayload,
    })
    if (res.code !== 200) return MessagePlugin.error(res.message || '导入失败')
    importDialog.value = false
    MessagePlugin.success(res.message || '导入完成')
    await fetchQuestions()
  } finally {
    saving.value = false
  }
}

onMounted(refreshTree)
</script>

<style scoped>
.qb-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.col { padding: 16px; min-height: 320px; }
.col-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.col-head h3, .questions h3 {
  margin: 0;
  font-size: 15px;
  font-family: var(--font-display);
}
.list-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  margin-bottom: 6px;
}
.list-item:hover { background: #f7faf8; }
.list-item.active {
  background: var(--accent-soft);
  border-color: rgba(15, 107, 92, 0.18);
}
.item-main { flex: 1; min-width: 0; }
.item-title { font-weight: 600; font-size: 14px; }
.item-sub {
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-ops { display: flex; }
.opt-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.opt-row { display: flex; gap: 8px; align-items: center; }
.import-tip { margin: 0 0 12px; color: var(--ink-soft); font-size: 13px; }

@media (max-width: 1100px) {
  .qb-grid { grid-template-columns: 1fr; }
}
</style>
