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
    options?: {
      temperature?: number
      max_tokens?: number
      onStream?: (content: string) => void
    }
  ) => {
    try {
      setLoading({ isLoading: true })
      
      const apiMessages = convertToApiMessages(messages)
      const chatRequest: ChatRequest = {
        messages: apiMessages,
        characterId,
        temperature: options?.temperature,
        max_tokens: options?.max_tokens,
        stream: !!options?.onStream,
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
    options?: {
      temperature?: number
      max_tokens?: number
    }
  ) => {
    return sendMessage(messages, characterId, options)
  }, [sendMessage])

  const sendMessageStreaming = useCallback(async (
    messages: ChatMessage[],
    characterId: string | undefined,
    onStream: (content: string) => void,
    options?: {
      temperature?: number
      max_tokens?: number
    }
  ) => {
    return sendMessage(messages, characterId, { ...options, onStream })
  }, [sendMessage])

  return {
    loading,
    sendMessage: sendMessageNonStreaming,
    sendMessageStreaming,
  }
}