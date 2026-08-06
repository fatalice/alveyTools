<template>
  <div class="panel">
    <div class="toolbar">
      <div class="toolbar-left">
        <t-button theme="primary" @click="onAdd">新增奖品</t-button>
        <t-button variant="outline" :loading="seeding" @click="onSeed">空库时导入默认</t-button>
        <t-tag theme="default" variant="light">共 {{ list.length }} 个</t-tag>
      </div>
    </div>

    <t-table :data="list" :columns="columns" row-key="_id" :loading="loading" />

    <t-dialog
      v-model:visible="dialogVisible"
      :header="editId ? '编辑奖品' : '新增奖品'"
      width="560px"
      @confirm="onSave"
      :confirm-btn="{ loading: saving }"
    >
      <t-form>
        <t-form-item label="奖品 ID">
          <t-input
            v-model="form.id"
            placeholder="示例：starbucks-tall、movie-2（小写英文/数字/-/_）"
            :disabled="!!editId"
          />
        </t-form-item>
        <t-form-item label="名称">
          <t-input v-model="form.name" placeholder="奖品名称" />
        </t-form-item>
        <t-form-item label="图标">
          <t-input v-model="form.emoji" placeholder="emoji，如 🧋" style="width: 120px" />
        </t-form-item>
        <t-form-item label="积分">
          <t-input-number v-model="form.cost" :min="1" :decimal-places="0" />
        </t-form-item>
        <t-form-item label="排序">
          <t-input-number v-model="form.sort" :min="0" :decimal-places="0" />
        </t-form-item>
        <t-form-item label="上架">
          <t-switch v-model="form.enabled" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { Button as TButton, Tag as TTag, MessagePlugin } from 'tdesign-vue-next'
import { prizes } from '../api'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const seeding = ref(false)
const editId = ref('')
const form = ref({ id: '', name: '', emoji: '🎁', cost: 10, sort: 0, enabled: true })

const columns = [
  {
    colKey: 'emoji',
    title: '图标',
    width: 70,
    cell: (_, { row }) => row.emoji || '🎁',
  },
  { colKey: 'name', title: '名称', width: 180 },
  { colKey: 'id', title: '奖品 ID', width: 140 },
  { colKey: 'cost', title: '积分', width: 90 },
  { colKey: 'sort', title: '排序', width: 80 },
  {
    colKey: 'enabled',
    title: '状态',
    width: 90,
    cell: (_, { row }) =>
      h(
        TTag,
        { theme: row.enabled !== false ? 'success' : 'default', variant: 'light', size: 'small' },
        () => (row.enabled !== false ? '上架' : '下架')
      ),
  },
  {
    colKey: 'op',
    title: '操作',
    width: 160,
    cell: (_, { row }) =>
      h('div', { style: 'display:flex;gap:8px' }, [
        h(TButton, { size: 'small', variant: 'text', onClick: () => onEdit(row) }, () => '编辑'),
        h(TButton, { size: 'small', variant: 'text', theme: 'danger', onClick: () => onDelete(row) }, () => '删除'),
      ]),
  },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await prizes('list')
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '加载失败')
      return
    }
    list.value = res.data?.prizes || []
  } finally {
    loading.value = false
  }
}

function onAdd() {
  editId.value = ''
  const nextSort = list.value.reduce((m, p) => Math.max(m, Number(p.sort) || 0), 0) + 1
  form.value = { id: '', name: '', emoji: '🎁', cost: 10, sort: nextSort, enabled: true }
  dialogVisible.value = true
}

function onEdit(row) {
  editId.value = row._id
  form.value = {
    id: row.id || '',
    name: row.name || '',
    emoji: row.emoji || '🎁',
    cost: Number(row.cost) || 1,
    sort: Number(row.sort) || 0,
    enabled: row.enabled !== false,
  }
  dialogVisible.value = true
}

async function onSave() {
  saving.value = true
  try {
    const data = { ...form.value }
    if (editId.value) data._id = editId.value
    const res = await prizes('save', data)
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '保存失败')
      return
    }
    MessagePlugin.success(res.message || '保存成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`确定删除「${row.name}」？删除后小程序将无法再兑换该奖品。`)) return
  const res = await prizes('delete', { _id: row._id })
  if (res.code !== 200) {
    MessagePlugin.error(res.message || '删除失败')
    return
  }
  MessagePlugin.success('已删除')
  fetchList()
}

async function onSeed() {
  seeding.value = true
  try {
    const res = await prizes('seed')
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '导入失败')
      return
    }
    MessagePlugin.success(res.message || '完成')
    fetchList()
  } finally {
    seeding.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.panel {
  background: #fff;
  border: 1px solid var(--line, #e8ebe9);
  border-radius: 14px;
  padding: 20px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
