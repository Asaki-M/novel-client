 // 图片检测函数：支持base64和网络地址
  export const isImageContent = (content: string): boolean => {
    // 检查是否为base64图片
    if (content.startsWith('data:image/')) {
      return true
    }
    
    // 检查是否为网络图片地址
    try {
      const url = new URL(content)
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        // 1. 检查URL是否以常见图片扩展名结尾
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
        const pathname = url.pathname.toLowerCase()
        if (imageExtensions.some(ext => pathname.endsWith(ext))) {
          return true
        }
        
        // 2. 检查是否为已知的图片服务域名
        const imageServiceDomains = [
          'supabase.co',        // Supabase Storage
          'amazonaws.com',      // AWS S3
          'cloudinary.com',     // Cloudinary
          'imgur.com',          // Imgur
          'i.imgur.com',        // Imgur direct
          'githubusercontent.com', // GitHub raw images
          'unsplash.com',       // Unsplash
          'pexels.com',         // Pexels
          'pixabay.com',        // Pixabay
        ]
        
        if (imageServiceDomains.some(domain => url.hostname.includes(domain))) {
          return true
        }
        
        // 3. 检查路径中是否包含图片相关的关键词
        const imagePathKeywords = ['/image/', '/img/', '/photo/', '/pic/', '/avatar/', '/thumb/', 'text_to_image']
        if (imagePathKeywords.some(keyword => pathname.includes(keyword))) {
          return true
        }
      }
    } catch {
      // 如果不是有效的URL，返回false
    }
    
    return false
  }

// 生成随机ID的函数
export const generateRandomId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// 获取或创建用户ID
export const getUserId = (): string => {
  const USER_ID_KEY = 'nover-user-id'
  try {
    let userId = localStorage.getItem(USER_ID_KEY)
    if (!userId) {
      userId = `user_${generateRandomId()}`
      localStorage.setItem(USER_ID_KEY, userId)
    }
    return userId
  } catch (error) {
    console.error('Failed to get user ID:', error)
    // 如果localStorage不可用，生成临时ID
    return `temp_user_${generateRandomId()}`
  }
}

// 获取或创建会话ID（用户ID + 角色ID的组合）
export const getOrCreateSessionId = (characterId: string): string => {
  const userId = getUserId()
  const sessionKey = `nover-session-${userId}-${characterId}`
  
  try {
    let sessionId = localStorage.getItem(sessionKey)
    if (!sessionId) {
      // 创建新的会话ID
      sessionId = `${userId}_${characterId}_${generateRandomId()}`
      localStorage.setItem(sessionKey, sessionId)
    }
    return sessionId
  } catch (error) {
    console.error('Failed to get session ID:', error)
    // 如果localStorage不可用，生成临时会话ID
    return `${userId}_${characterId}_temp_${generateRandomId()}`
  }
}

// 清除指定角色的会话ID（用于重置会话）
export const clearSessionId = (characterId: string): void => {
  const userId = getUserId()
  const sessionKey = `nover-session-${userId}-${characterId}`
  
  try {
    localStorage.removeItem(sessionKey)
  } catch (error) {
    console.error('Failed to clear session ID:', error)
  }
}

// 生成会话ID（保持向后兼容）
export const generateSessionId = (characterId: string): string => {
  return getOrCreateSessionId(characterId)
}