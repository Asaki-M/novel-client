import { useState, useCallback } from 'react'
import { apiClient, parseStreamingResponse, type ChatRequest, type StreamResponseData } from '../services/api'
import type { ChatMessage, LoadingState } from '../types'

export interface StreamingState {
  isStreaming: boolean
  currentThinking?: string
  currentAction?: string
  currentObservation?: string
  finalAnswer?: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StreamingCallbacks {
  onThinking?: (content: string) => void
  onAction?: (action: string, content: string) => void
  onObservation?: (content: string) => void
  onFinalAnswer?: (content: string) => void
  onError?: (error: string) => void
  onComplete?: (finalAnswer: string, usage?: StreamingState['usage']) => void
}

export function useStreamingChat() {
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false })
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false
  })

  const sendStreamingMessage = useCallback(async (
    messages: ChatMessage[],
    characterId?: string,
    sessionId?: string,
    callbacks?: StreamingCallbacks
  ) => {
    try {
      setLoading({ isLoading: true })
      setStreamingState({ isStreaming: true })

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
      }

      const stream = await apiClient.chatStream(chatRequest)
      if (!stream) {
        throw new Error('Failed to get stream')
      }

      let finalAnswer = ''
      let usage: StreamingState['usage'] | undefined

      for await (const streamData of parseStreamingResponse(stream)) {
        if (typeof streamData === 'string') {
          // Fallback for plain text
          finalAnswer += streamData
          callbacks?.onFinalAnswer?.(streamData)
          continue
        }

        const data = streamData as StreamResponseData

        switch (data.type) {
          case 'thinking':
            setStreamingState(prev => ({ ...prev, currentThinking: data.content }))
            callbacks?.onThinking?.(data.content)
            break

          case 'action':
            setStreamingState(prev => ({ ...prev, currentAction: data.content }))
            callbacks?.onAction?.(data.action || '', data.content)
            break

          case 'observation':
            setStreamingState(prev => ({ ...prev, currentObservation: data.content }))
            callbacks?.onObservation?.(data.content)
            break

          case 'final_answer':
            finalAnswer = data.content
            usage = data.usage
            setStreamingState(prev => ({ 
              ...prev, 
              finalAnswer: data.content,
              usage: data.usage
            }))
            callbacks?.onFinalAnswer?.(data.content)
            break

          case 'error':
            // eslint-disable-next-line
            const errorMessage = data.content
            setStreamingState(prev => ({ 
              ...prev, 
              error: errorMessage,
              usage: data.usage
            }))
            callbacks?.onError?.(errorMessage)
            throw new Error(errorMessage)
        }
      }

      setStreamingState(prev => ({ ...prev, isStreaming: false }))
      setLoading({ isLoading: false })
      
      callbacks?.onComplete?.(finalAnswer, usage)
      return finalAnswer

    } catch (error) {
      console.error('Error in streaming chat:', error)
      setStreamingState(prev => ({ 
        ...prev, 
        isStreaming: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      setLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }, [])

  const resetStreamingState = useCallback(() => {
    setStreamingState({ isStreaming: false })
  }, [])

  return {
    loading,
    streamingState,
    sendStreamingMessage,
    resetStreamingState,
  }
}
