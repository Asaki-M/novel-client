import { Card, Flex, Text, Button, Dialog, TextField, TextArea } from '@radix-ui/themes'
import { useState, useCallback } from 'react'
import { useKnowledgeBase } from '../hooks/useKnowledgeBase'
import { LoadingButton } from '../components/ui'
import type { KnowledgeBase as KnowledgeBaseType } from '../services/api'
import KnowledgeBaseDetail from './KnowledgeBaseDetail'

export default function KnowledgeBase() {
  const { knowledgeBases, loading, createKnowledgeBase } = useKnowledgeBase()

  const [selectedKB, setSelectedKB] = useState<KnowledgeBaseType | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newKBName, setNewKBName] = useState('')
  const [newKBDescription, setNewKBDescription] = useState('')

  // 创建知识库
  const handleCreateKB = useCallback(async () => {
    if (!newKBName.trim()) return

    setIsCreating(true)
    try {
      const newKB = await createKnowledgeBase({
        name: newKBName.trim(),
        description: newKBDescription.trim() || undefined,
      })
      setNewKBName('')
      setNewKBDescription('')
      // 创建成功后进入详情页
      setSelectedKB(newKB)
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
      alert('创建知识库失败')
    } finally {
      setIsCreating(false)
    }
  }, [newKBName, newKBDescription, createKnowledgeBase])

  // 如果选中了知识库，显示详情页
  if (selectedKB) {
    return (
      <KnowledgeBaseDetail
        knowledgeBase={selectedKB}
        onBack={() => setSelectedKB(null)}
      />
    )
  }

  // 显示列表页
  if (loading.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center text-gray-500 dark:text-neutral-400">加载知识库中...</div>
      </div>
    )
  }

  if (loading.error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center text-red-500">加载知识库失败: {loading.error}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <Flex justify="between" align="center" className="mb-4">
          <h2 className="text-xl font-semibold dark:text-white">知识库管理</h2>
          <Dialog.Root>
            <Dialog.Trigger>
              <Button>创建知识库</Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>创建知识库</Dialog.Title>
              <Flex direction="column" gap="3" className="mt-4">
                <label>
                  <Text size="2" weight="bold">
                    名称
                  </Text>
                  <TextField.Root
                    placeholder="知识库名称"
                    value={newKBName}
                    onChange={(e) => setNewKBName(e.target.value)}
                  />
                </label>
                <label>
                  <Text size="2" weight="bold">
                    描述
                  </Text>
                  <TextArea
                    placeholder="知识库描述（可选）"
                    value={newKBDescription}
                    onChange={(e) => setNewKBDescription(e.target.value)}
                  />
                </label>
                <Flex gap="3" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">
                      取消
                    </Button>
                  </Dialog.Close>
                  <Dialog.Close>
                    <LoadingButton onClick={handleCreateKB} loading={isCreating}>
                      创建
                    </LoadingButton>
                  </Dialog.Close>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {/* 知识库列表 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {knowledgeBases.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 dark:text-neutral-400 py-8">
              暂无知识库，请创建一个
            </div>
          ) : (
            knowledgeBases.map((kb) => (
              <Card
                key={kb.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => setSelectedKB(kb)}
              >
                <Flex direction="column" gap="2">
                  <Text weight="bold" size="3">
                    {kb._metadata.name}
                  </Text>
                  {kb._metadata.description && (
                    <Text size="2" color="gray">
                      {kb._metadata.description}
                    </Text>
                  )}
                  <Text size="1" color="gray">
                    创建时间: {new Date(kb._metadata.created).toLocaleString('zh-CN')}
                  </Text>
                </Flex>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
