import { Card, Flex, Text, Button, TextArea, Avatar } from '@radix-ui/themes'
import { useMemo, useState } from 'react'
import RoleList from '../components/role/RoleList'
import type { ChatMessage, RoleItem } from '../types'

export default function Home() {
  const initialRoles: RoleItem[] = useMemo(
    () => [
      { id: 'session-analyst', name: '角色卡 · 分析师', desc: '理性分析与建议', fallback: 'A' },
      { id: 'session-writer', name: '角色卡 · 文案', desc: '灵感与润色', fallback: 'W' },
      { id: 'session-friend', name: '角色卡 · 朋友', desc: '轻松陪聊与鼓励', fallback: 'F' },
    ],
    [],
  )

  const [roles, setRoles] = useState<RoleItem[]>(initialRoles)
  const [selectedSessionId, setSelectedSessionId] = useState<string>(roles[0].id)
  const [input, setInput] = useState('')
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({
    'session-analyst': [
      { id: 'a1', sender: 'bot', text: '欢迎来到分析师会话，我将以结构化方式协助你。' },
      { id: 'a2', sender: 'me', text: '我有一个产品需求，不知道如何拆解。' },
      { id: 'a3', sender: 'bot', text: '可以从目标、用户、场景、流程、指标五个方面入手。' },
    ],
    'session-writer': [
      { id: 'w1', sender: 'bot', text: '嗨～需要我写文案还是润色？' },
      { id: 'w2', sender: 'me', text: '帮我写个首页标语，主题是效率与可靠。' },
      { id: 'w3', sender: 'bot', text: '“更快一步，更稳一步。” 你觉得如何？' },
    ],
    'session-friend': [
      { id: 'f1', sender: 'bot', text: '嘿～最近怎么样？' },
      { id: 'f2', sender: 'me', text: '一般般，工作有点忙。' },
      { id: 'f3', sender: 'bot', text: '辛苦啦，忙的时候也要注意休息～' },
    ],
  })

  const currentMessages = messagesBySession[selectedSessionId] ?? []
  const currentRole = roles.find((r) => r.id === selectedSessionId)!

  function handleCreateRole(role: RoleItem) {
    setRoles((prev) => [role, ...prev])
    setMessagesBySession((prev) => ({
      ...prev,
      [role.id]: [
        { id: `${role.id}-hello`, sender: 'bot', text: `你好，我是 ${role.name}，很高兴认识你～` },
      ],
    }))
    setSelectedSessionId(role.id)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-semibold dark:text-white">首页</h1>

      <RoleList
        roles={roles}
        selectedId={selectedSessionId}
        onSelect={setSelectedSessionId}
        onCreate={handleCreateRole}
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-3 text-center text-xs text-gray-500 dark:text-neutral-400">
          会话ID：{selectedSessionId}
        </div>

        <Card>
          <div className="max-h-[480px] overflow-y-auto space-y-3 p-4">
            {currentMessages.length === 0 ? (
              <Text color="gray">此会话暂无消息，开始你的对话吧～</Text>
            ) : (
              currentMessages.map((m) => {
                const isMe = m.sender === 'me'
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <Avatar fallback={currentRole.fallback} radius="full" size="2" />
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-neutral-100'
                      }`}
                    >
                      {m.text}
                    </div>
                    {isMe && <Avatar fallback="我" radius="full" size="2" />}
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Flex gap="3" align="center" className="mt-3">
          <TextArea
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => {
              const text = input.trim()
              if (!text) return
              setMessagesBySession((prev) => ({
                ...prev,
                [selectedSessionId]: [
                  ...(prev[selectedSessionId] ?? []),
                  { id: `${Date.now()}`, sender: 'me', text },
                ],
              }))
              setInput('')
            }}
          >
            发送
          </Button>
        </Flex>
      </div>
    </div>
  )
} 