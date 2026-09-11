import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { NotificationItem } from '../store/slices/notificationSlice';
import {
  Bell,
  CheckCircle,
  Trash2,
  Loader2,
  Inbox,
  AlertCircle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const PAGE_SIZE = 15;

const Notifications: React.FC = () => {
  const {
    notifications,
    loading,
    error,
    getNotifications,
    markAsRead,
    clearAll,
  } = useNotifications();

  const navigate = useNavigate();
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const initialFetchDone = useRef<boolean>(false);

  // Intersection Observer setup for infinite scrolling
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Initial Load (First page)
  useEffect(() => {
    if (!initialFetchDone.current) {
      getNotifications(0, PAGE_SIZE);
      initialFetchDone.current = true;
    }
  }, [getNotifications]);

  // Load Next Page Function
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      getNotifications(nextPage, PAGE_SIZE);
      setPage(nextPage);
    }
  }, [loading, hasMore, page, getNotifications]);

  // Trigger when scrolling to bottom element
  useEffect(() => {
    if (inView && hasMore && !loading && page > 0) {
      loadMore();
    }
  }, [inView, hasMore, loading, page, loadMore]);

  // Check if server has more data or end of pages
  useEffect(() => {
    if (notifications.length > 0 && notifications.length % PAGE_SIZE !== 0) {
      setHasMore(false);
    }
  }, [notifications]);

  // Handle click on notification: mark as read and navigate if link exists
  const handleNotificationClick = (item: NotificationItem) => {
    const isRead = item.isRead ?? item.read ?? false;

    if (!isRead) {
      markAsRead(item.id);
    }

    if (item.link) {
      const cleanPath = item.link.startsWith('/') ? item.link : `/${item.link}`;
      navigate(cleanPath);
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'LEAVE_REQUESTED':
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-xs">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Stay updated with your latest alerts and messages
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        )}
      </div>

      {/* Error View */}
      {error && (
        <div className="p-4 mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* List Container */}
      <div className="space-y-3">
        {notifications.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">
              No notifications yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              When you get notifications, they'll show up here.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isRead = item.isRead ?? item.read ?? false;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start justify-between space-x-4 cursor-pointer relative overflow-hidden ${
                  !isRead
                    ? 'bg-blue-50/70 border-blue-300 shadow-sm hover:bg-blue-50/90 border-l-4 border-l-blue-600'
                    : 'bg-white border-slate-200/80 opacity-75 hover:opacity-100 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  {getNotificationIcon(item.type)}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm ${
                          !isRead
                            ? 'font-bold text-slate-900'
                            : 'font-medium text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Unread Indicator Badge */}
                      {!isRead && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded-full">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                          Unread
                        </span>
                      )}

                      {item.link && (
                        <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                        !isRead ? 'text-slate-800 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {item.message}
                    </p>

                    {item.createdAt && (
                      <span className="text-[11px] font-medium text-slate-400 mt-2 block">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {!isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(item.id);
                    }}
                    title="Mark as read"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Scroll Target Div for Intersection Observer */}
        <div ref={ref} className="py-6 text-center min-h-[50px] flex items-center justify-center">
          {loading && (
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading more notifications...</span>
            </div>
          )}
          {!hasMore && notifications.length > 0 && (
            <p className="text-xs text-slate-400">
              You've reached the end of notifications.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;