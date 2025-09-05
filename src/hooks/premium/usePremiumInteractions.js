
import { useState, useEffect } from 'react';

export const usePremiumInteractions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const triggerSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  const triggerError = () => {
    setIsError(true);
    setTimeout(() => setIsError(false), 2000);
  };

  const triggerLoading = (promise) => {
    setIsLoading(true);
    return promise.finally(() => setIsLoading(false));
  };

  return {
    isLoading,
    isSuccess,
    isError,
    triggerSuccess,
    triggerError,
    triggerLoading
  };
};

// Premium notification system
export const usePremiumNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    removeNotification
  };
};
