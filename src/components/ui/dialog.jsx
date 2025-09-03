import React, { createContext, useContext, useState } from 'react'

const DialogContext = createContext()

const Dialog = ({ children, ...props }) => {
  const [open, setOpen] = useState(false)
  
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ asChild, children, ...props }) => {
  const { setOpen } = useContext(DialogContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setOpen(true),
      ...props
    })
  }
  
  return (
    <button onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  )
}

const DialogContent = ({ className = '', children, ...props }) => {
  const { open, setOpen } = useContext(DialogContext)
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => setOpen(false)}
      />
      <div
        className={`relative z-50 w-full max-w-lg bg-white rounded-lg shadow-lg p-6 ${className}`}
        {...props}
      >
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ className = '', ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
)

const DialogTitle = ({ className = '', ...props }) => (
  <h3
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
)

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
}