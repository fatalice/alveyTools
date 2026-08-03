<template>
  <div class="notes-layout">
    <div class="panel list-panel">
      <div class="toolbar">
        <div class="toolbar-left">
          <t-button theme="primary" @click="onCreate">新建笔记</t-button>
        </div>
        <div class="toolbar-right">
          <t-button variant="outline" @click="openCatManager">管理分类</t-button>
          <t-select
            v-model="filterCategoryId"
            clearable
            placeholder="按分类筛选"
            style="width: 160px"
            @change="fetchList"
          >
            <t-option v-for="c in categories" :key="c._id" :value="c._id" :label="c.name" />
          </t-select>
        </div>
      </div>

      <div v-if="!list.length && !loading" class="empty-hint">还没有笔记，点击左上角新建</div>
      <div
        v-for="item in list"
        :key="item._id"
        class="note-item"
        :class="{ active: current && current._id === item._id }"
        @click="openNote(item)"
      >
        <div class="note-title">
          <span v-if="item.pinned" class="pin">置顶</span>
          {{ item.title }}
        </div>
        <div class="note-meta">
          <span>{{ categoryName(item.categoryId) || '未分类' }}</span>
          <span>{{ formatTime(item.updatedAt) }}</span>
        </div>
        <div class="note-preview">{{ plainPreview(item.content) }}</div>
      </div>
    </div>

    <div class="panel detail-panel">
      <div v-if="!current && !editing" class="empty-hint">选择左侧笔记查看，或新建一篇</div>

      <template v-else-if="editing">
        <div class="toolbar">
          <div class="toolbar-left"><h3 style="margin:0">{{ form._id ? '编辑笔记' : '新建笔记' }}</h3></div>
          <div class="toolbar-right">
            <t-button variant="outline" @click="cancelEdit">取消</t-button>
            <t-button theme="primary" :loading="saving" @click="save">保存</t-button>
          </div>
        </div>
        <t-form label-width="80px">
          <t-form-item label="标题">
            <t-input v-model="form.title" placeholder="笔记标题" />
          </t-form-item>
          <t-form-item label="分类">
            <div class="cat-row">
              <t-select v-model="form.categoryId" clearable placeholder="如：考研英语" style="flex:1">
                <t-option v-for="c in categories" :key="c._id" :value="c._id" :label="c.name" />
              </t-select>
              <t-button variant="outline" @click="openCatManager">设置</t-button>
            </div>
          </t-form-item>
          <t-form-item label="置顶">
            <t-switch v-model="form.pinned" />
          </t-form-item>
          <t-form-item label="内容">
            <t-textarea
              v-model="form.content"
              placeholder="支持纯文本 / Markdown"
              :autosize="{ minRows: 16 }"
            />
          </t-form-item>
        </t-form>
      </template>

      <template v-else>
        <div class="toolbar">
          <div class="toolbar-left">
            <h3 class="detail-title">{{ current.title }}</h3>
          </div>
          <div class="toolbar-right">
            <t-button variant="outline" @click="startEdit(current)">编辑</t-button>
            <t-button theme="danger" variant="outline" @click="remove(current)">删除</t-button>
          </div>
        </div>
        <div class="detail-meta">
          <span v-if="current.pinned">置顶</span>
          <span>{{ categoryName(current.categoryId) || '未分类' }}</span>
          <span>更新于 {{ formatTime(current.updatedAt) }}</span>
        </div>
        <pre class="detail-body">{{ current.content }}</pre>
      </template>
    </div>

    <t-dialog
      v-model:visible="catDialog"
      header="笔记分类管理"
      width="560px"
      :footer="false"
    >
      <div class="cat-toolbar">
        <t-input v-model="catForm.name" placeholder="新分类名称，如：考研英语" />
        <t-button theme="primary" :loading="catSaving" @click="saveCategory">添加</t-button>
      </div>
      <t-table :data="categories" :columns="catColumns" row-key="_id" size="small" />
    </t-dialog>

    <t-dialog
      v-model:visible="catEditDialog"
      header="编辑分类"
      @confirm="updateCategory"
      :confirm-btn="{ loading: catSaving }"
    >
      <t-input v-model="catEditForm.name" placeholder="分类名称" />
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { Button as TButton, MessagePlugin } from 'tdesign-vue-next'
import { notes } from '../api'

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const current = ref(null)
const editing = ref(false)
const categories = ref([])
const filterCategoryId = ref('')
const form = ref(emptyForm())

const catDialog = ref(false)
const catSaving = ref(false)
const catForm = ref({ name: '' })
const catEditDialog = ref(false)
const catEditForm = ref({ _id: '', name: '' })

