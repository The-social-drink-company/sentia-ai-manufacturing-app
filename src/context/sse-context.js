import { createContext, useContext } from 'react';

const SSEContext = createContext();

const useSSEContext = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEProvider');
  }
  return context;
};

const useSSEStatus = () => {
  const { isConnected, connectionStats, globalLiveUpdates } = useSSEContext();

  return {
    isConnected,
    isActive: globalLiveUpdates,
    eventsReceived: connectionStats.eventsReceived,
    lastEventTime: connectionStats.lastEventTime,
    uptime: connectionStats.uptime ? Date.now() - connectionStats.uptime : null
  };
};

const useSSEControls = () => {
  const {
    globalLiveUpdates,
    setGlobalLiveUpdates,
    reconnect,
    disconnect
  } = useSSEContext();

  return {
    isEnabled: globalLiveUpdates,
    enable: () => setGlobalLiveUpdates(true),
    disable: () => setGlobalLiveUpdates(false),
    toggle: () => setGlobalLiveUpdates(prev => !prev),
    reconnect,
    disconnect
  };
};

export { SSEContext, useSSEContext, useSSEStatus, useSSEControls };
