'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  order_id: string | null;
  read: boolean;
  created_at: string;
}

interface Props {
  onOrderClick?: (orderId: string) => void;
}

export default function NotificationBell({ onOrderClick }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch { /* non-critical */ }
  }, []);

  // Mark all read when dropdown opens
  const handleBellClick = useCallback(async () => {
    setOpen(prev => !prev);
    if (!open && unread > 0) {
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      try {
        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      } catch { /* non-critical */ }
    }
  }, [open, unread]);

  // Supabase Realtime subscription
  useEffect(() => {
    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel('crm-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notif = payload.new as Notification;
          setNotifications(prev => [notif, ...prev].slice(0, 20));
          setUnread(prev => prev + 1);

          // Show toast
          setToast({ title: notif.title, body: notif.body });
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Upravo';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[100] max-w-sm w-full bg-[#0E1625] border border-[#C9A84C]/40 rounded-2xl shadow-2xl p-4 flex gap-3 items-start"
          style={{ animation: 'slideInRight 0.3s ease' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-[#C9A84C]">
              <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H14v6.75A2.75 2.75 0 0111.25 13H4.75A2.75 2.75 0 012 10.25V3.5h-.25A.75.75 0 011 2.75z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">{toast.title}</p>
            {toast.body && <p className="text-slate-400 text-xs mt-0.5">{toast.body}</p>}
          </div>
          <button onClick={() => setToast(null)} className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>
      )}

      {/* Bell + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleBellClick}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Notifikacije"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zM16.942 2.271a.75.75 0 00-1.157.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.971 8.971 0 00-1.856-3.826z" />
            <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.94 32.94 0 003.256.508 3.5 3.5 0 006.972 0 32.933 32.933 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zm0 14.5a2 2 0 01-1.95-1.557 33.54 33.54 0 003.9 0A2 2 0 0110 16.5z" clipRule="evenodd" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#C9A84C] text-slate-950 text-[10px] font-bold flex items-center justify-center leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 w-80 bg-[#0E1625] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Notifikacije</span>
              {notifications.length > 0 && (
                <span className="text-slate-500 text-xs">{notifications.length} ukupno</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-600 text-sm">Nema notifikacija</div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.order_id && onOrderClick) {
                        onOrderClick(n.order_id);
                        setOpen(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors flex gap-3 items-start ${n.order_id && onOrderClick ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-slate-700' : 'bg-[#C9A84C]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.read ? 'text-slate-400' : 'text-white font-medium'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{n.body}</p>
                      )}
                      <p className="text-slate-600 text-xs mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
