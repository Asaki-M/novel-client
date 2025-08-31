import { isSupabaseImageUrl, extractSupabaseImageUrl, isImageContent } from '../index'

describe('Image Detection Utils', () => {
  describe('isSupabaseImageUrl', () => {
    it('should detect valid Supabase image URLs', () => {
      const validUrls = [
        'https://qzscuzndpxdygetaacsf.supabase.co/storage/v1/object/public/text_to_image/sessions/session-123/image.png',
        'https://example.supabase.co/storage/v1/object/public/image/test.jpg',
        'https://test.supabase.co/storage/v1/object/public/text_to_image/photo.webp'
      ]

      validUrls.forEach(url => {
        expect(isSupabaseImageUrl(url)).toBe(true)
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/image.png',
        'https://supabase.co/docs',
        'not a url',
        'https://qzscuzndpxdygetaacsf.supabase.co/api/test',
        ''
      ]

      invalidUrls.forEach(url => {
        expect(isSupabaseImageUrl(url)).toBe(false)
      })
    })
  })

  describe('extractSupabaseImageUrl', () => {
    it('should extract Supabase image URL from text', () => {
      const textWithUrl = `我已经为您生成了一张图片！

🖼️ 图片链接：https://qzscuzndpxdygetaacsf.supabase.co/storage/v1/object/public/text_to_image/sessions/session-uuid/1234567890-uuid.png
📝 生成提示词：帮我生成一张古风美女的图片`

      const extractedUrl = extractSupabaseImageUrl(textWithUrl)
      expect(extractedUrl).toBe('https://qzscuzndpxdygetaacsf.supabase.co/storage/v1/object/public/text_to_image/sessions/session-uuid/1234567890-uuid.png')
    })

    it('should return null when no Supabase URL found', () => {
      const textWithoutUrl = 'This is just regular text without any image URLs.'
      expect(extractSupabaseImageUrl(textWithoutUrl)).toBeNull()
    })

    it('should extract the first URL when multiple URLs exist', () => {
      const textWithMultipleUrls = `First: https://test.supabase.co/storage/v1/object/public/text_to_image/first.png
Second: https://test.supabase.co/storage/v1/object/public/text_to_image/second.jpg`

      const extractedUrl = extractSupabaseImageUrl(textWithMultipleUrls)
      expect(extractedUrl).toBe('https://test.supabase.co/storage/v1/object/public/text_to_image/first.png')
    })
  })

  describe('isImageContent', () => {
    it('should detect Supabase image URLs', () => {
      const supabaseUrl = 'https://qzscuzndpxdygetaacsf.supabase.co/storage/v1/object/public/text_to_image/test.png'
      expect(isImageContent(supabaseUrl)).toBe(true)
    })

    it('should detect base64 images', () => {
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      expect(isImageContent(base64Image)).toBe(true)
    })

    it('should detect regular image URLs', () => {
      const imageUrl = 'https://example.com/image.jpg'
      expect(isImageContent(imageUrl)).toBe(true)
    })

    it('should reject non-image content', () => {
      const textContent = 'This is just regular text content.'
      expect(isImageContent(textContent)).toBe(false)
    })
  })
})
