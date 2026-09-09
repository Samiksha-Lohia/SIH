import React, { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../student.api.js';

export function NotificationsView({ onUnreadCountChanged }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, count] = await Promise.all([
        studentApi.listNotifications({ page, limit: 15 }),
        studentApi.getUnreadCount(),
      ]);
      setNotifications(listRes.notifications);
      setMeta(listRes.meta);
      setUnreadCount(count);
      if (onUnreadCountChanged) onUnreadCountChanged(count);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [page, onUnreadCountChanged]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await studentApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      if (onUnreadCountChanged) onUnreadCountChanged(newCount);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await studentApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      if (onUnreadCountChanged) onUnreadCountChanged(0);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    try {
      await studentApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return isoString;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'new_matching_opportunity':
        return '⚡';
      case 'application_status_change':
        return '📑';
      case 'assessment_reminder':
        return '📝';
      case 'training_recommendation':
        return '🎓';
      case 'mentorship_request':
        return '🤝';
      default:
        return '🔔';
    }
  };

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.read)
    : notifications;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 style={{ margin: 0 }}>Notification Feed & Alert Stream</h3>
            {unreadCount > 0 && (
              <span className="badge badge-burgundy" style={{ fontSize: '11px' }}>
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={styles.description}>
            Live alerts regarding matching job openings, application status alterations, test reminders, and mentorship updates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-outline"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              ✓ Mark All Read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div style={styles.toolbar}>
        <button
          onClick={() => setFilterUnreadOnly(false)}
          style={{ ...styles.pillBtn, ...(!filterUnreadOnly ? styles.activePill : {}) }}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnreadOnly(true)}
          style={{ ...styles.pillBtn, ...(filterUnreadOnly ? styles.activePill : {}) }}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading notification feed...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchNotifications} className="btn btn-primary">Try Again</button>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {filterUnreadOnly ? 'No unread notifications.' : 'No alerts in your feed right now. You are all caught up!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {displayedNotifications.map((notif) => {
            const isUnread = !notif.read;

            return (
              <div
                key={notif.id}
                className="card"
                style={{
                  ...styles.notifCard,
                  backgroundColor: isUnread ? 'var(--color-sky-light)' : 'var(--color-bg-surface)',
                  borderColor: isUnread ? 'rgba(141, 161, 185, 0.4)' : 'var(--color-border)',
                }}
              >
                <div style={styles.iconCol}>{getTypeIcon(notif.type)}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h5 style={{ margin: 0, color: 'var(--color-primary)' }}>{notif.title}</h5>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 'var(--space-2)' }}>
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>

                  <div style={styles.actionRow}>
                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="btn btn-outline"
                        style={{ fontSize: '10px', padding: '1px 6px' }}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="btn btn-outline"
                      style={{ fontSize: '10px', padding: '1px 6px', color: '#b91c1c', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={styles.paginationRow}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPrevPage || loading}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage || loading}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' },
  description: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' },
  toolbar: { display: 'flex', gap: 'var(--space-2)' },
  pillBtn: { padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', fontSize: 'var(--font-size-xs)', fontWeight: '500', cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all var(--transition-fast)' },
  activePill: { backgroundColor: 'var(--color-mist-light)', color: 'var(--color-primary)', borderColor: 'var(--color-border)', fontWeight: '600' },
  notifCard: { display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', border: '1px solid', borderRadius: 'var(--radius-md)', transition: 'background-color var(--transition-fast)' },
  iconCol: { fontSize: '20px', paddingTop: '2px' },
  actionRow: { display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default NotificationsView;
