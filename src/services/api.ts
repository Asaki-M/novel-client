// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3008'

// API types based on the documentation
export interface Character {
  id: string
  name: string
  avatar?: string | null
  description: string
  systemPrompt: string
  backstoryPrompt?: string
  backstory?: string
  createdAt?: string
  updatedAt?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
}

// New simplified chat request format based on API documentation
export interface ChatRequest {
  sessionId: string
  characterId: string
  message: string
}

// Legacy chat request format for backward compatibility
export interface LegacyChatRequest {
  messages: ChatMessage[]
  characterId?: string
  sessionId?: string
  useMemory?: boolean
  temperature?: number
  max_tokens?: number
  stream?: boolean
  useTools?: boolean
  allowedTools?: string[]
}

export interface ChatResponseData {
  character: Character
  message: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ChatResponse {
  success: boolean
  data: ChatResponseData
  error?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// HTTP client with error handling
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  // Health check
  async checkHealth(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    return this.request('/api/health/db')
  }

  // Character APIs
  async getCharacters(): Promise<ApiResponse<Character[]>> {
    return this.request('/api/characters')
  }

  async getCharacter(id: string): Promise<ApiResponse<Character>> {
    return this.request(`/api/characters/${id}`)
  }

  async createCharacter(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Character>> {
    return this.request('/api/characters', {
      method: 'POST',
      body: JSON.stringify(character),
    })
  }

  async updateCharacter(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Character>> {
    return this.request(`/api/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteCharacter(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/characters/${id}`, {
      method: 'DELETE',
    })
  }

  // Chat API (non-streaming) - Updated to match new API format
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Legacy chat API for backward compatibility
  async chatLegacy(request: LegacyChatRequest): Promise<ChatResponse> {
    // Convert legacy format to new format
    const lastUserMessage = request.messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || ''

    const newRequest: ChatRequest = {
      sessionId: request.sessionId || 'default',
      characterId: request.characterId || '',
      message: lastUserMessage
    }

    return this.chat(newRequest)
  }

  // Chat API (streaming) - Note: streaming may need to be handled differently with new API
  async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.baseURL}/api/agent/chat/stream`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, stream: true }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.body
  }

  // Memory API - 获取会话记忆
  async getMemory(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.request(`/api/memory/${sessionId}`)
  }

  // Memory API - 清空会话记忆
  async clearMemory(sessionId: string): Promise<ApiResponse<{ deleted: number }>> {
    return this.request(`/api/memory/${sessionId}`, {
      method: 'DELETE',
    })
  }
}

// Export the API client instance
export const apiClient = new ApiClient(API_BASE_URL)

// Utility function to handle streaming chat responses
export async function* parseStreamingResponse(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line) continue
        if (line.startsWith('data: ')) {
          const payload = line.slice(6)
          if (payload === '[DONE]') {
            return
          }
          try {
            const data = JSON.parse(payload)
            if (data && typeof data.content === 'string') {
              yield data.content
            } else if (typeof payload === 'string') {
              yield payload
            }
          } catch {
            // 非 JSON，直接输出
            yield payload
          }
        } else {
          // 兼容纯文本 SSE 行
          if (line === '[DONE]') {
            return
          }
          yield line
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}