// src/components/ToastManager.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToasts = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(({ id, message }) => (
          <div
            key={id}
            className="bg-black text-green-400 border border-green-500 px-4 py-2 rounded shadow-lg flex items-center space-x-2"
          >
            <span>{message}</span>
            <button
              onClick={() => removeToast(id)}
              className="text-green-300 hover:text-green-500"
            >
              ✖
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
