import { Card, Flex, Text, TextArea, Avatar, Switch } from '@radix-ui/themes'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import RoleList from '../components/role/RoleList'
import { LoadingButton } from '../components/ui'
import { useCharacters } from '../hooks/useCharacters'
import { useChat } from '../hooks/useChat'
import { apiClient } from '../services/api'
import type { ChatMessage } from '../types'
import type { Character, ChatMessage as ApiChatMessage } from '../services/api'
import { isImageContent, generateSessionId, clearSessionId } from '../utils'

export default function Home() {
  const { characters, loading: charactersLoading, createCharacter } = useCharacters()
  const { sendMessage, sendMessageStreaming } = useChat()
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [input, setInput] = useState('')
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({})
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMemory, setIsLoadingMemory] = useState(false)
  const [isClearingSession, setIsClearingSession] = useState(false)
  const [useStreamingMode, setUseStreamingMode] = useState(false)
  
  // 聊天容器的ref，用于自动滚动
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 滚动到底部的函数
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }, [])

  // 当消息变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messagesBySession, selectedCharacterId, scrollToBottom])

  // 本地缓存键名
  const CACHE_KEY = 'nover-selected-character'

  // 生成当前会话ID
  const currentSessionId = useMemo(() => {
    if (!selectedCharacterId) return ''
    return generateSessionId(selectedCharacterId)
  }, [selectedCharacterId])

  // 从API消息转换为本地消息格式
  const convertApiMessagesToLocal = useCallback((apiMessages: ApiChatMessage[]): ChatMessage[] => {
    return apiMessages.map((msg, index) => ({
      id: `${msg.role}-${Date.now()}-${index}`,
      sender: msg.role === 'user' ? 'me' as const : 'bot' as const,
      text: msg.content,
      // 检查是否为图片占位符或base64图片
      isImage: isImageContent(msg.content) || msg.content.includes('[image_generated'),
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
        // 加载完成后滚动到底部
        setTimeout(scrollToBottom, 100)
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
  }, [messagesBySession, convertApiMessagesToLocal, scrollToBottom])

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
    if (characters.length > 0 && !selectedCharacterId) {
      // 先尝试从缓存恢复
      const cachedCharacterId = loadSelectedCharacterFromCache()
      
      // 检查缓存的角色是否存在
      const cachedCharacter = cachedCharacterId ? characters.find(c => c.id === cachedCharacterId) : null
      
      if (cachedCharacter) {
        setSelectedCharacterId(cachedCharacter.id)
        const sessionId = generateSessionId(cachedCharacter.id)
        loadSessionMemory(sessionId)
      } else {
        // 如果缓存中没有或角色不存在，选择第一个
        setSelectedCharacterId(characters[0].id)
        const sessionId = generateSessionId(characters[0].id)
        loadSessionMemory(sessionId)
        saveSelectedCharacterToCache(characters[0].id)
      }
    }
  }, [characters, selectedCharacterId, loadSelectedCharacterFromCache, loadSessionMemory, saveSelectedCharacterToCache])

  // 处理角色选择变化
  const handleCharacterSelect = useCallback((characterId: string) => {
    setSelectedCharacterId(characterId)
    saveSelectedCharacterToCache(characterId)
    const sessionId = generateSessionId(characterId)
    loadSessionMemory(sessionId)
  }, [saveSelectedCharacterToCache, loadSessionMemory])

  const currentMessages = useMemo(() => messagesBySession[currentSessionId] ?? [], [messagesBySession, currentSessionId])
  const currentCharacter = characters.find((c) => c.id === selectedCharacterId)

  const handleCreateCharacter = useCallback(async (characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCharacter = await createCharacter(characterData)
      // Initialize with a welcome message
      const welcomeMessage: ChatMessage = {
        id: `${newCharacter.id}-welcome`,
        sender: 'bot',
        text: `你好，我是 ${newCharacter.name}，${newCharacter.description}。很高兴认识你！`,
      }
      
      const sessionId = generateSessionId(newCharacter.id)
      setMessagesBySession(prev => ({
        ...prev,
        [sessionId]: [welcomeMessage],
      }))
      
      setSelectedCharacterId(newCharacter.id)
      saveSelectedCharacterToCache(newCharacter.id)
      return newCharacter
    } catch (error) {
      console.error('Failed to create character:', error)
      throw error
    }
  }, [createCharacter, saveSelectedCharacterToCache])

  // 清除当前会话
  const handleClearCurrentSession = useCallback(async () => {
    if (!selectedCharacterId || isClearingSession) return
    
    setIsClearingSession(true)
    try {
      // 先清除服务器端记忆（使用当前会话ID）
      try {
        await apiClient.clearMemory(currentSessionId)
        console.log('Server memory cleared successfully')
      } catch (error) {
        console.warn('Failed to clear server memory:', error)
        // 即使服务器清除失败，也继续清除本地数据
      }
      
      // 清除本地存储的会话ID
      clearSessionId(selectedCharacterId)
      
      // 生成新的会话ID
      const newSessionId = generateSessionId(selectedCharacterId)
      
      // 清空本地消息记录
      setMessagesBySession(prev => {
        const newState = { ...prev }
        // 删除旧会话的消息
        delete newState[currentSessionId]
        // 初始化新会话为空数组
        newState[newSessionId] = []
        return newState
      })
      
    } catch (error) {
      console.error('Failed to clear session:', error)
    } finally {
      setIsClearingSession(false)
    }
  }, [selectedCharacterId, currentSessionId, isClearingSession])

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
      [currentSessionId]: updatedMessages,
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
      [currentSessionId]: [...updatedMessages, loadingMessage],
    }))

    try {
      if (useStreamingMode) {
        // 流式模式（不支持工具调用）
        let fullResponse = ''
        const botMessageId = `bot-${Date.now()}`
        
        // 创建初始的机器人消息
        const initialBotMessage: ChatMessage = {
          id: botMessageId,
          sender: 'bot',
          text: '',
          isLoading: false,
        }
        
        // 替换loading为初始机器人消息
        setMessagesBySession(prev => ({
          ...prev,
          [currentSessionId]: [...updatedMessages, initialBotMessage],
        }))
        
        await sendMessageStreaming(
          [userMessage], // 只发送当前用户消息，后端会根据sessionId自动拼接历史
          currentCharacter.id,
          currentSessionId,
          (chunk: string) => {
            fullResponse += chunk
            // 实时更新消息内容
            setMessagesBySession(prev => {
              const currentMessages = prev[currentSessionId] || []
              const updatedMessages = currentMessages.map(msg => 
                msg.id === botMessageId 
                  ? { ...msg, text: fullResponse }
                  : msg
              )
              return {
                ...prev,
                [currentSessionId]: updatedMessages,
              }
            })
            // 流式响应过程中也要滚动到底部（非平滑）
            setTimeout(() => scrollToBottom(false), 0)
          },
          {
            temperature: 0.7,
            max_tokens: 1024,
            useTools: false, // 流式模式不支持工具调用
          }
        )
      } else {
        // 非流式模式（支持工具调用）
        const response = await sendMessage([userMessage], currentCharacter.id, currentSessionId, { // 只发送当前用户消息
          temperature: 0.7,
          max_tokens: 1024,
          useTools: true,
          allowedTools: ['generate_illustration'],
        })
        
        // 检查响应是否为图片（base64或网络地址）
        const isImage = isImageContent(response)
        
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response,
          isImage,
        }
        
        // 替换loading消息为实际回复
        setMessagesBySession(prev => ({
          ...prev,
          [currentSessionId]: [
            ...updatedMessages,
            botMessage
          ],
        }))
      }
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
        [currentSessionId]: [...updatedMessages, errorMessage],
      }))
    } finally {
      setIsSending(false)
    }
  }, [input, currentCharacter, currentMessages, currentSessionId, isSending, sendMessage, sendMessageStreaming, useStreamingMode, scrollToBottom])

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
      <RoleList
        characters={characters}
        selectedId={selectedCharacterId}
        onSelect={handleCharacterSelect}
        onCreate={handleCreateCharacter}
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span>会话ID：{currentSessionId}</span>
            {selectedCharacterId && (
              <LoadingButton
                size="1"
                variant="ghost"
                onClick={handleClearCurrentSession}
                loading={isClearingSession}
                className="text-xs"
              >
                清除会话
              </LoadingButton>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Text size="1">流式响应</Text>
            <Switch
              size="1"
              checked={useStreamingMode}
              onCheckedChange={setUseStreamingMode}
            />
            {useStreamingMode && (
              <Text size="1" color="amber">（不支持工具调用）</Text>
            )}
          </div>
        </div>

        <Card>
          <div 
            ref={chatContainerRef}
            className="max-h-[480px] overflow-y-auto space-y-3 p-4"
          >
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
                            loading="lazy"
                            onLoad={(e) => {
                              // 图片加载成功时的处理
                              const target = e.target as HTMLImageElement
                              target.style.opacity = '1'
                            }}
                            onError={(e) => {
                              // 图片加载失败时的处理
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              
                              // 检查是否已经有错误信息
                              const parent = target.parentNode as HTMLElement
                              if (!parent.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div')
                                errorDiv.textContent = '图片加载失败'
                                errorDiv.className = 'error-message text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-4 border-red-500'
                                parent.appendChild(errorDiv)
                              }
                            }}
                            style={{ opacity: '0', transition: 'opacity 0.3s ease-in-out' }}
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
          <LoadingButton
            onClick={handleSendMessage}
            disabled={!input.trim() || !currentCharacter}
            loading={isSending}
          >
            发送
          </LoadingButton>
        </Flex>
      </div>
    </div>
  )
}