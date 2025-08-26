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
      }
    } catch {
      // 如果不是有效的URL，返回false
    }
    
    return false
  }