import { useState, useCallback } from 'react'
import { apiClient, parseStreamingResponse, type ChatRequest, type ChatMessage as ApiChatMessage } from '../services/api'
import type { ChatMessage, LoadingState } from '../types'

export function useChat() {
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false })

  const convertToApiMessages = useCallback((messages: ChatMessage[]): ApiChatMessage[] => {
    return messages.map(msg => ({
      role: msg.sender === 'me' ? 'user' as const : 'assistant' as const,
      content: msg.text,
    }))
  }, [])

  const sendMessage = useCallback(async (
    messages: ChatMessage[],
    characterId?: string,
    sessionId?: string,
    options?: {
      useMemory?: boolean
      temperature?: number
      max_tokens?: number
      useTools?: boolean
      allowedTools?: string[]
      onStream?: (content: string) => void
    }
  ) => {
    try {
      setLoading({ isLoading: true })
      
      const apiMessages = convertToApiMessages(messages)
      
      // 当使用角色卡时自动启用记忆功能
      const shouldUseMemory = characterId ? true : (options?.useMemory ?? false)
      
      const chatRequest: ChatRequest = {
        messages: apiMessages,
        characterId,
        sessionId,
        useMemory: shouldUseMemory,
        temperature: options?.temperature,
        max_tokens: options?.max_tokens,
        stream: !!options?.onStream,
        useTools: options?.useTools,
        allowedTools: options?.allowedTools,
      }

      if (options?.onStream) {
        // Streaming mode
        const stream = await apiClient.chatStream(chatRequest)
        if (!stream) {
          throw new Error('Failed to get stream')
        }

        let fullResponse = ''
        for await (const chunk of parseStreamingResponse(stream)) {
          fullResponse += chunk
          options.onStream(chunk)
        }
        
        setLoading({ isLoading: false })
        return fullResponse
      } else {
        // Non-streaming mode
        const response = await apiClient.chat(chatRequest)
        
        if (response.success && response.data) {
          setLoading({ isLoading: false })
          return response.data.response
        } else {
          throw new Error(response.error || 'Failed to send message')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setLoading({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }, [convertToApiMessages])

  const sendMessageNonStreaming = useCallback(async (
    messages: ChatMessage[],
    characterId?: string,
    sessionId?: string,
    options?: {
      useMemory?: boolean
      temperature?: number
      max_tokens?: number
      useTools?: boolean
      allowedTools?: string[]
    }
  ) => {
    return sendMessage(messages, characterId, sessionId, options)
  }, [sendMessage])

  const sendMessageStreaming = useCallback(async (
    messages: ChatMessage[],
    characterId: string | undefined,
    sessionId: string | undefined,
    onStream: (content: string) => void,
    options?: {
      useMemory?: boolean
      temperature?: number
      max_tokens?: number
      useTools?: boolean
      allowedTools?: string[]
    }
  ) => {
    return sendMessage(messages, characterId, sessionId, { ...options, onStream })
  }, [sendMessage])

  return {
    loading,
    sendMessage: sendMessageNonStreaming,
    sendMessageStreaming,
  }
}