import { Card, Flex, Text, TextArea, Button, TextField } from '@radix-ui/themes'
import { useState, useCallback } from 'react'
import { LoadingButton } from '../components/ui'
import type { KnowledgeBase, Document, SearchResult } from '../services/api'
import { useKnowledgeBase } from '../hooks/useKnowledgeBase'

interface KnowledgeBaseDetailProps {
  knowledgeBase: KnowledgeBase
  onBack: () => void
}

export default function KnowledgeBaseDetail({ knowledgeBase, onBack }: KnowledgeBaseDetailProps) {
  const { addDocuments, searchDocuments, splitText, deleteKnowledgeBase } = useKnowledgeBase()

  const [documentText, setDocumentText] = useState('')
  const [chunks, setChunks] = useState<string[]>([])
  const [isSplitting, setIsSplitting] = useState(false)
  const [isAddingDoc, setIsAddingDoc] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [chunkSize, setChunkSize] = useState(500)
  const [chunkOverlap, setChunkOverlap] = useState(50)

  // 切割文本
  const handleSplitText = useCallback(async () => {
    if (!documentText.trim()) return

    setIsSplitting(true)
    try {
      const splitChunks = await splitText(documentText, chunkSize, chunkOverlap)
      setChunks(splitChunks)
    } catch (error) {
      console.error('Failed to split text:', error)
      alert('切割文本失败')
    } finally {
      setIsSplitting(false)
    }
  }, [documentText, chunkSize, chunkOverlap, splitText])

  // 添加文档
  const handleAddDocument = useCallback(async () => {
    if (chunks.length === 0) return

    setIsAddingDoc(true)
    try {
      // 转换为文档格式
      const documents: Document[] = chunks.map((chunk) => ({
        pageContent: chunk,
        metadata: { addedAt: new Date().toISOString() },
      }))

      // 添加到知识库
      const result = await addDocuments(knowledgeBase._name, documents)
      alert(`成功添加 ${result?.added || documents.length} 个文档块`)
      setDocumentText('')
      setChunks([])
    } catch (error) {
      console.error('Failed to add document:', error)
      alert('添加文档失败')
    } finally {
      setIsAddingDoc(false)
    }
  }, [chunks, addDocuments, knowledgeBase._name])

  // 搜索文档
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await searchDocuments(knowledgeBase._name, searchQuery, 5)
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search documents:', error)
      alert('搜索失败')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, searchDocuments, knowledgeBase._name])

  // 删除知识库
  const handleDelete = useCallback(async () => {
    if (!confirm(`确定要删除知识库 "${knowledgeBase._metadata.name}" 吗?`)) return

    try {
      await deleteKnowledgeBase(knowledgeBase._name)
      alert('删除成功')
      onBack()
    } catch (error) {
      console.error('Failed to delete knowledge base:', error)
      alert('删除知识库失败')
    }
  }, [deleteKnowledgeBase, knowledgeBase, onBack])

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack}>
          ← 返回
        </Button>
        <Flex justify="between" align="center" className="mb-4">
          <Flex direction="column" gap="2">
            <Flex align="center" gap="3">
             
              <h2 className="text-2xl font-semibold dark:text-white">
                {knowledgeBase._metadata.name}
              </h2>
            </Flex>
            {knowledgeBase._metadata.description && (
              <Text color="gray" size="2">
                {knowledgeBase._metadata.description}
              </Text>
            )}
            <Text color="gray" size="1">
              创建时间: {new Date(knowledgeBase._metadata.created).toLocaleString('zh-CN')}
            </Text>
          </Flex>
          <Button variant="soft" color="red" onClick={handleDelete}>
            删除知识库
          </Button>
        </Flex>
      </div>

      {/* 文档操作区域 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 添加文档 */}
        <Card>
          <Flex direction="column" gap="3">
            <Text size="4" weight="bold">
              添加文档
            </Text>

            <Flex gap="2" align="center">
              <label className="flex items-center gap-2">
                <Text size="2">块大小:</Text>
                <TextField.Root
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  style={{ width: '100px' }}
                />
              </label>
              <label className="flex items-center gap-2">
                <Text size="2">重叠:</Text>
                <TextField.Root
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(Number(e.target.value))}
                  style={{ width: '80px' }}
                />
              </label>
            </Flex>

            <TextArea
              placeholder="输入要添加的文本内容..."
              value={documentText}
              onChange={(e) => {
                setDocumentText(e.target.value)
                // 文本变化时清空之前的切割结果
                if (chunks.length > 0) {
                  setChunks([])
                }
              }}
              rows={8}
            />

            <LoadingButton
              onClick={handleSplitText}
              disabled={!documentText.trim()}
              loading={isSplitting}
            >
              切割文本
            </LoadingButton>

            {/* 切割后的文档块预览 */}
            {chunks.length > 0 && (
              <div className="space-y-2">
                <Text size="3" weight="bold">
                  文档块预览 ({chunks.length} 个块)
                </Text>
                <div className="max-h-[300px] space-y-2 overflow-y-auto rounded border border-gray-200 p-3 dark:border-neutral-700">
                  {chunks.map((chunk, index) => (
                    <Card key={index} variant="surface" size="1">
                      <Flex direction="column" gap="1">
                        <Text size="1" weight="bold" color="gray">
                          块 #{index + 1} ({chunk.length} 字符)
                        </Text>
                        <Text size="2" className="whitespace-pre-wrap">
                          {chunk.substring(0, 200)}
                          {chunk.length > 200 && '...'}
                        </Text>
                      </Flex>
                    </Card>
                  ))}
                </div>
                <LoadingButton
                  onClick={handleAddDocument}
                  loading={isAddingDoc}
                  color="green"
                >
                  确认添加 {chunks.length} 个文档块
                </LoadingButton>
              </div>
            )}
          </Flex>
        </Card>

        {/* 搜索文档 */}
        <Card>
          <Flex direction="column" gap="3">
            <Text size="4" weight="bold">
              搜索文档
            </Text>
            <Flex gap="2">
              <TextField.Root
                placeholder="输入搜索关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="flex-1"
              />
              <LoadingButton onClick={handleSearch} loading={isSearching}>
                搜索
              </LoadingButton>
            </Flex>

            {/* 搜索结果 */}
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {searchResults.length === 0 ? (
                <Text color="gray" size="2">
                  {searchQuery ? '暂无搜索结果' : '输入关键词开始搜索'}
                </Text>
              ) : (
                searchResults.map((result, idx) => (
                  <Card key={idx} variant="surface">
                    <Flex direction="column" gap="2">
                      <Flex justify="between" align="center">
                        <Text size="1" weight="bold" color="gray">
                          {`文档 #${result.metadata?.index ?? idx}`}
                        </Text>
                        {result.score && (
                          <Text size="1" color="green" weight="bold">
                            相似度: {(result.score * 100).toFixed(1)}%
                          </Text>
                        )}
                      </Flex>
                      <Text size="2" className="whitespace-pre-wrap">
                        {result.pageContent}
                      </Text>
                    </Flex>
                  </Card>
                ))
              )}
            </div>
          </Flex>
        </Card>
      </div>
    </div>
  )
}
