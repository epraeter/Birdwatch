import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LifeListEntry {
  id: string
  species: string
  dateAdded: string  // ISO date string
  location?: string
  notes?: string
  count?: number
  behavior?: string
  habitat?: string
}

export interface LifeListStats {
  totalSpecies: number
  thisYear: number
  thisMonth: number
  recentAdditions: LifeListEntry[]
}

interface LifeListState {
  entries: LifeListEntry[]
  
  // Actions
  addEntry: (entry: Omit<LifeListEntry, 'id' | 'dateAdded'>) => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, updates: Partial<LifeListEntry>) => void
  hasSpecies: (species: string) => boolean
  getStats: () => LifeListStats
  clearAll: () => void
  importEntries: (entries: Omit<LifeListEntry, 'id'>[]) => void
}

export const useLifeListStore = create<LifeListState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const species = entry.species.trim()
        
        // Check if species already exists (case-insensitive)
        const exists = get().entries.some(
          e => e.species.toLowerCase() === species.toLowerCase()
        )
        
        if (exists) {
          console.warn(`${species} is already on your life list`)
          return
        }

        const newEntry: LifeListEntry = {
          id: crypto.randomUUID(),
          species,
          dateAdded: new Date().toISOString(),
          location: entry.location,
          notes: entry.notes,
          count: entry.count,
          behavior: entry.behavior,
          habitat: entry.habitat,
        }

        set((state) => ({
          entries: [newEntry, ...state.entries],
        }))
      },

      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }))
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }))
      },

      hasSpecies: (species) => {
        return get().entries.some(
          e => e.species.toLowerCase() === species.trim().toLowerCase()
        )
      },

      getStats: () => {
        const entries = get().entries
        const now = new Date()
        const thisYear = now.getFullYear()
        const thisMonth = now.getMonth()

        const thisYearEntries = entries.filter((e) => {
          const date = new Date(e.dateAdded)
          return date.getFullYear() === thisYear
        })

        const thisMonthEntries = entries.filter((e) => {
          const date = new Date(e.dateAdded)
          return date.getFullYear() === thisYear && date.getMonth() === thisMonth
        })

        // Get 5 most recent additions
        const recentAdditions = [...entries]
          .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
          .slice(0, 5)

        return {
          totalSpecies: entries.length,
          thisYear: thisYearEntries.length,
          thisMonth: thisMonthEntries.length,
          recentAdditions,
        }
      },

      clearAll: () => {
        set({ entries: [] })
      },

      importEntries: (newEntries) => {
        const existingSpecies = new Set(
          get().entries.map(e => e.species.toLowerCase())
        )

        const entriesToAdd = newEntries
          .filter(e => !existingSpecies.has(e.species.toLowerCase()))
          .map(e => ({
            ...e,
            id: crypto.randomUUID(),
          }))

        set((state) => ({
          entries: [...entriesToAdd, ...state.entries],
        }))
      },
    }),
    {
      name: 'birdwatch-lifelist-storage',
    }
  )
)
