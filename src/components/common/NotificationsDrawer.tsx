import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, CheckCheck, Trash2, X, Shield, Cpu, HardDrive, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { drawerVariants, overlayVariants, rise, staggerContainer } from '../../motion/tokens';

interface NotificationEntry {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'security' | 'system' | 'storage' | 'info';
}

const INITIAL_NOTIFICATIONS: NotificationEntry[] = [];

export const NotificationsDrawer: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen } = useWorkspace();
  const [notifications, setNotifications] = useState<NotificationEntry[]>(INITIAL_NOTIFICATIONS);

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
    <AnimatePresence>
      {isNotificationsOpen && (
        <motion.div
          className="drawer-overlay"
          onClick={() => setIsNotificationsOpen(false)}
          variants={overlayVariants}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <motion.aside
            className="notifications-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="System Notifications"
            variants={drawerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
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
            <motion.div
              className="notifications-list"
              variants={staggerContainer()}
              initial="hidden"
              animate="show"
            >
              {notifications.map((item) => (
                <motion.div
                  key={item.id}
                  className={`notif-card ${item.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleToggleRead(item.id)}
                  variants={rise}
                  layout="position"
                >
                  <div className="notif-card-header">
                    <div className="notif-card-title-row">
                      {getIcon(item.type)}
                      <span className="notif-card-title">{item.title}</span>
                    </div>
                    <span className="notif-timestamp">{item.timestamp}</span>
                  </div>
                  <p className="notif-card-message">{item.message}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <span className="drawer-footer-text">
            Private Session &middot; Zero Cloud Telemetry
          </span>
        </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
