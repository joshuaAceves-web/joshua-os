'use client';

import { useEffect, useState } from 'react';

interface InboxItem {
  id: string;
  type: string;
  subject?: string;
  preview: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  fromPhone?: string;
  isRead: boolean;
  isFlagged: boolean;
  priority: string;
  createdAt: string;
  contact?: { firstName: string; email?: string };
}

interface InboxStats {
  total: number;
  unread: number;
  flagged: number;
  messages: number;
  forms: number;
  activities: number;
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInbox();
  }, [filterType, unreadOnly, searchQuery]);

  const fetchInbox = async () => {
    try {
      let url = '/api/inbox?';
      if (filterType) url += `type=${filterType}&`;
      if (unreadOnly) url += 'unread=true&';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }

      const statsResponse = await fetch('/api/inbox?action=stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (item: InboxItem) => {
    if (item.isRead) return;

    try {
      await fetch(`/api/inbox/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });

      setSelectedItem({ ...item, isRead: true });
      fetchInbox();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleToggleFlag = async (itemId: string) => {
    try {
      await fetch(`/api/inbox/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flag' }),
      });

      fetchInbox();
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'form_submission':
        return '📝';
      case 'activity':
        return '📊';
      case 'email':
        return '📧';
      default:
        return '📬';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-900';
      case 'HIGH':
        return 'bg-orange-100 text-orange-900';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading inbox...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Unified Inbox</h1>
        <p className="text-gray-600 mt-2">Messages, forms, emails - all in one place</p>
      </div>

      {stats && (
        <div className="grid grid-cols-6 gap-2">
          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-3">
            <p className="text-xs text-blue-600">Unread</p>
            <p className="text-2xl font-bold text-blue-900">{stats.unread}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-3">
            <p className="text-xs text-red-600">Flagged</p>
            <p className="text-2xl font-bold text-red-900">{stats.flagged}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-3">
            <p className="text-xs text-green-600">Messages</p>
            <p className="text-2xl font-bold text-green-900">{stats.messages}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-3">
            <p className="text-xs text-yellow-600">Forms</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.forms}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-3">
            <p className="text-xs text-purple-600">Activities</p>
            <p className="text-2xl font-bold text-purple-900">{stats.activities}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="message">Messages</option>
            <option value="form_submission">Forms</option>
            <option value="activity">Activities</option>
          </select>
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-4 py-2 rounded-lg transition ${
              unreadOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Unread Only
          </button>
        </div>

        <div className="divide-y max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                handleMarkAsRead(item);
              }}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                !item.isRead ? 'bg-blue-50' : ''
              } ${selectedItem?.id === item.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getIcon(item.type)}</span>
                    <h3 className={`${!item.isRead ? 'font-bold' : ''} text-gray-900`}>
                      {item.subject || item.fromName || 'No subject'}
                    </h3>
                    {!item.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{item.preview}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFlag(item.id);
                    }}
                    className={`px-2 py-1 text-lg ${
                      item.isFlagged ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                  >
                    ⭐
                  </button>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedItem.subject}</h2>
              <p className="text-gray-600 mt-1">
                {selectedItem.fromName} {selectedItem.fromEmail && `<${selectedItem.fromEmail}>`}
                {selectedItem.fromPhone && selectedItem.fromPhone}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(selectedItem.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded ${getPriorityColor(selectedItem.priority)}`}>
              {selectedItem.priority}
            </span>
          </div>

          <div className="prose prose-sm max-w-none">
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
              {selectedItem.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
