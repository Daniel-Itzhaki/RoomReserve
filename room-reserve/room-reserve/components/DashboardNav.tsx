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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-block">
              <img 
                src="/smartup-logo.png" 
                alt="SmartUp Academy" 
                className="h-10 w-auto pointer-events-none"
                style={{ backgroundColor: 'transparent' }}
                onError={(e) => {
                  // Fallback to icon if logo doesn't exist
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            </Link>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#000032', display: 'none' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: '#000032' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium" style={{ color: '#141E32' }}>{userName}</span>
              {userRole === 'ADMIN' && (
                <span className="ml-1 text-xs text-white px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: '#FF6900' }}>
                  Admin
                </span>
              )}
            </div>
            <Link
              href="/calendar"
              className="px-5 py-2.5 text-white rounded-xl font-semibold transform transition-all duration-200 hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#000032' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#141E32'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000032'}
            >
              Calendar
            </Link>
            {userRole === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-5 py-2.5 text-white rounded-xl font-semibold transform transition-all duration-200 hover:scale-105 shadow-lg"
                style={{ backgroundColor: '#FF6900' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D24B00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6900'}
              >
                Admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