const catColumns = [
  { colKey: 'name', title: '分类名称' },
  {
    colKey: 'op',
    title: '操作',
    width: 140,
    cell: (_, { row }) =>
      h('div', { style: 'display:flex;gap:6px' }, [
        h(TButton, { size: 'small', variant: 'text', onClick: () => openEditCat(row) }, () => '编辑'),
        h(TButton, { size: 'small', variant: 'text', theme: 'danger', onClick: () => removeCat(row) }, () => '删除'),
      ]),
  },
]

function emptyForm() {
  return { _id: '', title: '', content: '', categoryId: '', pinned: false }
}

function categoryName(id) {
  return (categories.value.find((c) => c._id === id) || {}).name || ''
}
function formatTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}
function plainPreview(text) {
  return String(text || '').replace(/\s+/g, ' ').slice(0, 80)
}

async function loadCategories() {
  const res = await notes('listCategories')
  if (res.code === 200) categories.value = res.data || []
}

async function fetchList() {
  loading.value = true
  try {
    const res = await notes('list', {
      categoryId: filterCategoryId.value || undefined,
    })
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '加载失败')
      return
    }
    list.value = res.data || []
  } finally {
    loading.value = false
  }
}

function onCreate() {
  form.value = emptyForm()
  current.value = null
  editing.value = true
}

function openNote(item) {
  current.value = item
  editing.value = false
}

function startEdit(item) {
  form.value = {
    _id: item._id,
    title: item.title,
    content: item.content,
    categoryId: item.categoryId || '',
    pinned: !!item.pinned,
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  if (!current.value) form.value = emptyForm()
}

async function save() {
  saving.value = true
  try {
    const res = await notes('save', form.value)
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '保存失败')
      return
    }
    MessagePlugin.success('已保存')
    editing.value = false
    await fetchList()
    const id = form.value._id || (res.data && res.data._id)
    current.value = list.value.find((n) => n._id === id) || null
  } finally {
    saving.value = false
  }
}

async function remove(item) {
  if (!confirm(`删除笔记「${item.title}」？`)) return
  const res = await notes('delete', { _id: item._id })
  if (res.code !== 200) {
    MessagePlugin.error(res.message || '删除失败')
    return
  }
  current.value = null
  editing.value = false
  await fetchList()
}

function openCatManager() {
  catForm.value = { name: '' }
  catDialog.value = true
}

async function saveCategory() {
  if (!catForm.value.name.trim()) {
    MessagePlugin.warning('请输入分类名称')
    return
  }
  catSaving.value = true
  try {
    const res = await notes('saveCategory', {
      name: catForm.value.name.trim(),
      sort: categories.value.length,
    })
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '保存失败')
      return
    }
    catForm.value.name = ''
    await loadCategories()
    MessagePlugin.success('分类已添加')
  } finally {
    catSaving.value = false
  }
}

function openEditCat(row) {
  catEditForm.value = { _id: row._id, name: row.name }
  catEditDialog.value = true
}

async function updateCategory() {
  if (!catEditForm.value.name.trim()) {
    MessagePlugin.warning('请输入分类名称')
    return
  }
  catSaving.value = true
  try {
    const res = await notes('saveCategory', {
      _id: catEditForm.value._id,
      name: catEditForm.value.name.trim(),
    })
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '保存失败')
      return
    }
    catEditDialog.value = false
    await loadCategories()
    MessagePlugin.success('已更新')
  } finally {
    catSaving.value = false
  }
}

async function removeCat(row) {
  if (!confirm(`删除分类「${row.name}」？`)) return
  const res = await notes('deleteCategory', { _id: row._id })
  if (res.code !== 200) {
    MessagePlugin.error(res.message || '删除失败')
    return
  }
  if (filterCategoryId.value === row._id) filterCategoryId.value = ''
  await loadCategories()
  await fetchList()
}

onMounted(async () => {
  await loadCategories()
  await fetchList()
})
</script>

<style scoped>
.notes-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
  min-height: 640px;
}
.list-panel, .detail-panel { min-height: 640px; }
.cat-row { display: flex; gap: 8px; width: 100%; }
.cat-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.note-item {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  margin-bottom: 8px;
}
.note-item:hover { background: #f7faf8; }
.note-item.active {
  background: var(--accent-soft);
  border-color: rgba(15, 107, 92, 0.18);
}
.note-title {
  font-weight: 600;
  font-size: 15px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.pin {
  font-size: 11px;
  background: #0f6b5c;
  color: #fff;
  border-radius: 999px;
  padding: 1px 7px;
}
.note-meta {
  margin-top: 6px;
  display: flex;
  gap: 10px;
  color: var(--ink-soft);
  font-size: 12px;
}
.note-preview {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.5;
}
.detail-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
}
.detail-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--ink-soft);
  font-size: 13px;
  margin-bottom: 18px;
}
.detail-body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-body);
  line-height: 1.7;
  font-size: 15px;
}

@media (max-width: 1000px) {
  .notes-layout { grid-template-columns: 1fr; }
}
</style>
