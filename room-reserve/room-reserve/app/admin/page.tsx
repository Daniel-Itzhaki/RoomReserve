'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import LogoutButton from '@/components/LogoutButton';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rooms' | 'bookings' | 'users'>('rooms');
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    role: 'USER' as 'USER' | 'ADMIN',
    newPassword: '',
  });
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    location: '',
    capacity: '',
    workingHoursStart: '08:00',
    workingHoursEnd: '19:00',
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [roomsRes, bookingsRes, usersRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/bookings'),
        fetch('/api/users'),
      ]);

      const roomsData = await roomsRes.json();
      const bookingsData = await bookingsRes.json();
      const usersData = await usersRes.json();

      setRooms(roomsData);
      setBookings(bookingsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      name: '',
      description: '',
      location: '',
      capacity: '',
      workingHoursStart: '08:00',
      workingHoursEnd: '19:00',
      isActive: true,
    });
    setShowRoomModal(true);
  };

  const handleEditRoom = (room: any) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      description: room.description || '',
      location: room.location || '',
      capacity: room.capacity?.toString() || '',
      workingHoursStart: room.workingHoursStart,
      workingHoursEnd: room.workingHoursEnd,
      isActive: room.isActive,
    });
    setShowRoomModal(true);
  };

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...roomForm,
      capacity: roomForm.capacity ? parseInt(roomForm.capacity) : undefined,
    };

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save room');
      }

      await fetchData();
      setShowRoomModal(false);
    } catch (error: any) {
      alert(error.message || 'Failed to save room');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete room');
      }

      await fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete room');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete booking');
      }

      await fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete booking');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      role: user.role,
      newPassword: '',
    });
    setShowUserModal(true);
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (!confirm(`Are you sure you want to reset the password for this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }

      alert('Password reset successfully!');
      await fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === session?.user?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      alert('User deleted successfully');
      await fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    const payload: any = {
      role: userForm.role,
    };

    if (userForm.newPassword && userForm.newPassword.length >= 6) {
      payload.password = userForm.newPassword;
    }

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      await fetchData();
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ role: 'USER', newPassword: '' });
      alert('User updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update user');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold text-gray-700">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg border-b-2 border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/smartup-logo.png" 
                alt="SmartUp Academy" 
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback to icon if logo doesn't exist
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl" style={{ display: 'none' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full text-white font-bold text-sm shadow-lg">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    {session.user.name}
                  </span>
                  <span className="text-xs font-bold text-purple-600">
                    Administrator
                  </span>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2.5 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white hover:border-transparent transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Dashboard
              </Link>
              <Link
                href="/calendar"
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Calendar
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border-2 border-purple-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                System Administration
              </h2>
              <p className="text-gray-600 mt-1 font-medium">
                Manage rooms and bookings across the organization
              </p>
            </div>
          </div>

          <div className="border-b-2 border-purple-100">
            <nav className="-mb-0.5 flex gap-6">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`py-4 px-6 border-b-4 font-bold text-sm rounded-t-lg transition-all duration-200 ${
                  activeTab === 'rooms'
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Rooms Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-6 border-b-4 font-bold text-sm rounded-t-lg transition-all duration-200 ${
                  activeTab === 'bookings'
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Bookings Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 border-b-4 font-bold text-sm rounded-t-lg transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Users Management
                </div>
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'rooms' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Meeting Rooms
                </h3>
              </div>
              <button
                onClick={handleCreateRoom}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Room
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-100">
                <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Working Hours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-purple-50">
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-purple-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {room.name}
                        </div>
                        {room.description && (
                          <div className="text-sm text-gray-500">
                            {room.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.capacity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.workingHoursStart} - {room.workingHoursEnd}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            room.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {room.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-100 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                All Bookings
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-100">
                <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-purple-50">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-purple-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.title}
                        </div>
                        {booking.description && (
                          <div className="text-sm text-gray-500">
                            {booking.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.room.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(booking.startTime), 'PPp')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(booking.endTime), 'PPp')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-100 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Registered Users
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-100">
                <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-purple-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-purple-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full text-white font-bold text-sm shadow-lg">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg"
                            style={{ backgroundColor: '#004B9B', color: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00BCFA'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#004B9B'}
                            title="Edit user (change role & reset password)"
                          >
                            Edit
                          </button>
                          {user.id !== session?.user?.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg"
                              style={{ backgroundColor: '#EF4444', color: 'white' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                              title="Delete user"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showRoomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border-2 border-purple-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmitRoom} className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, name: e.target.value })
                  }
                  className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  placeholder="e.g., Meeting Room A"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, description: e.target.value })
                  }
                  className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  placeholder="Brief description of the room"
                  rows={2}
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={roomForm.location}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, location: e.target.value })
                  }
                  className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  placeholder="e.g., 2nd Floor, Building A"
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, capacity: e.target.value })
                  }
                  className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  placeholder="Number of people"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={roomForm.workingHoursStart}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        workingHoursStart: e.target.value,
                      })
                    }
                    className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={roomForm.workingHoursEnd}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        workingHoursEnd: e.target.value,
                      })
                    }
                    className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={roomForm.isActive}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, isActive: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-2 focus:ring-purple-200"
                  />
                  <span className="font-semibold text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t-2 border-purple-100">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border-2 border-purple-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Edit User
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  disabled
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-2">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value as 'USER' | 'ADMIN' })
                  }
                  className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  required
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">Reset Password</label>
                <input
                  type="password"
                  value={userForm.newPassword}
                  onChange={(e) =>
                    setUserForm({ ...userForm, newPassword: e.target.value })
                  }
                  className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  placeholder="Leave empty to keep current password"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters. Leave empty to keep current password.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t-2 border-purple-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setUserForm({ role: 'USER', newPassword: '' });
                  }}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
