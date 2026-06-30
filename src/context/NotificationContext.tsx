import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string, description?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const notify = useCallback((type: NotificationType, message: string, description?: string) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    setNotifications((prev) => [...prev, { id, type, message, description }]);

    // Auto-remove after 5 seconds
    const timeoutId = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      delete timeoutsRef.current[id];
    }, 5000);

    timeoutsRef.current[id] = timeoutId;
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  };

  useEffect(() => {
    return () => {
      // Clean up all active timers on unmount to prevent leaks
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.2 } }}
              className={cn(
                'pointer-events-auto min-w-[320px] max-w-md p-4 rounded-xl border shadow-2xl glass flex items-start gap-3 backdrop-blur-xl',
                n.type === 'success' && 'border-emerald-500/20 bg-emerald-500/5',
                n.type === 'error' && 'border-red-500/20 bg-red-500/5',
                n.type === 'info' && 'border-blue-500/20 bg-blue-500/5',
                n.type === 'warning' && 'border-amber-500/20 bg-amber-500/5',
              )}
            >
              <div
                className={cn(
                  'mt-0.5',
                  n.type === 'success' && 'text-emerald-400',
                  n.type === 'error' && 'text-red-400',
                  n.type === 'info' && 'text-blue-400',
                  n.type === 'warning' && 'text-amber-400',
                )}
              >
                {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {n.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {n.type === 'info' && <Info className="w-5 h-5" />}
                {n.type === 'warning' && <Bell className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight">{n.message}</h4>
                {n.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.description}</p>
                )}
              </div>

              <button
                onClick={() => removeNotification(n.id)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
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
