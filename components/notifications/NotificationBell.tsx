"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Calendar, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from "@/lib/actions";
import { formatIST } from "@/lib/timestamps/ist";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

interface NotificationBellProps {
  onSelectProblem?: (problemId: string) => void;
}

export default function NotificationBell({ onSelectProblem }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      // Ensure all fields map correctly
      setNotifications(data as any);
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll notifications every 30 seconds for real-time updates
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    await handleMarkAsRead(notif.id);
    setIsOpen(false);
    
    if (notif.relatedId) {
      if (onSelectProblem) {
        onSelectProblem(notif.relatedId);
      } else {
        router.push(`/dashboard?p=${notif.relatedId}`);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 rounded-full border border-surface text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2.5 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-4 font-sans text-xs space-y-3.5 max-h-[400px] overflow-y-auto"
            >
              <h4 className="font-display font-extrabold text-sm text-foreground pb-2 border-b border-border/80 flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-sans font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </h4>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center font-sans text-xs text-muted py-6">All caught up! No notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer block ${
                        notif.isRead
                          ? "bg-surface border-border/40 text-muted"
                          : "bg-surface-2 border-primary/25 text-foreground hover:bg-surface-2/80"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          notif.isRead ? "bg-muted-foreground/30" : "bg-primary"
                        }`}
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-sans text-[11px] leading-relaxed break-words font-medium">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/75 font-semibold">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{formatIST(notif.createdAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
