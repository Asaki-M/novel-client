// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3008'

// API types based on the documentation
export interface Character {
  id: string
  name: string
  avatar?: string | null
  description: string
  systemPrompt: string
  created_at?: string
  updated_at?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
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

export interface ChatResponse {
  success: boolean
  message?: string
  data?: {
    response: string
    character?: Character
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
  }
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

  async createCharacter(character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Character>> {
    return this.request('/api/characters', {
      method: 'POST',
      body: JSON.stringify(character),
    })
  }

  async updateCharacter(id: string, updates: Partial<Omit<Character, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<Character>> {
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

  // Chat API (non-streaming)
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Chat API (streaming)
  async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.baseURL}/api/chat`
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
        if (line.startsWith('data: ')) {
          const payload = line.slice(6)
          if (payload === '[DONE]') {
            return
          }
          try {
            const data = JSON.parse(payload)
            if (data.content) {
              yield data.content
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}