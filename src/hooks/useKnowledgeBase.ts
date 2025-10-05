import { useState, useEffect, useCallback } from 'react'
import {
  apiClient,
  type KnowledgeBase,
  type CreateKnowledgeBaseRequest,
  type Document,
  type SearchResult
} from '../services/api'

interface LoadingState {
  isLoading: boolean
  error: string | null
}

export function useKnowledgeBase() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
  })

  // 加载知识库列表
  const loadKnowledgeBases = useCallback(async () => {
    setLoading({ isLoading: true, error: null })
    try {
      const data = await apiClient.getKnowledgeBases()
      setKnowledgeBases(data)
      setLoading({ isLoading: false, error: null })
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      setLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : '加载知识库列表失败',
      })
    }
  }, [])

  // 初始化加载
  useEffect(() => {
    loadKnowledgeBases()
  }, [loadKnowledgeBases])

  // 创建知识库
  const createKnowledgeBase = useCallback(async (data: CreateKnowledgeBaseRequest) => {
    try {
      const newKB = await apiClient.createKnowledgeBase(data)
      await loadKnowledgeBases() // 重新加载列表
      return newKB
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
      throw error
    }
  }, [loadKnowledgeBases])

  // 更新知识库
  const updateKnowledgeBase = useCallback(
    async (collectionName: string, updates: { newName?: string; newDescription?: string }) => {
      try {
        const response = await apiClient.updateKnowledgeBase(collectionName, updates)
        if (response.success) {
          await loadKnowledgeBases() // 重新加载列表
          return response.data
        } else {
          throw new Error(response.error || '更新知识库失败')
        }
      } catch (error) {
        console.error('Failed to update knowledge base:', error)
        throw error
      }
    },
    [loadKnowledgeBases]
  )

  // 删除知识库
  const deleteKnowledgeBase = useCallback(
    async (collectionName: string) => {
      try {
        const response = await apiClient.deleteKnowledgeBase(collectionName)
        if (response.success) {
          await loadKnowledgeBases() // 重新加载列表
        } else {
          throw new Error(response.error || '删除知识库失败')
        }
      } catch (error) {
        console.error('Failed to delete knowledge base:', error)
        throw error
      }
    },
    [loadKnowledgeBases]
  )

  // 添加文档
  const addDocuments = useCallback(async (collectionName: string, documents: Document[]) => {
    try {
      const response = await apiClient.addDocuments(collectionName, documents)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.error || '添加文档失败')
      }
    } catch (error) {
      console.error('Failed to add documents:', error)
      throw error
    }
  }, [])

  // 搜索文档
  const searchDocuments = useCallback(
    async (
      collectionName: string,
      query: string,
      k?: number,
      filter?: Record<string, unknown>
    ): Promise<SearchResult[]> => {
      try {
        const results = await apiClient.searchDocuments(collectionName, query, k, filter)
        return results
      } catch (error) {
        console.error('Failed to search documents:', error)
        throw error
      }
    },
    []
  )

  // 删除文档
  const deleteDocuments = useCallback(async (collectionName: string, ids: string[]) => {
    try {
      const response = await apiClient.deleteDocuments(collectionName, ids)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.error || '删除文档失败')
      }
    } catch (error) {
      console.error('Failed to delete documents:', error)
      throw error
    }
  }, [])

  // 分割文本
  const splitText = useCallback(
    async (text: string, chunkSize?: number, chunkOverlap?: number): Promise<string[]> => {
      try {
        const chunks = await apiClient.splitText(text, chunkSize, chunkOverlap)
        return chunks
      } catch (error) {
        console.error('Failed to split text:', error)
        throw error
      }
    },
    []
  )

  return {
    knowledgeBases,
    loading,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    addDocuments,
    searchDocuments,
    deleteDocuments,
    splitText,
    refresh: loadKnowledgeBases,
  }
}
