import { useState, useRef } from 'react'
import { MessageSquareIcon, SendHorizonalIcon } from 'lucide-react'
import { AIInferenceService } from '../../services/ai/aiInferenceService.js'

const aiService = new AIInferenceService()

const ChatWidget = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I'm your AI assistant for CapLiquify Platform. I can help you with operational insights, working capital analysis, production metrics, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId] = useState(() => `chat-${Date.now()}`)
  const inputRef = useRef(null)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return

    const userMessage = {
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputText.trim()
    setInputText('')
    setIsLoading(true)

    try {
      // Get dashboard context for AI
      const context = {
        page: 'dashboard',
        timestamp: new Date().toISOString(),
        user: 'manufacturing-operator',
      }

      const response = await aiService.assistantQuery({
        message: currentInput,
        context,
        conversationId,
      })

      const aiMessage = {
        sender: 'assistant',
        text: response.content,
        timestamp: new Date(),
        citations: response.citations,
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('[ChatWidget] AI query failed:', error)
      const errorMessage = {
        sender: 'assistant',
        text: "I'm having trouble connecting to my AI systems right now. Please try again in a moment, or feel free to explore the dashboard features.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open AI assistant"
        onClick={() => setOpen(value => !value)}
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        <MessageSquareIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-28 right-6 z-40 w-80 rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-sm text-slate-100 shadow-2xl backdrop-blur">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">CapLiquify assistant</p>
              <p className="text-sm font-semibold">Operational insights</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
          </header>

          <div className="mb-3 space-y-2 overflow-y-auto pr-1 max-h-64">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-xl px-3 py-2 ${message.sender === 'assistant' ? 'bg-white/5 text-slate-100' : 'bg-sky-500/20 text-sky-100'}`}
              >
                {message.text}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-1 text-xs text-slate-400">
                    Sources: {message.citations.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-xl px-3 py-2 bg-white/5 text-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse w-2 h-2 bg-sky-400 rounded-full"></div>
                  <div
                    className="animate-pulse w-2 h-2 bg-sky-400 rounded-full"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="animate-pulse w-2 h-2 bg-sky-400 rounded-full"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                  <span className="text-xs text-slate-400">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask about liquidity, production, ..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="rounded-lg bg-sky-500/90 p-2 text-white shadow hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendHorizonalIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default ChatWidget
