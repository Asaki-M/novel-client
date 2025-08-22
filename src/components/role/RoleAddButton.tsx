import { useState } from 'react'
import { Button, Text } from '@radix-ui/themes'
import { Modal } from '../../components/ui/Dialog'
import type { RoleItem } from '../../types'

interface RoleAddButtonProps {
  onCreate: (role: RoleItem) => void
}

export default function RoleAddButton({ onCreate }: RoleAddButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [fallback, setFallback] = useState('C')

  function handleCreate() {
    const n = name.trim()
    const d = desc.trim()
    const f = (fallback.trim() || 'C').slice(0, 1).toUpperCase()
    if (!n) return
    const id = `session-${Date.now()}`
    const role: RoleItem = { id, name: n, desc: d || '自定义角色', fallback: f }
    onCreate(role)
    setOpen(false)
    setName('')
    setDesc('')
    setFallback('C')
  }

  return (
    <div className="flex w-32 items-center justify-center">
      <Modal
        open={open}
        onOpenChange={setOpen}
        trigger={
          <button className="h-full w-full rounded-lg border border-dashed border-gray-300 p-4 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400">
            + 添加角色卡
          </button>
        }
        title={<>新建角色卡</>}
        description={<>为你的会话添加一个新的预设角色。</>}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="soft" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Text as="label" size="2" className="mb-1 block">
              名称
            </Text>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="例如：角色卡 · 客服"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Text as="label" size="2" className="mb-1 block">
              简介
            </Text>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="一句话描述该角色"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div>
            <Text as="label" size="2" className="mb-1 block">
              头像字母
            </Text>
            <input
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="如 C"
              value={fallback}
              onChange={(e) => setFallback(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
} 