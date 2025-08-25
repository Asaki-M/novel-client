import { useState, useEffect, useCallback } from 'react'
import { apiClient, type Character } from '../services/api'
import type { LoadingState } from '../types'

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true })

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading({ isLoading: true })
      const response = await apiClient.getCharacters()
      
      if (response.success && response.data) {
        setCharacters(response.data)
        setLoading({ isLoading: false })
      } else {
        throw new Error(response.error || 'Failed to fetch characters')
      }
    } catch (error) {
      console.error('Error fetching characters:', error)
      setLoading({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }, [])

  const createCharacter = useCallback(async (characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiClient.createCharacter(characterData)
      
      if (response.success && response.data) {
        setCharacters(prev => [response.data!, ...prev])
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create character')
      }
    } catch (error) {
      console.error('Error creating character:', error)
      throw error
    }
  }, [])

  const updateCharacter = useCallback(async (id: string, updates: Partial<Omit<Character, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const response = await apiClient.updateCharacter(id, updates)
      
      if (response.success && response.data) {
        setCharacters(prev => prev.map(char => 
          char.id === id ? response.data! : char
        ))
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update character')
      }
    } catch (error) {
      console.error('Error updating character:', error)
      throw error
    }
  }, [])

  const deleteCharacter = useCallback(async (id: string) => {
    try {
      const response = await apiClient.deleteCharacter(id)
      
      if (response.success) {
        setCharacters(prev => prev.filter(char => char.id !== id))
      } else {
        throw new Error(response.error || 'Failed to delete character')
      }
    } catch (error) {
      console.error('Error deleting character:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  return {
    characters,
    loading,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refetch: fetchCharacters,
  }
}