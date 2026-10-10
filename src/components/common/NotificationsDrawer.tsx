import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, X, Shield, Cpu, HardDrive, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface NotificationEntry {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'security' | 'system' | 'storage' | 'info';
}

const INITIAL_NOTIFICATIONS: NotificationEntry[] = [
  {
    id: 'notif-1',
    title: 'Zero-Cloud Private Mode Active',
    message: 'Local memory session initialized with AES-256 client encryption. No external telemetry active.',
    timestamp: 'Just now',
    isRead: false,
    type: 'security',
  },
  {
    id: 'notif-2',
    title: 'Task Engine in Standby Mode',
    message: 'Local execution engine is standing by for orchestration workflows.',
    timestamp: '12m ago',
    isRead: false,
    type: 'system',
  },
  {
    id: 'notif-3',
    title: 'Client Storage Verified',
    message: 'IndexedDB & localStorage allocations validated. Ready for persistent local projects.',
    timestamp: '1h ago',
    isRead: true,
    type: 'storage',
  },
  {
    id: 'notif-4',
    title: 'Model Endpoints Configuration',
    message: 'Configure your preferred API keys in Settings > Connected Services to activate real-time generation.',
    timestamp: '2h ago',
    isRead: true,
    type: 'info',
  },
];

export const NotificationsDrawer: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen } = useWorkspace();
  const [notifications, setNotifications] = useState<NotificationEntry[]>(INITIAL_NOTIFICATIONS);

  if (!isNotificationsOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const getIcon = (type: NotificationEntry['type']) => {
    switch (type) {
      case 'security':
        return <Shield size={14} className="notif-type-icon security" />;
      case 'system':
        return <Cpu size={14} className="notif-type-icon system" />;
      case 'storage':
        return <HardDrive size={14} className="notif-type-icon storage" />;
      case 'info':
      default:
        return <Info size={14} className="notif-type-icon info" />;
    }
  };

  return (
    <div className="drawer-overlay" onClick={() => setIsNotificationsOpen(false)}>
      <aside
        className="notifications-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="System Notifications"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <Bell size={16} className="drawer-header-icon" />
            <h2 className="drawer-heading">Notifications</h2>
            {unreadCount > 0 && <span className="drawer-count-badge">{unreadCount}</span>}
          </div>

          <div className="drawer-header-actions">
            {notifications.length > 0 && (
              <>
                <button
                  type="button"
                  className="drawer-action-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  disabled={unreadCount === 0}
                >
                  <CheckCheck size={14} />
                </button>
                <button
                  type="button"
                  className="drawer-action-btn"
                  onClick={handleClearAll}
                  title="Clear all notifications"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setIsNotificationsOpen(false)}
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="drawer-content">
          {notifications.length === 0 ? (
            <div className="drawer-empty-state">
              <Bell size={32} className="empty-bell-icon" />
              <p>No new notifications</p>
              <span>System telemetry and security events will appear here</span>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notif-card ${item.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleToggleRead(item.id)}
                >
                  <div className="notif-card-header">
                    <div className="notif-card-title-row">
                      {getIcon(item.type)}
                      <span className="notif-card-title">{item.title}</span>
                    </div>
                    <span className="notif-timestamp">{item.timestamp}</span>
                  </div>
                  <p className="notif-card-message">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <span className="drawer-footer-text">
            Private Session &middot; Zero Cloud Telemetry
          </span>
        </div>
      </aside>
    </div>
  );
};
