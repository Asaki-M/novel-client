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

// 流式响应数据类型
export interface StreamResponseData {
  type: 'thinking' | 'action' | 'observation' | 'final_answer' | 'error'
  content: string
  iteration?: number
  action?: string
  isComplete: boolean
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
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

  // Chat API (streaming) - Updated for new SSE format
  async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.baseURL}/api/agent/chat/stream`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(request),
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

// Utility function to handle streaming chat responses (SSE format)
export async function* parseStreamingResponse(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine === '') continue

        // Handle SSE format: "data: {...}"
        if (trimmedLine.startsWith('data: ')) {
          const dataContent = trimmedLine.slice(6) // Remove "data: " prefix

          // Check for end marker
          if (dataContent === '[DONE]') {
            return
          }

          try {
            const data: StreamResponseData = JSON.parse(dataContent)
            yield data
          } catch (error) {
            console.warn('Failed to parse SSE data:', dataContent, error)
            // Fallback: yield as plain text
            yield dataContent
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// Utility function to extract content from stream data for simple text streaming
export function extractContentFromStreamData(data: StreamResponseData | string): string {
  // Handle fallback string case
  if (typeof data === 'string') {
    return data
  }

  // For final_answer type, return the content directly
  if (data.type === 'final_answer') {
    return data.content
  }

  // For action type, show what action is being performed
  if (data.type === 'action') {
    return `[执行工具: ${data.action || '未知'}]`
  }

  // For observation type, show the result
  if (data.type === 'observation') {
    return data.content
  }

  // For thinking type, optionally show thinking process (or hide it)
  if (data.type === 'thinking') {
    return '' // Don't show thinking process in the chat to reduce noise
  }

  // For error type, show the error
  if (data.type === 'error') {
    return `错误: ${data.content}`
  }

  // Default: return content
  return data.content
}