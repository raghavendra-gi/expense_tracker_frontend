import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: 'i-check',
  error: 'i-alert',
  warn: 'i-alert',
  info: 'i-info',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, kind = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || 4200;

    setToasts((prev) => {
      // De-dupe: if the same message is already showing, don't add it again
      if (prev.some((t) => t.message === message)) return prev;
      return [...prev, { id, message, kind }];
    });

    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="t-icon">
              <svg className="icon"><use href={`#${ICONS[t.kind] || 'i-info'}`} /></svg>
            </span>
            <span className="t-body">{t.message}</span>
            <button
              type="button"
              className="t-close"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
            >
              <svg className="icon"><use href="#i-close" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}