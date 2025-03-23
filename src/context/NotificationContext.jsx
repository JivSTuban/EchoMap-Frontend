import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Use useCallback to memoize the function to prevent recreating it on each render
  const addNotification = useCallback((message, type = 'info') => {
    // Generate a more unique ID by adding a random suffix
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Set a timeout to remove this specific notification
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  }, []);

  // Cleanup function for any lingering notifications when component unmounts
  useEffect(() => {
    return () => {
      setNotifications([]);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(({ id, message, type }) => (
          <div
            key={id}
            className={`p-4 rounded-lg shadow-lg text-white ${
              type === 'error' ? 'bg-red-500' : 
              type === 'success' ? 'bg-green-500' : 
              'bg-blue-500'
            }`}
          >
            {message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};