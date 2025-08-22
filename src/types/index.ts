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
} 