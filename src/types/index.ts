// Legacy types for backward compatibility
export interface RoleItem {
  id: string
  name: string
  desc: string
  fallback: string
}

export interface ChatMessage {
  id: string
  sender: 'me' | 'bot'
  text: string
  isImage?: boolean
  isLoading?: boolean
}

// API-aligned types
export interface Character {
  id: string
  name: string
  avatar?: string | null
  description: string
  systemPrompt: string
  created_at?: string
  updated_at?: string
}

export interface ApiChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatSession {
  id: string
  characterId?: string
  messages: ChatMessage[]
  lastActivity: string
}

export interface LoadingState {
  isLoading: boolean
  error?: string
}

// Utility function to convert Character to RoleItem for backward compatibility
export function characterToRoleItem(character: Character): RoleItem {
  return {
    id: character.id,
    name: character.name,
    desc: character.description,
    fallback: character.avatar || character.name.charAt(0).toUpperCase(),
  }
}

// Utility function to convert RoleItem to Character
export function roleItemToCharacter(roleItem: RoleItem, systemPrompt: string = ''): Omit<Character, 'id'> {
  return {
    name: roleItem.name,
    avatar: roleItem.fallback,
    description: roleItem.desc,
    systemPrompt,
  }
} 