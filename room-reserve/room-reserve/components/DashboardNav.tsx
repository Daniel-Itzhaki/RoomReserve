'use client';

import Link from 'next/link';
import LogoutButton from './LogoutButton';

interface DashboardNavProps {
  userName: string;
  userRole: 'USER' | 'ADMIN';
}

export default function DashboardNav({ userName, userRole }: DashboardNavProps) {
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <Link href="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-block flex-shrink-0">
              <img 
                src="/smartup-logo.png" 
                alt="SmartUp Academy" 
                className="h-8 sm:h-10 w-auto pointer-events-none"
                style={{ backgroundColor: 'transparent' }}
                onError={(e) => {
                  // Fallback to icon if logo doesn't exist
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            </Link>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#000032', display: 'none' }}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg sm:rounded-xl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0" style={{ backgroundColor: '#000032' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-xs sm:text-sm hidden lg:inline truncate max-w-[120px]" style={{ color: '#141E32' }}>{userName}</span>
              {userRole === 'ADMIN' && (
                <span className="ml-1 text-xs text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: '#FF6900' }}>
                  Admin
                </span>
              )}
            </div>
            <Link
              href="/calendar"
              className="px-2 sm:px-3 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base text-white rounded-lg sm:rounded-xl font-semibold transform transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap"
              style={{ backgroundColor: '#3174ad' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a5f8f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3174ad'}
            >
              <span className="hidden sm:inline">Calendar</span>
              <span className="sm:hidden">📅</span>
            </Link>
            {userRole === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-2 sm:px-3 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base text-white rounded-lg sm:rounded-xl font-semibold transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #004B9B 0%, #00BCFA 100%)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #003A7A 0%, #0099D1 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #004B9B 0%, #00BCFA 100%)';
                }}
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">⚙️</span>
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
