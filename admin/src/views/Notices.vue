<template>
  <div class="notices-page">
    <div class="toolbar">
      <t-button theme="primary" @click="onAdd">发布公告</t-button>
    </div>

    <t-table :data="list" :columns="columns" row-key="_id" :loading="loading" />

    <t-dialog v-model:visible="dialogVisible" :header="editId ? '编辑公告' : '发布公告'" @confirm="onSave" :confirm-btn="{ loading: saving }">
      <t-form>
        <t-form-item label="标题">
          <t-input v-model="form.title" placeholder="公告标题" />
        </t-form-item>
        <t-form-item label="内容">
          <t-textarea v-model="form.content" placeholder="公告内容" :maxlength="500" />
        </t-form-item>
        <t-form-item label="置顶">
          <t-switch v-model="form.pinned" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { Button as TButton } from 'tdesign-vue-next'
import { getNotices, saveNotice, deleteNotice } from '../api'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const editId = ref('')
const form = ref({ title: '', content: '', pinned: false })

const columns = [
  { colKey: 'title', title: '标题', width: 200 },
  { colKey: 'content', title: '内容', ellipsis: true },
  { colKey: 'pinned', title: '置顶', width: 80, cell: (h, { row }) => row.pinned ? '📌' : '-' },
  { colKey: 'createdAt', title: '时间', width: 160, cell: (h, { row }) => new Date(row.createdAt).toLocaleString() },
  {
    colKey: 'op', title: '操作', width: 160,
    cell: (_, { row }) => h('div', [
      h(TButton, { size: 'small', variant: 'text', onClick: () => onEdit(row) }, () => '编辑'),
      h(TButton, { size: 'small', variant: 'text', theme: 'danger', onClick: () => onDelete(row) }, () => '删除'),
    ])
  },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getNotices()
    list.value = res.data || []
  } finally {
    loading.value = false
  }
}

function onAdd() {
  editId.value = ''
  form.value = { title: '', content: '', pinned: false }
  dialogVisible.value = true
}

function onEdit(row) {
  editId.value = row._id
  form.value = { title: row.title, content: row.content, pinned: !!row.pinned }
  dialogVisible.value = true
}

async function onSave() {
  saving.value = true
  try {
    const data = { ...form.value }
    if (editId.value) data._id = editId.value
    await saveNotice(data)
    dialogVisible.value = false
    fetchList()
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`确定删除「${row.title}」？`)) return
  await deleteNotice(row._id)
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
