import clsx from 'clsx';
import { Bot, Loader2, Sparkle, User } from 'lucide-react';

import type { AssistantMessage } from '../types';

interface MessageListProps {
  messages: AssistantMessage[];
  isProcessing?: boolean;
}

export function MessageList({ messages, isProcessing }: MessageListProps) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <div key={message.id} className={clsx('flex gap-3', message.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row')}>
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
            {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          <div className={clsx('max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm', message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' : 'bg-white text-gray-900')}>
            <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 space-y-2 text-xs text-blue-600">
                <p className="font-semibold uppercase tracking-wide text-blue-400">Sources</p>
                <ul className="space-y-1">
                  {message.citations.map((citation, __index) => (
                    <li key={index}>
                      {citation.url ? (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-dotted underline-offset-4"
                        >
                          {citation.title}
                        </a>
                      ) : (
                        citation.title
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {message.chartSpec && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="mb-2 font-semibold text-slate-800">Visualization Spec</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(message.chartSpec, null, 2)}</pre>
              </div>
            )}

            {message.status === 'error' && (
              <p className="mt-2 text-xs text-red-500">Unable to complete this request. Please try again.</p>
            )}
          </div>
        </div>
      ))}

      {isProcessing && (
        <div className="flex items-start gap-3 text-gray-600">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
            <Sparkle className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
}
