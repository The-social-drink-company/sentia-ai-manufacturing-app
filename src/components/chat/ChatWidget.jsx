import { useState } from 'react'
import { MessageSquareIcon, SendHorizonalIcon } from 'lucide-react'

const SAMPLE_MESSAGES = [
  { sender: 'assistant', text: 'Hi Dudley, inventory rebalance unlocked $310K working capital today.' },
  { sender: 'user', text: 'Do we have any liquidity risks this week?' },
  { sender: 'assistant', text: 'Low risk. Cash runway projected at 214 days with current assumptions.' }
]

const ChatWidget = () => {
  const [open, setOpen] = useState(false)
  const [messages] = useState(SAMPLE_MESSAGES)

  return (
    <>
      <button
        type="button"
        aria-label="Open AI assistant"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        <MessageSquareIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-28 right-6 z-40 w-80 rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-sm text-slate-100 shadow-2xl backdrop-blur">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Sentia assistant</p>
              <p className="text-sm font-semibold">Operational insights</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200">×</button>
          </header>

          <div className="mb-3 space-y-2 overflow-y-auto pr-1 max-h-64">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-xl px-3 py-2 ${message.sender === 'assistant' ? 'bg-white/5 text-slate-100' : 'bg-sky-500/20 text-sky-100'}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about liquidity, production, ..."
              className="flex-1 rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button type="submit" className="rounded-lg bg-sky-500/90 p-2 text-white shadow hover:bg-sky-500">
              <SendHorizonalIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default ChatWidget
