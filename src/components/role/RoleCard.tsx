import { Card, Flex, Text, Avatar, Button } from '@radix-ui/themes'
import type { RoleItem } from '../../types'

interface RoleCardProps {
  role: RoleItem
  selected: boolean
  onClick: () => void
}

export default function RoleCard({ role, selected, onClick }: RoleCardProps) {
  return (
    <div className="w-64 shrink-0">
      <Card
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        tabIndex={0}
        role="button"
        className={
          'h-full cursor-pointer rounded-lg border outline-none transition focus:ring-2 focus:ring-indigo-600 ' +
          (selected
            ? 'border-indigo-600 ring-2 ring-indigo-600'
            : 'border-gray-200 hover:border-indigo-300 dark:border-neutral-800 dark:hover:border-indigo-500')
        }
      >
        <Flex direction="column" gap="3">
          <div className="flex items-center gap-2">
            <Avatar fallback={role.fallback} radius="full" size="2" />
            <Text as="p" size="3" weight="medium">
              {role.name}
            </Text>
          </div>
          <Text as="p" color="gray" size="2">
            简介：{role.desc}
          </Text>
          <Button variant={selected ? 'solid' : 'soft'}>{selected ? '当前' : '切换'}</Button>
        </Flex>
      </Card>
    </div>
  )
} 