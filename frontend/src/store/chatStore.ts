import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentType } from '../lib/api'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentType?: AgentType
  agentName?: string
}

export interface ChatSession {
  id: string
  messages: Message[]
  agentType: AgentType
  createdAt: Date
  updatedAt: Date
}

interface ChatState {
  sessions: Record<string, ChatSession>
  activeSessionId: string | null
  isLoading: boolean
  
  // Actions
  createSession: (agentType: AgentType) => string
  setActiveSession: (sessionId: string | null) => void
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  updateLastMessage: (sessionId: string, content: string) => void
  setLoading: (loading: boolean) => void
  clearSession: (sessionId: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeSessionId: null,
      isLoading: false,

      createSession: (agentType: AgentType) => {
        const id = crypto.randomUUID()
        const now = new Date()
        
        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: {
              id,
              messages: [],
              agentType,
              createdAt: now,
              updatedAt: now,
            },
          },
          activeSessionId: id,
        }))
        
        return id
      },

      setActiveSession: (sessionId) => {
        set({ activeSessionId: sessionId })
      },

      addMessage: (sessionId, message) => {
        const id = crypto.randomUUID()
        
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state
          
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: [
                  ...session.messages,
                  { ...message, id, timestamp: new Date() },
                ],
                updatedAt: new Date(),
              },
            },
          }
        })
      },

      updateLastMessage: (sessionId, content) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session || session.messages.length === 0) return state
          
          const messages = [...session.messages]
          const lastMessage = messages[messages.length - 1]
          messages[messages.length - 1] = { ...lastMessage, content }
          
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages,
                updatedAt: new Date(),
              },
            },
          }
        })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      clearSession: (sessionId) => {
        set((state) => {
          const { [sessionId]: _, ...rest } = state.sessions
          return {
            sessions: rest,
            activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
          }
        })
      },
    }),
    {
      name: 'birdwatch-chat-storage',
      partialize: (state) => ({
        sessions: state.sessions,
      }),
    }
  )
)
