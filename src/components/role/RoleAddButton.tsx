import { useState } from 'react'
import { Button, Text } from '@radix-ui/themes'
import { Modal } from '../../components/ui/Dialog'
import type { Character } from '../../services/api'

interface RoleAddButtonProps {
  onCreate: (character: Character) => void
}

export default function RoleAddButton({ onCreate }: RoleAddButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [avatar, setAvatar] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [backstoryPrompt, setBackstoryPrompt] = useState('')
  const [backstory, setBackstory] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    const n = name.trim()
    const d = desc.trim()
    const a = avatar.trim()
    const sp = systemPrompt.trim()
    const bp = backstoryPrompt.trim()
    const bs = backstory.trim()

    if (!n) return

    try {
      setCreating(true)
      const character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        name: n,
        description: d || '自定义角色',
        avatar: a || n.charAt(0).toUpperCase(),
        systemPrompt: sp || `你是 ${n}，一个友好的AI助手。`,
        backstoryPrompt: bp || undefined,
        backstory: bs || undefined,
      }

      await onCreate(character as Character) // onCreate will handle the API call and return the full Character

      setOpen(false)
      setName('')
      setDesc('')
      setAvatar('')
      setSystemPrompt('')
      setBackstoryPrompt('')
      setBackstory('')
    } catch (error) {
      console.error('Failed to create character:', error)
      // You might want to show a toast or error message here
    } finally {
      setCreating(false)
    }
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
            <Button variant="soft" onClick={() => setOpen(false)} disabled={creating}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? '创建中...' : '创建'}
            </Button>
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
              placeholder="例如：温柔学姐"
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
              头像
            </Text>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="可以是 emoji 或字母，如 🌸 或 A"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>
          <div>
            <Text as="label" size="2" className="mb-1 block">
              系统提示词
            </Text>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="定义角色的行为和回复风格..."
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
          <div>
            <Text as="label" size="2" className="mb-1 block">
              背景故事提示词 (可选)
            </Text>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="用于生成角色背景故事的提示词..."
              rows={2}
              value={backstoryPrompt}
              onChange={(e) => setBackstoryPrompt(e.target.value)}
            />
          </div>
          <div>
            <Text as="label" size="2" className="mb-1 block">
              背景故事 (可选)
            </Text>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="角色的详细背景故事..."
              rows={3}
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
} 