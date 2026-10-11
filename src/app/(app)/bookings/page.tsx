'use client';

import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  guestName?: string;
  guestEmail?: string;
  status: string;
  location?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    guestName: '',
    guestEmail: '',
    location: '',
  });

  useEffect(() => {
    fetchBookings();
    checkConnection();
  }, [currentMonth]);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/calendar/oauth?action=check');
      if (response.ok) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const response = await fetch(
        `/api/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          guestName: '',
          guestEmail: '',
          location: '',
        });
        setShowForm(false);
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  const handleGoogleConnect = () => {
    window.location.href = '/api/calendar/oauth?action=authorize';
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.startTime);
        return bookingDate.getDate() === day;
      });

      days.push(
        <div
          key={day}
          className="border p-2 min-h-24 bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
          onClick={() => setShowForm(true)}
        >
          <div className="font-semibold text-sm mb-1">{day}</div>
          <div className="space-y-1">
            {dayBookings.slice(0, 2).map((booking) => (
              <div
                key={booking.id}
                className="text-xs bg-blue-100 text-blue-900 p-1 rounded truncate"
              >
                {booking.title}
              </div>
            ))}
            {dayBookings.length > 2 && (
              <div className="text-xs text-gray-600">+{dayBookings.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading bookings...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings & Calendar</h1>
          <p className="text-gray-600 mt-2">Manage your appointments and schedule</p>
        </div>
        <div className="space-x-2">
          {!isConnected && (
            <button
              onClick={handleGoogleConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect Google Calendar
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {showForm ? 'Cancel' : 'New Booking'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateBooking} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Meeting with..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Guest Email</label>
              <input
                type="email"
                value={formData.guestEmail}
                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Google Meet, Zoom, etc."
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Booking
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="space-x-2">
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Today
            </button>
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0 border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 bg-gray-200 font-semibold text-center text-sm">
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-gray-600">No bookings scheduled</p>
          ) : (
            bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="border-l-4 border-blue-600 p-3 bg-gray-50">
                <h3 className="font-semibold text-gray-900">{booking.title}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleTimeString()}
                </p>
                {booking.guestName && <p className="text-sm text-gray-700">{booking.guestName}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
