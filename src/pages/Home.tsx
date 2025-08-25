import { Card, Flex, Text, Button, TextArea, Avatar } from '@radix-ui/themes'
import { useState, useCallback, useEffect, useMemo } from 'react'
import RoleList from '../components/role/RoleList'
import { useCharacters } from '../hooks/useCharacters'
import { useChat } from '../hooks/useChat'
import { apiClient } from '../services/api'
import type { ChatMessage } from '../types'
import type { Character, ChatMessage as ApiChatMessage } from '../services/api'

export default function Home() {
  const { characters, loading: charactersLoading, createCharacter } = useCharacters()
  const { sendMessage } = useChat()
  
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [input, setInput] = useState('')
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({})
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMemory, setIsLoadingMemory] = useState(false)

  // 本地缓存键名
  const CACHE_KEY = 'nover-selected-character'

  // 从API消息转换为本地消息格式
  const convertApiMessagesToLocal = useCallback((apiMessages: ApiChatMessage[]): ChatMessage[] => {
    return apiMessages.map((msg, index) => ({
      id: `${msg.role}-${Date.now()}-${index}`,
      sender: msg.role === 'user' ? 'me' as const : 'bot' as const,
      text: msg.content,
      // 检查是否为图片占位符或base64图片
      isImage: msg.content.startsWith('data:image') || msg.content.includes('[image_generated'),
    }))
  }, [])

  // 加载会话记忆
  const loadSessionMemory = useCallback(async (sessionId: string) => {
    if (!sessionId || messagesBySession[sessionId]) {
      return // 如果已经加载过就不重复加载
    }

    setIsLoadingMemory(true)
    try {
      const response = await apiClient.getMemory(sessionId)
      if (response.success && response.data) {
        const localMessages = convertApiMessagesToLocal(response.data)
        setMessagesBySession(prev => ({
          ...prev,
          [sessionId]: localMessages,
        }))
      }
    } catch (error) {
      console.error('Failed to load session memory:', error)
      // 如果加载失败，初始化为空数组
      setMessagesBySession(prev => ({
        ...prev,
        [sessionId]: [],
      }))
    } finally {
      setIsLoadingMemory(false)
    }
  }, [messagesBySession, convertApiMessagesToLocal])

  // 保存选中的角色到本地缓存
  const saveSelectedCharacterToCache = useCallback((characterId: string) => {
    try {
      localStorage.setItem(CACHE_KEY, characterId)
    } catch (error) {
      console.error('Failed to save selected character to cache:', error)
    }
  }, [])

  // 从本地缓存恢复选中的角色
  const loadSelectedCharacterFromCache = useCallback(() => {
    try {
      return localStorage.getItem(CACHE_KEY)
    } catch (error) {
      console.error('Failed to load selected character from cache:', error)
      return null
    }
  }, [])

  // Set default selected character when characters load
  useEffect(() => {
    if (characters.length > 0 && !selectedSessionId) {
      // 先尝试从缓存恢复
      const cachedCharacterId = loadSelectedCharacterFromCache()
      
      // 检查缓存的角色是否存在
      const cachedCharacter = cachedCharacterId ? characters.find(c => c.id === cachedCharacterId) : null
      
      if (cachedCharacter) {
        setSelectedSessionId(cachedCharacter.id)
        loadSessionMemory(cachedCharacter.id)
      } else {
        // 如果缓存中没有或角色不存在，选择第一个
        setSelectedSessionId(characters[0].id)
        loadSessionMemory(characters[0].id)
        saveSelectedCharacterToCache(characters[0].id)
      }
    }
  }, [characters, selectedSessionId, loadSelectedCharacterFromCache, loadSessionMemory, saveSelectedCharacterToCache])

  // 处理角色选择变化
  const handleCharacterSelect = useCallback((characterId: string) => {
    setSelectedSessionId(characterId)
    saveSelectedCharacterToCache(characterId)
    loadSessionMemory(characterId)
  }, [saveSelectedCharacterToCache, loadSessionMemory])

  const currentMessages = useMemo(() => messagesBySession[selectedSessionId] ?? [], [messagesBySession, selectedSessionId])
  const currentCharacter = characters.find((c) => c.id === selectedSessionId)

  const handleCreateCharacter = useCallback(async (characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCharacter = await createCharacter(characterData)
      // Initialize with a welcome message
      const welcomeMessage: ChatMessage = {
        id: `${newCharacter.id}-welcome`,
        sender: 'bot',
        text: `你好，我是 ${newCharacter.name}，${newCharacter.description}。很高兴认识你！`,
      }
      
      setMessagesBySession(prev => ({
        ...prev,
        [newCharacter.id]: [welcomeMessage],
      }))
      
      setSelectedSessionId(newCharacter.id)
      saveSelectedCharacterToCache(newCharacter.id)
      return newCharacter
    } catch (error) {
      console.error('Failed to create character:', error)
      throw error
    }
  }, [createCharacter])

  const handleSendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || !currentCharacter || isSending) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'me',
      text,
    }

    const updatedMessages = [...currentMessages, userMessage]
    
    setMessagesBySession(prev => ({
      ...prev,
      [selectedSessionId]: updatedMessages,
    }))
    
    setInput('')
    setIsSending(true)
    
    // 添加loading占位符
    const loadingMessageId = `loading-${Date.now()}`
    const loadingMessage: ChatMessage = {
      id: loadingMessageId,
      sender: 'bot',
      text: '',
      isLoading: true,
    }
    
    setMessagesBySession(prev => ({
      ...prev,
      [selectedSessionId]: [...updatedMessages, loadingMessage],
    }))

    try {
      // 使用实际的API调用
      const response = await sendMessage(updatedMessages, currentCharacter.id, {
        temperature: 0.7,
        max_tokens: 1024,
      })
      
      // 检查响应是否为图片（base64格式）
      const isImage = response.startsWith('data:image')
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response,
        isImage,
      }
      
      // 替换loading消息为实际回复
      setMessagesBySession(prev => ({
        ...prev,
        [selectedSessionId]: [
          ...updatedMessages,
          botMessage
        ],
      }))
    } catch (error) {
      console.error('Failed to send message:', error)
      // 替换loading消息为错误消息
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'bot',
        text: '抱歉，发送消息失败了，请稍后重试。',
      }
      
      setMessagesBySession(prev => ({
        ...prev,
        [selectedSessionId]: [...updatedMessages, errorMessage],
      }))
    } finally {
      setIsSending(false)
    }
  }, [input, currentCharacter, currentMessages, selectedSessionId, isSending, sendMessage])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Show loading state while characters are loading
  if (charactersLoading.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-center text-2xl font-semibold dark:text-white">首页</h1>
        <div className="text-center text-gray-500 dark:text-neutral-400">
          加载角色中...
        </div>
      </div>
    )
  }

  // Show error state if characters failed to load
  if (charactersLoading.error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-center text-2xl font-semibold dark:text-white">首页</h1>
        <div className="text-center text-red-500">
          加载角色失败: {charactersLoading.error}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-semibold dark:text-white">首页</h1>

      <RoleList
        characters={characters}
        selectedId={selectedSessionId}
        onSelect={handleCharacterSelect}
        onCreate={handleCreateCharacter}
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-3 text-center text-xs text-gray-500 dark:text-neutral-400">
          会话ID：{selectedSessionId}
        </div>

        <Card>
          <div className="max-h-[480px] overflow-y-auto space-y-3 p-4">
            {isLoadingMemory ? (
              <div className="text-center text-gray-500 dark:text-neutral-400">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span>加载对话记忆中...</span>
                </div>
              </div>
            ) : currentMessages.length === 0 ? (
              <Text color="gray">此会话暂无消息，开始你的对话吧～</Text>
            ) : (
              currentMessages.map((m) => {
                const isMe = m.sender === 'me'
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <Avatar 
                        fallback={currentCharacter?.avatar || currentCharacter?.name.charAt(0).toUpperCase() || 'B'} 
                        radius="full" 
                        size="2" 
                      />
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-neutral-100'
                      }`}
                    >
                      {m.isLoading ? (
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      ) : m.isImage ? (
                        <div className="max-w-sm">
                          <img 
                            src={m.text} 
                            alt="AI生成的图片" 
                            className="rounded-lg max-w-full h-auto"
                            onError={(e) => {
                              // 图片加载失败时的处理
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const errorDiv = document.createElement('div')
                              errorDiv.textContent = '图片加载失败'
                              errorDiv.className = 'text-red-500 text-sm'
                              target.parentNode?.appendChild(errorDiv)
                            }}
                          />
                        </div>
                      ) : (
                        m.text
                      )}
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
            onKeyDown={handleKeyPress}
            className="flex-1"
            disabled={isSending || !currentCharacter}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isSending || !currentCharacter}
          >
            {isSending ? '发送中...' : '发送'}
          </Button>
        </Flex>
      </div>
    </div>
  )
}