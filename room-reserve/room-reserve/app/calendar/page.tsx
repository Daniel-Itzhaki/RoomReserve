'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BookingCalendar from '@/components/BookingCalendar';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/rooms?activeOnly=true'),
      ]);

      const bookingsData = await bookingsRes.json();
      const roomsData = await roomsRes.json();

      setBookings(bookingsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (booking: any) => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Booking error response:', error);
      throw new Error(error.details || error.error || 'Failed to create booking');
    }

    const result = await response.json();
    // Handle recurring bookings response (may return array)
    if (result.count && result.count > 1) {
      alert(`Successfully created ${result.count} recurring bookings!`);
    }

    await fetchData();
  };

  const handleUpdateBooking = async (id: string, booking: any) => {
    const response = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update booking');
    }

    await fetchData();
  };

  const handleDeleteBooking = async (id: string) => {
    const response = await fetch(`/api/bookings/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete booking');
    }

    await fetchData();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #E9EDF2, #ffffff)' }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12" style={{ color: '#FF6900' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold text-gray-700">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #E9EDF2, #ffffff)' }}>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg border-b-2" style={{ borderColor: '#D2D7E1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #FF6900 0%, #000032 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Room Reserve
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl border" style={{ background: 'linear-gradient(to right, #E9EDF2, #ffffff)', borderColor: '#D2D7E1' }}>
                <div className="flex items-center justify-center w-9 h-9 rounded-full text-white font-bold text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #004B9B 0%, #00BCFA 100%)' }}>
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold" style={{ color: '#141E32' }}>
                    {session.user.name}
                  </span>
                  {session.user.role === 'ADMIN' && (
                    <span className="text-xs font-bold" style={{ color: '#FF6900' }}>
                      Administrator
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2.5 bg-white border-2 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#141E32';
                  e.currentTarget.style.borderColor = '#D2D7E1';
                }}
              >
                Dashboard
              </Link>
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #000032 0%, #141E32 100%)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #141E32 0%, #000032 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #000032 0%, #141E32 100%)';
                  }}
                >
                  Admin Panel
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 backdrop-blur-sm p-8 rounded-2xl shadow-xl border-2" style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: '#D2D7E1' }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #FF6900 0%, #000032 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Room Booking Calendar
              </h2>
              <p className="mt-1 font-medium" style={{ color: '#141E32' }}>
                📅 Click and drag to create bookings • 🔄 Drag events to reschedule • 🎯 Drag between rooms to move bookings
              </p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2" style={{ background: 'rgba(255, 255, 255, 0.9)', borderColor: '#D2D7E1' }}>
          <BookingCalendar
            bookings={bookings}
            rooms={rooms}
            currentUserId={session.user.id}
            isAdmin={session.user.role === 'ADMIN'}
            onCreateBooking={handleCreateBooking}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
          />
        </div>
      </main>
    </div>
  );
}
