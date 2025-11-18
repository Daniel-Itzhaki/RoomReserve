import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import DashboardNav from '@/components/DashboardNav';
import Link from 'next/link';

const TIMEZONE = 'Asia/Jerusalem';

async function getDashboardData(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const userBookings = await prisma.booking.findMany({
    where: {
      userId,
      endTime: {
        gte: now,
      },
    },
    include: {
      room: true,
    },
    orderBy: {
      startTime: 'asc',
    },
    take: 5,
  });

  const todayBookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      room: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
    },
  });

  return { userBookings, todayBookings, rooms };
}

export default async function Dashboard() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      redirect('/auth/signin');
    }

    if (!session.user.id) {
      console.error('Session missing user ID:', session);
      redirect('/auth/signin');
    }

    const { userBookings, todayBookings, rooms } = await getDashboardData(
      session.user.id
    );

    function formatDateTime(date: Date) {
      const zonedDate = toZonedTime(date, TIMEZONE);
      return format(zonedDate, 'PPP HH:mm');
    }

    function formatTime(date: Date) {
      const zonedDate = toZonedTime(date, TIMEZONE);
      return format(zonedDate, 'HH:mm');
    }

    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #E9EDF2, #ffffff)' }}>
        <DashboardNav userName={session.user.name || session.user.email || 'User'} userRole={(session.user.role as 'USER' | 'ADMIN') || 'USER'} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #004B9B 0%, #00BCFA 100%)' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-2" style={{ color: '#141E32' }}>
                Welcome back, {session.user.name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-lg" style={{ color: '#6B7280' }}>
                Here's an overview of your bookings and today's schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="group relative rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #004B9B 0%, #00BCFA 100%)', borderColor: '#D2D7E1' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20 transition-transform duration-500 group-hover:scale-150"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-semibold mb-2 uppercase tracking-wide">Total Rooms</h3>
              <p className="text-5xl font-bold text-white mb-1">{rooms.length}</p>
              <p className="text-white/70 text-xs">Available for booking</p>
            </div>
          </div>

          <div className="group relative rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)', borderColor: '#D2D7E1' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20 transition-transform duration-500 group-hover:scale-150"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-semibold mb-2 uppercase tracking-wide">Your Upcoming</h3>
              <p className="text-5xl font-bold text-white mb-1">{userBookings.length}</p>
              <p className="text-white/70 text-xs">Bookings scheduled</p>
            </div>
          </div>

          <div className="group relative rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #000032 0%, #141E32 100%)', borderColor: '#D2D7E1' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20 transition-transform duration-500 group-hover:scale-150"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-semibold mb-2 uppercase tracking-wide">Today's Bookings</h3>
              <p className="text-5xl font-bold text-white mb-1">{todayBookings.length}</p>
              <p className="text-white/70 text-xs">Across all rooms</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="mb-10">
          <Link
            href="/calendar"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)' }}
          >
            <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-lg">Book a Room</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Bookings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Upcoming Bookings */}
          <div className="rounded-2xl shadow-xl border-2 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.9)', borderColor: '#D2D7E1' }}>
            <div className="p-6 border-b-2" style={{ background: 'linear-gradient(to right, #E9EDF2, #ffffff)', borderColor: '#D2D7E1' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#141E32' }}>
                  Your Upcoming Bookings
                </h3>
              </div>
            </div>
            <div className="p-6">
              {userBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E9EDF2, #D2D7E1)' }}>
                    <svg className="w-8 h-8" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-medium" style={{ color: '#141E32' }}>No upcoming bookings</p>
                  <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Book a room to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="group border-2 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      style={{ borderColor: '#D2D7E1', backgroundColor: '#ffffff' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#FF6900';
                        e.currentTarget.style.backgroundColor = '#FFF5EB';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D2D7E1';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: '#FF6900', opacity: 0.1 }}>
                              <svg className="w-5 h-5" style={{ color: '#FF6900' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-lg" style={{ color: '#141E32' }}>
                              {booking.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm" style={{ backgroundColor: '#E9EDF2', color: '#141E32' }}>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {booking.room.name}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm flex items-center font-medium" style={{ color: '#141E32' }}>
                              <svg className="w-4 h-4 mr-2" style={{ color: '#FF6900' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDateTime(booking.startTime)}
                            </p>
                            <p className="text-sm flex items-center" style={{ color: '#6B7280' }}>
                              <svg className="w-4 h-4 mr-2" style={{ color: '#FF6900' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="rounded-2xl shadow-xl border-2 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.9)', borderColor: '#D2D7E1' }}>
            <div className="p-6 border-b-2" style={{ background: 'linear-gradient(to right, #E9EDF2, #ffffff)', borderColor: '#D2D7E1' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #000032 0%, #141E32 100%)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#141E32' }}>
                  Today's Schedule
                </h3>
              </div>
            </div>
            <div className="p-6">
              {todayBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E9EDF2, #D2D7E1)' }}>
                    <svg className="w-8 h-8" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-medium" style={{ color: '#141E32' }}>No bookings today</p>
                  <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Enjoy your free day!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="group border-2 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      style={{ borderColor: '#D2D7E1', backgroundColor: '#ffffff' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#000032';
                        e.currentTarget.style.backgroundColor = '#F0F4F8';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D2D7E1';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: '#000032', opacity: 0.1 }}>
                              <svg className="w-5 h-5" style={{ color: '#000032' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-lg" style={{ color: '#141E32' }}>
                              {booking.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm" style={{ backgroundColor: '#E9EDF2', color: '#141E32' }}>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {booking.room.name}
                            </span>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm" style={{ backgroundColor: '#FFD7B9', color: '#D24B00' }}>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {booking.user?.name || 'Unknown User'}
                            </span>
                          </div>
                          <p className="text-sm flex items-center font-medium" style={{ color: '#141E32' }}>
                            <svg className="w-4 h-4 mr-2" style={{ color: '#000032' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // Return error page or redirect
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #E9EDF2, #ffffff)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#141E32' }}>Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-4">An error occurred while loading your dashboard.</p>
          <a href="/auth/signin" className="text-blue-600 hover:underline">Return to Sign In</a>
        </div>
      </div>
    );
  }
}
