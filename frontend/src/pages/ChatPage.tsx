import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { PaperAirplaneIcon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import { useChatStore, type Message } from '../store/chatStore'
import { chat, type AgentType } from '../lib/api'
import clsx from 'clsx'

const agentInfo: Record<string, { name: string; description: string; color: string }> = {
  team: {
    name: 'BirdWatch AI',
    description: 'Your expert birding assistant - ask about identification, behavior, migration, locations, and more',
    color: 'from-forest-500 to-emerald-600',
  },
  identification: {
    name: 'Identification Agent',
    description: 'Bird ID from photos & descriptions',
    color: 'from-emerald-500 to-green-600',
  },
  behavior: {
    name: 'Behavior Interpreter',
    description: 'Understanding bird behaviors',
    color: 'from-blue-500 to-cyan-600',
  },
  location: {
    name: 'Location Scout',
    description: 'Finding birding spots',
    color: 'from-orange-500 to-amber-600',
  },
  journal: {
    name: 'Journal Agent',
    description: 'Logging & tracking sightings',
    color: 'from-purple-500 to-violet-600',
  },
  coach: {
    name: 'Learning Coach',
    description: 'Building birding skills',
    color: 'from-rose-500 to-pink-600',
  },
  community: {
    name: 'Community Connector',
    description: 'Alerts & connections',
    color: 'from-indigo-500 to-blue-600',
  },
  migration: {
    name: 'Migration Trends',
    description: 'Forecasts & timing predictions',
    color: 'from-teal-500 to-cyan-600',
  },
  lifelist: {
    name: 'Life List Coach',
    description: 'Find your next target species & grow your life list',
    color: 'from-amber-500 to-orange-600',
  },
}

export default function ChatPage() {
  const { agentType = 'team' } = useParams<{ agentType: string }>()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const agent = agentInfo[agentType] || agentInfo.team

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chat({
        message: userMessage.content,
        agent_type: agentType as AgentType,
        session_id: sessionId,
      })

      setSessionId(response.session_id)

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        agentName: response.agent_used,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const suggestedPrompts = [
    "What bird has a red head and black wings?",
    "When do hummingbirds migrate south?",
    "What's the best time to see warblers?",
    "What bird should I try to find next?",
    "How can I attract more birds to my yard?",
    "What are some easy birds I might be missing?",
  ]

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${agent.color} text-white px-6 py-5 shadow-lg`}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <ChatBubbleLeftRightIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <p className="text-sm text-white/80">{agent.description}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-8 shadow-xl`}>
                <SparklesIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                How can I help you today?
              </h2>
              <p className="text-gray-500 mb-8 max-w-lg text-lg">
                I can identify birds, explain behaviors, track migrations, find birding spots, and answer any question about our feathered friends.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-left bg-white text-gray-700 px-4 py-3 rounded-xl border border-gray-200 hover:border-forest-400 hover:bg-forest-50 hover:shadow-md transition-all text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={clsx(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-emerald-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                        <SparklesIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={clsx(
                        'rounded-2xl shadow-sm',
                        message.role === 'user'
                          ? 'bg-forest-600 text-white px-5 py-3 max-w-[70%]'
                          : 'bg-white border border-gray-100 px-6 py-4 max-w-[85%]'
                      )}
                    >
                      {message.role === 'assistant' && message.agentName && (
                        <div className="text-xs text-forest-600 font-semibold mb-2 uppercase tracking-wide">
                          {message.agentName}
                        </div>
                      )}
                      <div className={clsx(
                        'prose prose-sm max-w-none',
                        message.role === 'user' 
                          ? 'prose-invert' 
                          : 'prose-gray prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900'
                      )}>
                        <ReactMarkdown
                          components={{
                            // Improved list rendering
                            ul: ({ children }) => (
                              <ul className="list-disc list-outside ml-4 my-3 space-y-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-outside ml-4 my-3 space-y-2">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="pl-1">{children}</li>
                            ),
                            // Better paragraph spacing
                            p: ({ children }) => (
                              <p className="my-2 leading-relaxed">{children}</p>
                            ),
                            // Better heading styles
                            h1: ({ children }) => (
                              <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>
                            ),
                            // Better code blocks
                            code: ({ children, className }) => {
                              const isInline = !className
                              return isInline ? (
                                <code className="bg-gray-100 text-forest-700 px-1.5 py-0.5 rounded text-sm">{children}</code>
                              ) : (
                                <code className={className}>{children}</code>
                              )
                            },
                            // Better blockquotes
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-forest-400 pl-4 my-3 italic text-gray-600">{children}</blockquote>
                            ),
                            // Better bold text
                            strong: ({ children }) => (
                              <strong className="font-semibold">{children}</strong>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-emerald-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-forest-500 rounded-full animate-bounce" />
                      <div className="w-2.5 h-2.5 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2.5 h-2.5 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about birds..."
                rows={1}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                disabled={isLoading}
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={clsx(
                'p-4 rounded-2xl transition-all flex-shrink-0',
                input.trim() && !isLoading
                  ? 'bg-forest-600 hover:bg-forest-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <PaperAirplaneIcon className="w-6 h-6" />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}
