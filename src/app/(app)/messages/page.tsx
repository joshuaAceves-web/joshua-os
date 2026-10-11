'use client';

import { useEffect, useState } from 'react';

interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  channel: string;
  status: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  phoneNumber: string;
  channel: string;
  status: string;
  contact?: { firstName: string; lastName?: string; email?: string };
  messages?: Message[];
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (data.length > 0) {
          setSelectedConversation(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: selectedConversation.phoneNumber,
          message: messageText,
          channel: selectedConversation.channel,
          contactId: selectedConversation.contact?.id,
        }),
      });

      if (response.ok) {
        setMessageText('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading messages...</div>;
  }

  return (
    <div className="flex h-screen -mx-6 -my-8">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <p className="text-xs text-gray-600 mt-1">{conversations.length} conversations</p>
        </div>

        <div className="divide-y">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">
                    {conv.contact?.firstName || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">{conv.phoneNumber}</p>
                </div>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {conv.channel === 'sms' ? '📱 SMS' : '💬 WhatsApp'}
                </span>
              </div>
              {conv.messages && conv.messages[0] && (
                <p className="text-sm text-gray-600 mt-2 truncate">{conv.messages[0].body}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-2/3 bg-gray-50 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedConversation.contact?.firstName} {selectedConversation.contact?.lastName}
              </h3>
              <p className="text-sm text-gray-600">{selectedConversation.phoneNumber}</p>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
                {selectedConversation.channel === 'sms' ? '📱 SMS' : '💬 WhatsApp'}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.direction === 'outbound'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 mt-8">No messages yet</p>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t p-4 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
