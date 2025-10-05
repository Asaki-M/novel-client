import { useState, useCallback } from 'react'
import { apiClient, parseStreamingResponse, extractContentFromStreamData, type ChatRequest } from '../services/api'
import type { ChatMessage, LoadingState } from '../types'

export function useChat() {
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false })

  const sendMessage = useCallback(async (
    messages: ChatMessage[],
    characterId?: string,
    sessionId?: string,
    knowledgeName?: string,
    options?: {
      onStream?: (content: string) => void
      useMemory?: boolean
      temperature?: number
      max_tokens?: number
      useTools?: boolean
      allowedTools?: string[]
    }
  ) => {
    try {
      setLoading({ isLoading: true })

      // Get the last user message for the new API format
      const lastUserMessage = messages
        .filter(msg => msg.sender === 'me')
        .pop()?.text || ''

      if (!characterId || !sessionId) {
        throw new Error('characterId and sessionId are required')
      }

      const chatRequest: ChatRequest = {
        sessionId,
        characterId,
        message: lastUserMessage,
        knowledgeName,
      }

      if (options?.onStream) {
        // Streaming mode
        const stream = await apiClient.chatStream(chatRequest)
        if (!stream) {
          throw new Error('Failed to get stream')
        }

        let fullResponse = ''
        for await (const streamData of parseStreamingResponse(stream)) {
          const content = extractContentFromStreamData(streamData)
          if (content) {
            fullResponse += content
            options.onStream(content)
          }
        }

        setLoading({ isLoading: false })
        return fullResponse
      } else {
        // Non-streaming mode
        const response = await apiClient.chat(chatRequest)

        if (response.success && response.data && typeof response.data.message === 'string') {
          setLoading({ isLoading: false })
          return response.data.message
        } else {
          throw new Error(response.error || 'Invalid response format')
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
  }, [])

  const sendMessageNonStreaming = useCallback(async (
    messages: ChatMessage[],
    characterId?: string,
    sessionId?: string,
    knowledgeName?: string,
  ) => {
    return sendMessage(messages, characterId, sessionId, knowledgeName)
  }, [sendMessage])

  const sendMessageStreaming = useCallback(async (
    messages: ChatMessage[],
    characterId: string | undefined,
    sessionId: string | undefined,
    knowledgeName?: string,
    options?: {
      useMemory?: boolean
      temperature?: number
      max_tokens?: number
      useTools?: boolean
      allowedTools?: string[]
    }
  ) => {
    return sendMessage(messages, characterId, sessionId, knowledgeName, options)
  }, [sendMessage])

  return {
    loading,
    sendMessage: sendMessageNonStreaming,
    sendMessageStreaming,
  }
}