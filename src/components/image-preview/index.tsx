import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Dialog'
import { Button, IconButton } from '@radix-ui/themes'
import { DownloadIcon, Cross2Icon, ZoomInIcon, ZoomOutIcon, ResetIcon } from '@radix-ui/react-icons'
import DownloadSvg from '../../assets/icons/DownloadSvg'

export interface ImagePreviewProps {
  /** 图片源地址 */
  src: string
  /** 图片替代文本 */
  alt?: string
  /** 预览触发器的类名 */
  className?: string
  /** 缩略图的最大宽度 */
  maxWidth?: string
  /** 是否显示下载按钮 */
  showDownload?: boolean
  /** 下载的文件名（不包含扩展名） */
  downloadFilename?: string
  /** 图片加载失败时的回调 */
  onError?: () => void
  /** 图片加载成功时的回调 */
  onLoad?: () => void
}

export function ImagePreview({
  src,
  alt = "图片预览",
  className = "",
  maxWidth = "300px",
  showDownload = true,
  downloadFilename = "image",
  onError,
  onLoad
}: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)

  // 重置缩放和位置
  const resetTransform = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // 缩放功能
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 5))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.5, 0.5))
  }

  // 下载图片
  const downloadImage = async () => {
    try {
      // 如果是base64图片，直接下载
      if (src.startsWith('data:image/')) {
        const link = document.createElement('a')
        link.href = src
        link.download = `${downloadFilename}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // 如果是网络图片，先获取图片数据
      const response = await fetch(src)
      if (!response.ok) {
        throw new Error('图片下载失败')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      // 从响应头或URL中获取文件扩展名
      const contentType = response.headers.get('content-type') || ''
      let extension = 'png' // 默认扩展名
      
      if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        extension = 'jpg'
      } else if (contentType.includes('png')) {
        extension = 'png'
      } else if (contentType.includes('gif')) {
        extension = 'gif'
      } else if (contentType.includes('webp')) {
        extension = 'webp'
      } else if (contentType.includes('svg')) {
        extension = 'svg'
      }

      const link = document.createElement('a')
      link.href = url
      link.download = `${downloadFilename}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理临时URL
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载图片失败:', error)
      alert('图片下载失败，请稍后重试')
    }
  }

  // 处理下载点击（阻止事件冒泡避免打开模态框）
  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    await downloadImage()
  }

  // 鼠标拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.5, Math.min(5, prev * delta)))
  }

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case '+':
        case '=':
          e.preventDefault()
          zoomIn()
          break
        case '-':
          e.preventDefault()
          zoomOut()
          break
        case '0':
          e.preventDefault()
          resetTransform()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      resetTransform()
      setIsLoading(true)
      setHasError(false)
    }
  }, [isOpen])

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  const thumbnailImage = (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={src}
        alt={alt}
        className={`rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        style={{ maxWidth }}
        loading="lazy"
        onClick={() => setIsOpen(true)}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* Hover download button at bottom */}
      {showDownload && isHovered && !hasError && (
        <div className="absolute bottom-0 right-0">
          <button
            onClick={handleDownloadClick}
            className="bg-black/50 hover:bg-black/70 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 text-white"
            title="下载图片"
          >
            <DownloadSvg />
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {hasError ? (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-4 border-red-500">
          图片加载失败
        </div>
      ) : (
        thumbnailImage
      )}

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={<div style={{ display: 'none' }} />}
        maxWidth="90vw"
      >
        <div className="relative">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex items-center gap-2">
              <IconButton
                variant="ghost"
                size="2"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                title="缩小 (-)"
              >
                <ZoomOutIcon />
              </IconButton>
              
              <span className="text-sm font-mono min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <IconButton
                variant="ghost"
                size="2"
                onClick={zoomIn}
                disabled={scale >= 5}
                title="放大 (+)"
              >
                <ZoomInIcon />
              </IconButton>
              
              <IconButton
                variant="ghost"
                size="2"
                onClick={resetTransform}
                title="重置 (0)"
              >
                <ResetIcon />
              </IconButton>
            </div>

            <div className="flex items-center gap-2">
              {showDownload && (
                <Button
                  variant="soft"
                  size="2"
                  onClick={downloadImage}
                  disabled={hasError}
                >
                  <DownloadIcon />
                  下载
                </Button>
              )}
              
              <IconButton
                variant="ghost"
                size="2"
                onClick={() => setIsOpen(false)}
                title="关闭 (ESC)"
              >
                <Cross2Icon />
              </IconButton>
            </div>
          </div>

          {/* 图片容器 */}
          <div 
            className="relative overflow-hidden bg-gray-100 dark:bg-neutral-900 rounded-lg"
            style={{ 
              height: '70vh',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span>加载中...</span>
                </div>
              </div>
            )}

            {hasError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-500 text-center">
                  <p className="text-lg mb-2">图片加载失败</p>
                  <p className="text-sm opacity-75">请检查网络连接或图片地址</p>
                </div>
              </div>
            ) : (
              <img
                ref={imageRef}
                src={src}
                alt={alt}
                className="max-w-none transition-transform duration-150"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center',
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                  opacity: isLoading ? 0 : 1
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            )}
          </div>

          {/* 底部提示 */}
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-neutral-400">
            <p>快捷键: +/- 缩放 | 0 重置 | ESC 关闭 | 鼠标滚轮缩放 | {scale > 1 ? '拖拽移动' : ''}</p>
          </div>
        </div>
      </Modal>
    </>
  )
}