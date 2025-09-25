import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PaperAirplaneIcon, 
  MicrophoneIcon,
  StopIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  UserCircleIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { OpenAIClient, AIResponse } from '../../lib/ai/openai-client';
import { ContextManager, ConversationContext, ChatMessage } from '../../lib/ai/context-manager';
import { TokenOptimizer } from '../../lib/ai/token-optimizer';
import { logInfo, logWarn, logError } from '../../lib/logger';

interface NLIConfig {
  maxTokens: number;
  temperature: number;
  enableVoice: boolean;
  enableAutoComplete: boolean;
  streamResponses: boolean;
  costBudget: number;
}

interface QuerySuggestion {
  text: string;
  category: 'analytics' | 'forecasting' | 'operations' | 'financial';
  icon: React.ComponentType<any>;
  description: string;
}

interface VoiceRecognition {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error?: string;
}

export const NaturalLanguageInterface: React.FC = () => {
  const [currentContext, setCurrentContext] = useState<ConversationContext | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceRecognition>({
    isListening: false,
    transcript: '',
    confidence: 0
  });
  const [config, setConfig] = useState<NLIConfig>({
    maxTokens: 2000,
    temperature: 0.7,
    enableVoice: true,
    enableAutoComplete: true,
    streamResponses: true,
    costBudget: 50.0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  
  // Initialize services
  const openAIClient = useRef(new OpenAIClient({
    apiKey: process.env.VITE_OPENAI_API_KEY || '',
    maxRetries: 3,
    timeout: 30000,
    rateLimitRpm: 60,
    rateLimitTpm: 10000,
    costBudget: config.costBudget
  }));

  const contextManager = useRef(new ContextManager());
  const tokenOptimizer = useRef(new TokenOptimizer());
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize context on mount
  useEffect(() => {
    const context = contextManager.current.createContext(
      `session_${Date.now()}`,
      'demo-user' // In real app, get from auth
    );
    setCurrentContext(context);

    // Add system message
    contextManager.current.addMessage(context.id, {
      role: 'system',
      content: `You are a Manufacturing Intelligence Assistant for Sentia Manufacturing Dashboard. 
        You help with supply chain analytics, demand forecasting, financial analysis, and operational insights.
        Respond concisely and provide actionable insights. When showing data, use specific numbers and timeframes.
        Available capabilities: inventory analysis, supplier performance, cash flow projections, cost breakdowns, demand forecasting.`
    });

    // Initialize voice recognition
    if ('webkitSpeechRecognition' in window && config.enableVoice) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const result = event.results[0];
        setVoiceState(prev => ({
          ...prev,
          transcript: result.transcript,
          confidence: result.confidence
        }));

        if (result.isFinal) {
          setInputText(result.transcript);
          setVoiceState(prev => ({ ...prev, isListening: false }));
        }
      };

      recognition.onerror = (event: any) => {
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          error: event.error
        }));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentContext?.messages.length, streamingResponse]);

  const querySuggestions: QuerySuggestion[] = [
    {
      text: "What's our current inventory turnover ratio?",
      category: 'analytics',
      icon: InformationCircleIcon,
      description: 'Analyze inventory performance metrics'
    },
    {
      text: "Forecast demand for next quarter",
      category: 'forecasting',
      icon: SparklesIcon,
      description: 'Generate predictive analytics'
    },
    {
      text: "Show cash flow projection for next 13 weeks",
      category: 'financial',
      icon: ClockIcon,
      description: 'Financial planning and analysis'
    },
    {
      text: "Which suppliers have the highest risk scores?",
      category: 'operations',
      icon: ExclamationTriangleIcon,
      description: 'Supply chain risk assessment'
    }
  ];

  const sendMessage = useMutation({
    mutationFn: async (message: string): Promise<AIResponse<any>> => {
      if (!currentContext) throw new Error('No active context');

      // Add user message to context
      contextManager.current.addMessage(currentContext.id, {
        role: 'user',
        content: message
      });

      // Get optimized message history for API call
      const messages = contextManager.current.getMessagesInTokenBudget(
        currentContext.id, 
        config.maxTokens - 500 // Reserve tokens for response
      );

      const optimizedPrompt = tokenOptimizer.current.optimizePrompt(
        messages.map(msg => ({ role: msg.role, content: msg.content })),
        config.maxTokens - 500
      );

      logInfo('Sending optimized prompt', {
        originalMessages: messages.length,
        optimizedMessages: optimizedPrompt.messages.length,
        totalTokens: optimizedPrompt.totalTokens
      });

      if (config.streamResponses) {
        return await handleStreamingResponse(optimizedPrompt.messages);
      } else {
        return await openAIClient.current.createChatCompletion(
          optimizedPrompt.messages as any,
          {
            temperature: config.temperature,
            max_tokens: 500
          }
        );
      }
    },
    onSuccess: (response) => {
      if (!currentContext) return;

      if (response.success && response.data && !config.streamResponses) {
        const assistantMessage = response.data.choices[0]?.message?.content || 'No response';
        
        contextManager.current.addMessage(currentContext.id, {
          role: 'assistant',
          content: assistantMessage,
          tokens: response.usage?.completionTokens
        });

        // Update context state
        const updatedContext = contextManager.current.getContext(currentContext.id);
        if (updatedContext) {
          setCurrentContext({ ...updatedContext });
        }
      }

      // Clear input
      setInputText('');
      setStreamingResponse('');
    },
    onError: (error) => {
      logError('Failed to send message', error);
      
      if (currentContext) {
        contextManager.current.addMessage(currentContext.id, {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
        });

        const updatedContext = contextManager.current.getContext(currentContext.id);
        if (updatedContext) {
          setCurrentContext({ ...updatedContext });
        }
      }
    },
    onMutate: () => {
      setIsLoading(true);
      setStreamingResponse('');
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleStreamingResponse = async (messages: any[]): Promise<AIResponse<any>> => {
    try {
      const stream = await openAIClient.current.createStreamingChatCompletion(
        messages,
        {
          temperature: config.temperature,
          max_tokens: 500
        }
      );

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          setStreamingResponse(fullResponse);
        }
      }

      // Add complete response to context
      if (currentContext) {
        contextManager.current.addMessage(currentContext.id, {
          role: 'assistant',
          content: fullResponse
        });

        const updatedContext = contextManager.current.getContext(currentContext.id);
        if (updatedContext) {
          setCurrentContext({ ...updatedContext });
        }
      }

      return {
        success: true,
        data: { choices: [{ message: { content: fullResponse } }] },
        responseTime: 0,
        retryCount: 0
      };

    } catch (error: any) {
      throw error;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      sendMessage.mutate(inputText.trim());
    }
  };

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) return;

    if (voiceState.isListening) {
      recognitionRef.current.stop();
      setVoiceState(prev => ({ ...prev, isListening: false }));
    } else {
      recognitionRef.current.start();
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: true, 
        transcript: '', 
        error: undefined 
      }));
    }
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setInputText(suggestion.text);
    inputRef.current?.focus();
  };

  const exportConversation = () => {
    if (!currentContext) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      sessionId: currentContext.sessionId,
      messages: currentContext.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      metadata: currentContext.metadata
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${currentContext.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMessage = (content: string): string => {
    // Simple formatting for better readability
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      analytics: 'bg-blue-50 text-blue-700 border-blue-200',
      forecasting: 'bg-purple-50 text-purple-700 border-purple-200',
      financial: 'bg-green-50 text-green-700 border-green-200',
      operations: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[category as keyof typeof colors] || colors.analytics;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500">Manufacturing Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportConversation}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Export conversation"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          
          {currentContext && (
            <div className="text-sm text-gray-500">
              {currentContext.messages.filter(m => m.role !== 'system').length} messages
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentContext?.messages.length ? (
          <div className="text-center py-12">
            <SparklesIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to AI Assistant
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Ask questions about your manufacturing data, request forecasts, or get insights about your operations.
            </p>
            
            {/* Query Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {querySuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`p-3 rounded-lg border text-left hover:shadow-md transition-all ${getCategoryColor(suggestion.category)}`}
                >
                  <div className="flex items-start space-x-3">
                    <suggestion.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{suggestion.text}</div>
                      <div className="text-xs opacity-75 mt-1">{suggestion.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {currentContext.messages
              .filter(msg => msg.role !== 'system')
              .map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <CpuChipIcon className="h-4 w-4 mt-1 flex-shrink-0 text-gray-500" />
                      )}
                      {message.role === 'user' && (
                        <UserCircleIcon className="h-4 w-4 mt-1 flex-shrink-0 text-indigo-200" />
                      )}
                      <div className="flex-1">
                        <div 
                          className="text-sm"
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessage(message.content) 
                          }}
                        />
                        <div className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Streaming Response */}
            {streamingResponse && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                  <div className="flex items-start space-x-2">
                    <CpuChipIcon className="h-4 w-4 mt-1 flex-shrink-0 text-gray-500" />
                    <div className="flex-1">
                      <div 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: formatMessage(streamingResponse) 
                        }}
                      />
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Generating...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && !streamingResponse && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI is thinking...</span>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recognition Status */}
      {voiceState.isListening && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-blue-700">
              {voiceState.transcript || 'Listening...'}
            </span>
            {voiceState.confidence > 0 && (
              <span className="text-xs text-blue-500">
                {Math.round(voiceState.confidence * 100)}% confidence
              </span>
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about inventory, forecasts, suppliers, or any manufacturing data..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputText.trim() && !isLoading) {
                    sendMessage.mutate(inputText.trim());
                  }
                }
              }}
              disabled={isLoading}
            />
            
            {config.enableVoice && recognitionRef.current && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`absolute right-3 top-3 p-1 rounded-full ${
                  voiceState.isListening
                    ? 'text-red-600 hover:text-red-700 bg-red-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={voiceState.isListening ? 'Stop listening' : 'Start voice input'}
              >
                {voiceState.isListening ? (
                  <StopIcon className="h-5 w-5" />
                ) : (
                  <MicrophoneIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        {voiceState.error && (
          <div className="mt-2 text-sm text-red-600">
            Voice recognition error: {voiceState.error}
          </div>
        )}
      </form>
    </div>
  );
};