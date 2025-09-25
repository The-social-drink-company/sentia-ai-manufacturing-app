import React, { createContext, useContext, useState, useEffect } from 'react';
import CommandPalette from './CommandPalette';

const CommandPaletteContext = createContext(null);

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};

export const CommandPaletteProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commandHistory, setCommandHistory] = useState(() => {
    const saved = localStorage.getItem('sentia-command-history');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Open command palette
  const openCommandPalette = () => {
    setIsOpen(true);
  };
  
  // Close command palette
  const closeCommandPalette = () => {
    setIsOpen(false);
  };
  
  // Toggle command palette
  const toggleCommandPalette = () => {
    setIsOpen(prev => !prev);
  };
  
  // Add command to history
  const addToHistory = (command) => {
    const newHistory = [
      {
        ...command,
        executedAt: Date.now(),
        id: `${command.id}-${Date.now()}`
      },
      ...commandHistory.filter(cmd => cmd.id !== command.id)
    ].slice(0, 50); // Keep last 50 commands
    
    setCommandHistory(newHistory);
    localStorage.setItem('sentia-command-history', JSON.stringify(newHistory));
  };
  
  // Listen for global events to open command palette
  useEffect(() => {
    const handleOpenCommand = () => {
      openCommandPalette();
    };
    
    const handleCommandExecuted = (event) => {
      addToHistory(event.detail.command);
    };
    
    window.addEventListener('sentia-open-command-palette', handleOpenCommand);
    window.addEventListener('sentia-command-executed', handleCommandExecuted);
    
    return () => {
      window.removeEventListener('sentia-open-command-palette', handleOpenCommand);
      window.removeEventListener('sentia-command-executed', handleCommandExecuted);
    };
  }, [commandHistory]);
  
  const contextValue = {
    isOpen,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
    commandHistory
  };
  
  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      <CommandPalette 
        isOpen={isOpen}
        onClose={closeCommandPalette}
      />
    </CommandPaletteContext.Provider>
  );
};

export default CommandPaletteProvider;
