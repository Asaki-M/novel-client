import RoleCard from './RoleCard'
import RoleAddButton from './RoleAddButton'
import HorizontalScroll from '../ui/HorizontalScroll'
import type { Character } from '../../services/api'

interface RoleListProps {
  characters: Character[]
  selectedId: string
  onSelect: (id: string) => void
  onCreate: (character: Character) => void
}

export default function RoleList({ characters, selectedId, onSelect, onCreate }: RoleListProps) {
  return (
    <HorizontalScroll className="mb-8">
      <RoleAddButton onCreate={onCreate} />
      {characters.map((character) => (
        <RoleCard
          key={character.id}
          character={character}
          selected={selectedId === character.id}
          onClick={() => onSelect(character.id)}
        />
      ))}
    </HorizontalScroll>
  )
} 