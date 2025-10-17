import React, { useState } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message:
        "Hello! I'm your Sentia Manufacturing AI assistant. How can I help you with your working capital analysis today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')

  const quickSuggestions = [
    'Analyze my cash flow',
    'Show working capital trends',
    'Calculate funding needs',
    'Industry benchmarks',
  ]

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      message: inputMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInputMessage('')

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        message:
          "I understand you're asking about working capital analysis. Let me help you with that. Based on your current data, I can see several optimization opportunities...",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botResponse])
    }, 1000)
  }

  const handleSuggestionClick = suggestion => {
    setInputMessage(suggestion)
  }

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 z-40">
          <Card className="h-full flex flex-col shadow-xl">
            <CardHeader className="bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Bot className="h-4 w-4" />
                <span>Sentia AI Assistant</span>
              </CardTitle>
              <p className="text-xs text-blue-100">Working Capital Intelligence</p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Suggestions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                  <div className="space-y-1">
                    {quickSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded text-gray-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your working capital..."
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default ChatBot
