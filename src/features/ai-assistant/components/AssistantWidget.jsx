/**
 * AI Assistant Widget
 * Floating chatbot interface for manufacturing insights
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useAssistantStore } from '../state/assistantStore'

const AssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const { messages, isProcessing, error, addUserMessage, reset } = useAssistantStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!inputValue.trim() || isProcessing) return

    const message = inputValue.trim()
    setInputValue('')

    // Add context about current dashboard state
    const context = {
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }

    await addUserMessage(message, context)
  }

  const quickActions = [
    {
      text: 'Show production metrics',
      icon: '📊',
      action: () => addUserMessage('Show me current production metrics and KPIs'),
    },
    {
      text: 'Analyze working capital',
      icon: '💰',
      action: () =>
        addUserMessage('Analyze our working capital situation and provide recommendations'),
    },
    {
      text: 'Forecast demand trends',
      icon: '📈',
      action: () =>
        addUserMessage('What are the demand trends and forecasts for our key products?'),
    },
  ]

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <SparklesIcon className="w-6 h-6" />
        </button>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5" />
          <h3 className="font-medium">AI Manufacturing Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-blue-700 rounded transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Welcome to AI Insights
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              I can help you analyze production data, forecast trends, and optimize operations.
            </p>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.status === 'error' && (
                <p className="text-xs text-red-400 mt-1">Failed to send</p>
              )}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="font-medium">Sources:</span>
                  {message.citations.map((citation, idx) => (
                    <span key={idx} className="ml-1">
                      {citation.title}
                      {idx < message.citations.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={reset} className="text-xs text-red-500 hover:text-red-600 mt-1">
              Reset conversation
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask about production, forecasts, or analytics..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default AssistantWidget
