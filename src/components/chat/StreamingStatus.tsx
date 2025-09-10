import { Text } from '@radix-ui/themes'
import type { StreamingState } from '../../hooks/useStreamingChat'

interface StreamingStatusProps {
  streamingState: StreamingState
  className?: string
}

export default function StreamingStatus({ streamingState, className = '' }: StreamingStatusProps) {
  if (!streamingState.isStreaming) {
    return null
  }

  return (
    <div className={`p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <Text size="2" weight="medium" className="text-blue-700 dark:text-blue-300">
          Agent 正在工作...
        </Text>
      </div>
      
      {streamingState.currentThinking && (
        <div className="mb-2">
          <Text size="1" className="text-gray-600 dark:text-gray-400 block mb-1">
            💭 思考中:
          </Text>
          <Text size="2" className="text-gray-700 dark:text-gray-300">
            {streamingState.currentThinking}
          </Text>
        </div>
      )}
      
      {streamingState.currentAction && (
        <div className="mb-2">
          <Text size="1" className="text-orange-600 dark:text-orange-400 block mb-1">
            🔧 执行工具:
          </Text>
          <Text size="2" className="text-orange-700 dark:text-orange-300">
            {streamingState.currentAction}
          </Text>
        </div>
      )}
      
      {streamingState.currentObservation && (
        <div className="mb-2">
          <Text size="1" className="text-green-600 dark:text-green-400 block mb-1">
            📋 工具结果:
          </Text>
          <Text size="2" className="text-green-700 dark:text-green-300">
            {streamingState.currentObservation}
          </Text>
        </div>
      )}
      
      {streamingState.error && (
        <div className="mb-2">
          <Text size="1" className="text-red-600 dark:text-red-400 block mb-1">
            ❌ 错误:
          </Text>
          <Text size="2" className="text-red-700 dark:text-red-300">
            {streamingState.error}
          </Text>
        </div>
      )}
    </div>
  )
}
