import RoleCard from './RoleCard'
import RoleAddButton from './RoleAddButton'
import HorizontalScroll from '../ui/HorizontalScroll'
import type { RoleItem } from '../../types'

interface RoleListProps {
  roles: RoleItem[]
  selectedId: string
  onSelect: (id: string) => void
  onCreate: (role: RoleItem) => void
}

export default function RoleList({ roles, selectedId, onSelect, onCreate }: RoleListProps) {
  return (
    <HorizontalScroll className="mb-8">
      <RoleAddButton onCreate={onCreate} />
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          selected={selectedId === role.id}
          onClick={() => onSelect(role.id)}
        />
      ))}
    </HorizontalScroll>
  )
} 