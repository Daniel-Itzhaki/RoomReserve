'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo, Event } from 'react-big-calendar';
import withDragAndDrop, {
  withDragAndDropProps,
} from 'react-big-calendar/lib/addons/dragAndDrop';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop(Calendar);

// Helper function to convert UTC ISO string to datetime-local format (local time)
function utcToLocalDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Color palette for rooms - using brandbook colors
const ROOM_COLORS = [
  { primary: '#FF6900', secondary: '#D24B00', light: '#FFD7B9' }, // Orange
  { primary: '#00BCFA', secondary: '#004B9B', light: '#A6E1FF' }, // Cyan/Blue
  { primary: '#141E32', secondary: '#000032', light: '#D2D7E1' }, // Dark Blue/Grey
  { primary: '#FF9B55', secondary: '#FF6900', light: '#FFD7B9' }, // Medium Orange
  { primary: '#004B9B', secondary: '#000032', light: '#A6E1FF' }, // Medium Blue
  { primary: '#D24B00', secondary: '#000032', light: '#FFD7B9' }, // Dark Orange
  { primary: '#A6E1FF', secondary: '#00BCFA', light: '#E9EDF2' }, // Light Cyan
  { primary: '#D2D7E1', secondary: '#141E32', light: '#E9EDF2' }, // Light Grey
  { primary: '#FF6900', secondary: '#D24B00', light: '#FF9B55' }, // Orange variant
  { primary: '#00BCFA', secondary: '#004B9B', light: '#A6E1FF' }, // Cyan variant
];

function getRoomColor(roomIndex: number) {
  return ROOM_COLORS[roomIndex % ROOM_COLORS.length];
}

interface BookingEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  description?: string;
  guestEmails?: string[];
}

interface Room {
  id: string;
  name: string;
  description?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  isActive: boolean;
}

interface BookingCalendarProps {
  bookings: any[];
  rooms: Room[];
  currentUserId: string;
  isAdmin: boolean;
  onCreateBooking: (booking: {
    roomId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    guestEmails?: string[];
    isRecurring?: boolean;
    recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
    recurrenceDaysOfWeek?: number[];
  }) => Promise<void>;
  onUpdateBooking: (
    id: string,
    booking: {
      roomId?: string;
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      guestEmails?: string[];
      isRecurring?: boolean;
      recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      recurrenceInterval?: number;
      recurrenceEndDate?: string;
      recurrenceDaysOfWeek?: number[];
    }
  ) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
}

export default function BookingCalendar({
  bookings,
  rooms,
  currentUserId,
  isAdmin,
  onCreateBooking,
  onUpdateBooking,
  onDeleteBooking,
}: BookingCalendarProps) {
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomId: '',
    startTime: '',
    endTime: '',
    guestEmails: [] as string[],
    guestEmailInput: '',
    isRecurring: false,
    recurrencePattern: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceDaysOfWeek: [] as number[],
  });
  const [guestInputError, setGuestInputError] = useState<string | null>(null);
  const [emailSuggestions, setEmailSuggestions] = useState<Array<{ name: string; email: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Create resources (rooms) for the calendar with color info
  const resources = useMemo(() => {
    return rooms
      .filter((room) => room.isActive)
      .map((room, index) => ({
        resourceId: room.id,
        resourceTitle: room.name,
        color: getRoomColor(index),
      }));
  }, [rooms]);

  // Create a map of roomId to color
  const roomColorMap = useMemo(() => {
    const map = new Map<string, { primary: string; secondary: string; light: string }>();
    rooms
      .filter((room) => room.isActive)
      .forEach((room, index) => {
        map.set(room.id, getRoomColor(index));
      });
    return map;
  }, [rooms]);

  const events: BookingEvent[] = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      title: booking.title,
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      resourceId: booking.roomId, // Add resourceId for resources feature
      roomId: booking.roomId,
      roomName: booking.room.name,
      userId: booking.userId,
      userName: booking.user.name,
      description: booking.description,
      guestEmails: booking.guestEmails || [],
    }));
  }, [bookings]);

  const filteredEvents = useMemo(() => {
    if (selectedRoom === 'all') return events;
    return events.filter((event) => event.roomId === selectedRoom);
  }, [events, selectedRoom]);

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      // Get the room from resourceId if available, otherwise use selectedRoom or first room
      const room = (slotInfo as any).resourceId || (selectedRoom !== 'all' ? selectedRoom : rooms[0]?.id);
      setSelectedSlot(slotInfo);
      setFormData({
        title: '',
        description: '',
        roomId: room,
        startTime: slotInfo.start.toISOString(),
        endTime: slotInfo.end.toISOString(),
        guestEmails: [],
        guestEmailInput: '',
        isRecurring: false,
        recurrencePattern: 'WEEKLY',
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        recurrenceDaysOfWeek: [],
      });
      setGuestInputError(null);
      setModalType('create');
      setShowModal(true);
    },
    [selectedRoom, rooms]
  );

  const handleSelectEvent = useCallback((event: BookingEvent) => {
    setSelectedEvent(event);
    const booking = bookings.find(b => b.id === event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      roomId: event.roomId,
      startTime: event.start.toISOString(),
      endTime: event.end.toISOString(),
      guestEmails: (event.guestEmails || booking?.guestEmails || []) as string[],
      guestEmailInput: '',
      isRecurring: booking?.isRecurring || false,
      recurrencePattern: (booking?.recurrencePattern as 'DAILY' | 'WEEKLY' | 'MONTHLY') || 'WEEKLY',
      recurrenceInterval: booking?.recurrenceInterval || 1,
      recurrenceEndDate: booking?.recurrenceEndDate ? new Date(booking.recurrenceEndDate).toISOString().slice(0, 16) : '',
      recurrenceDaysOfWeek: booking?.recurrenceDaysOfWeek || [],
    });
    setGuestInputError(null);
    setModalType('edit');
    setShowModal(true);
  }, [bookings]);

  const handleEventDrop = useCallback(
    async ({ event, start, end, resourceId }: any) => {
      const bookingEvent = event as BookingEvent;

      if (!isAdmin && bookingEvent.userId !== currentUserId) {
        alert('You can only modify your own bookings');
        return;
      }

      try {
        await onUpdateBooking(bookingEvent.id, {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          roomId: resourceId || bookingEvent.roomId,
        });
      } catch (error: any) {
        alert(error.message || 'Failed to update booking');
      }
    },
    [isAdmin, currentUserId, onUpdateBooking]
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }: any) => {
      const bookingEvent = event as BookingEvent;

      if (!isAdmin && bookingEvent.userId !== currentUserId) {
        alert('You can only modify your own bookings');
        return;
      }

      try {
        await onUpdateBooking(bookingEvent.id, {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        });
      } catch (error: any) {
        alert(error.message || 'Failed to resize booking');
      }
    },
    [isAdmin, currentUserId, onUpdateBooking]
  );

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fetch email suggestions for autocomplete
  const fetchEmailSuggestions = useCallback(async (search: string) => {
    if (search.length < 2) {
      setEmailSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(search)}&limit=5`);
      if (response.ok) {
        const users = await response.json();
        const filtered = users.filter(
          (user: { email: string }) => 
            !formData.guestEmails.includes(user.email.toLowerCase())
        );
        setEmailSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [formData.guestEmails]);

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.guestEmailInput && !formData.guestEmailInput.includes(',')) {
        fetchEmailSuggestions(formData.guestEmailInput);
      } else {
        setEmailSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.guestEmailInput, fetchEmailSuggestions]);

  const handleAddGuest = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setGuestInputError(null);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setGuestInputError('Please enter a valid email address');
      return;
    }

    if (formData.guestEmails.includes(trimmedEmail)) {
      setGuestInputError('This guest is already added');
      return;
    }

    setFormData({
      ...formData,
      guestEmails: [...formData.guestEmails, trimmedEmail],
      guestEmailInput: '',
    });
    setGuestInputError(null);
  };

  const handlePasteGuests = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const emails = pastedText
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length > 1) {
      // Multiple emails pasted
      const validEmails: string[] = [];
      const invalidEmails: string[] = [];

      emails.forEach(email => {
        const lowerEmail = email.toLowerCase();
        if (isValidEmail(lowerEmail) && !formData.guestEmails.includes(lowerEmail)) {
          validEmails.push(lowerEmail);
        } else if (!isValidEmail(lowerEmail)) {
          invalidEmails.push(email);
        }
      });

      if (validEmails.length > 0) {
        setFormData({
          ...formData,
          guestEmails: [...formData.guestEmails, ...validEmails],
          guestEmailInput: '',
        });
      }

      if (invalidEmails.length > 0) {
        setGuestInputError(`${invalidEmails.length} invalid email(s) ignored`);
        setTimeout(() => setGuestInputError(null), 3000);
      } else {
        setGuestInputError(null);
      }
    } else {
      // Single email, let normal paste happen
      const email = emails[0];
      if (email) {
        setTimeout(() => {
          handleAddGuest(email);
        }, 0);
      }
    }
  };

  const handleRemoveGuest = (emailToRemove: string) => {
    setFormData({
      ...formData,
      guestEmails: formData.guestEmails.filter(email => email !== emailToRemove),
    });
    setGuestInputError(null);
  };

  const handleGuestInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (suggestionIndex >= 0 && suggestionIndex < emailSuggestions.length) {
        // Select suggestion
        handleAddGuest(emailSuggestions[suggestionIndex].email);
        setShowSuggestions(false);
        setSuggestionIndex(-1);
      } else if (formData.guestEmailInput.trim()) {
        handleAddGuest(formData.guestEmailInput);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex(prev => 
        prev < emailSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestionIndex(-1);
    } else if (e.key === 'Backspace' && formData.guestEmailInput === '' && formData.guestEmails.length > 0) {
      // Remove last guest when backspace is pressed on empty input
      e.preventDefault();
      const lastGuest = formData.guestEmails[formData.guestEmails.length - 1];
      handleRemoveGuest(lastGuest);
    }
  };

  const handleSelectSuggestion = (email: string) => {
    handleAddGuest(email);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add any email in the input field before submitting
    if (formData.guestEmailInput.trim()) {
      handleAddGuest(formData.guestEmailInput);
    }

    try {
      const guestEmailsArray = formData.guestEmails;

      if (modalType === 'create') {
        const bookingData: any = {
          roomId: formData.roomId,
          title: formData.title,
          description: formData.description,
          startTime: formData.startTime,
          endTime: formData.endTime,
          guestEmails: guestEmailsArray,
        };

        // Only include recurrence fields if recurring is enabled
        if (formData.isRecurring) {
          bookingData.isRecurring = true;
          bookingData.recurrencePattern = formData.recurrencePattern;
          bookingData.recurrenceInterval = formData.recurrenceInterval || 1;
          if (formData.recurrenceEndDate && formData.recurrenceEndDate.trim()) {
            // Convert datetime-local to ISO string
            const endDate = new Date(formData.recurrenceEndDate);
            bookingData.recurrenceEndDate = endDate.toISOString();
          }
          if (formData.recurrencePattern === 'WEEKLY' && formData.recurrenceDaysOfWeek && formData.recurrenceDaysOfWeek.length > 0) {
            bookingData.recurrenceDaysOfWeek = formData.recurrenceDaysOfWeek;
          }
          console.log('Sending recurring booking data:', bookingData);
        }

        await onCreateBooking(bookingData);
      } else if (selectedEvent) {
        await onUpdateBooking(selectedEvent.id, {
          title: formData.title,
          description: formData.description,
          roomId: formData.roomId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          guestEmails: guestEmailsArray,
          isRecurring: formData.isRecurring,
          recurrencePattern: formData.isRecurring ? formData.recurrencePattern : undefined,
          recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : undefined,
          recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : undefined,
          recurrenceDaysOfWeek: formData.isRecurring && formData.recurrencePattern === 'WEEKLY' ? formData.recurrenceDaysOfWeek : undefined,
        });
      }
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        roomId: '',
        startTime: '',
        endTime: '',
        guestEmails: [],
        guestEmailInput: '',
        isRecurring: false,
        recurrencePattern: 'WEEKLY',
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        recurrenceDaysOfWeek: [],
      });
      setGuestInputError(null);
    } catch (error: any) {
      alert(error.message || 'Failed to save booking');
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    if (confirm('Are you sure you want to delete this booking?')) {
      try {
        await onDeleteBooking(selectedEvent.id);
        setShowModal(false);
      } catch (error: any) {
        alert(error.message || 'Failed to delete booking');
      }
    }
  };

  const eventStyleGetter = useCallback(
    (event: any) => {
      const bookingEvent = event as BookingEvent;
      const isOwner = bookingEvent.userId === currentUserId;
      const roomColor = roomColorMap.get(bookingEvent.roomId) || ROOM_COLORS[0];
      const backgroundColor = isOwner ? roomColor.primary : roomColor.secondary;

      return {
        style: {
          backgroundColor,
          borderRadius: '4px',
          opacity: isOwner ? 1 : 0.85,
          color: 'white',
          border: 'none',
          borderLeft: `3px solid ${isOwner ? roomColor.secondary : roomColor.primary}`,
          display: 'block',
          position: 'relative',
          padding: '6px 10px',
          fontWeight: isOwner ? '600' : '500',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
        },
      };
    },
    [currentUserId, roomColorMap]
  );

  const min = useMemo(() => {
    const date = new Date();
    date.setHours(7, 0, 0, 0);
    return date;
  }, []);

  const max = useMemo(() => {
    const date = new Date();
    date.setHours(20, 0, 0, 0);
    return date;
  }, []);

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      {/* Custom Toolbar - Enhanced Design */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex gap-1 sm:gap-2 rounded-lg sm:rounded-xl p-1 shadow-sm" style={{ backgroundColor: '#E9EDF2' }}>
            <button
              onClick={() => setView('day')}
              className={`px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                view === 'day'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-[#141E32]'
              }`}
              style={view === 'day' ? { background: 'linear-gradient(135deg, #004B9B 0%, #00BCFA 100%)' } : {}}
              onMouseEnter={(e) => {
                if (view !== 'day') {
                  e.currentTarget.style.color = '#004B9B';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'day') {
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                view === 'week'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-[#141E32]'
              }`}
              style={view === 'week' ? { background: 'linear-gradient(135deg, #004B9B 0%, #00BCFA 100%)' } : {}}
              onMouseEnter={(e) => {
                if (view !== 'week') {
                  e.currentTarget.style.color = '#004B9B';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'week') {
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
            >
              Week
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
              style={{ color: '#141E32', backgroundColor: '#E9EDF2' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D2D7E1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E9EDF2';
              }}
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-200 hover:shadow-sm flex-shrink-0"
              style={{ color: '#6B7280' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#004B9B';
                e.currentTarget.style.backgroundColor = '#E9EDF2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-200 hover:shadow-sm flex-shrink-0"
              style={{ color: '#6B7280' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#004B9B';
                e.currentTarget.style.backgroundColor = '#E9EDF2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="relative flex-1 sm:flex-none min-w-0">
              <input
                id="date-picker"
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = new Date(e.target.value + 'T00:00:00');
                    setSelectedDate(newDate);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: 10 }}
              />
              <div className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base font-bold min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] rounded-md sm:rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md pointer-events-none truncate" style={{ color: '#141E32', backgroundColor: '#E9EDF2' }}>
                <span className="hidden sm:inline">{format(selectedDate, 'EEEE MMM d', { locale: enUS })}</span>
                <span className="sm:hidden">{format(selectedDate, 'MMM d', { locale: enUS })}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                const input = document.getElementById('date-picker') as HTMLInputElement;
                if (input) {
                  input.focus();
                  input.click();
                  // Fallback for browsers that don't support showPicker
                  if (typeof input.showPicker === 'function') {
                    input.showPicker();
                  }
                }
              }}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-200 hover:shadow-sm flex-shrink-0"
              style={{ color: '#6B7280' }}
              title="Pick a date"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#004B9B';
                e.currentTarget.style.backgroundColor = '#E9EDF2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto">
          <label className="font-semibold text-xs sm:text-sm whitespace-nowrap" style={{ color: '#141E32' }}>Filter:</label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="flex-1 sm:flex-none rounded-md sm:rounded-lg px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 min-w-0"
            style={{ 
              border: '2px solid #D2D7E1', 
              backgroundColor: 'white',
              color: '#141E32'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#004B9B';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 75, 155, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#D2D7E1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="all">All Rooms</option>
            {rooms
              .filter((room) => room.isActive)
              .map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-lg border-2 p-4" style={{ borderColor: '#D2D7E1' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .rbc-time-content {
            border-top: none !important;
          }
          .rbc-time-header-content {
            border-left: none !important;
          }
          .rbc-header {
            padding: 12px 8px !important;
            font-weight: 600 !important;
            background: #f9fafb !important;
            color: #374151 !important;
            border-right: 1px solid #e5e7eb !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
          .rbc-time-slot {
            border-top: 1px solid #f3f4f6 !important;
          }
          .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid #f3f4f6 !important;
          }
          .rbc-resource-header {
            border-right: 1px solid #e5e7eb !important;
            border-bottom: 1px solid #e5e7eb !important;
            padding: 12px 8px !important;
            font-weight: 600 !important;
            background: #f9fafb !important;
            text-align: center !important;
            position: relative !important;
            color: #374151 !important;
          }
          .rbc-resource-header::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background-color: var(--room-color);
          }
          .rbc-resource-cell {
            border-right: 1px solid #e5e7eb !important;
            padding: 4px !important;
            background: white !important;
          }
          .rbc-time-content > * + * > * {
            border-left: 1px solid #e5e7eb !important;
          }
          .rbc-event {
            margin: 4px 6px !important;
            border-radius: 4px !important;
            border-left: 3px solid currentColor !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            padding: 6px 10px !important;
          }
          .rbc-day-slot .rbc-event {
            margin-top: 4px !important;
            margin-bottom: 4px !important;
            margin-left: 6px !important;
            margin-right: 6px !important;
          }
          .rbc-time-slot .rbc-event {
            margin-top: 4px !important;
            margin-bottom: 4px !important;
          }
          .rbc-event-label {
            font-size: 0.6875rem !important;
            opacity: 0.9 !important;
            font-weight: 600 !important;
          }
          .rbc-event-content {
            font-size: 0.8125rem !important;
            padding: 2px 4px !important;
            font-weight: 500 !important;
            line-height: 1.4 !important;
          }
          .rbc-day-slot {
            position: relative;
            background: white !important;
          }
          .rbc-day-slot .rbc-events-container {
            margin-right: 6px !important;
          }
          .rbc-day-slot .rbc-event:not(:last-child) {
            margin-bottom: 6px !important;
          }
          .rbc-time-slot .rbc-event:not(:last-child) {
            margin-bottom: 6px !important;
          }
          .rbc-time-slot {
            background: white !important;
          }
        `}} />
        <DragAndDropCalendar
          localizer={localizer}
          events={filteredEvents as any}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          resourceIdAccessor={(event: any) => event.resourceId}
          resourceTitleAccessor={(resource: any) => resource.resourceTitle}
          toolbar={false}
          components={{
            event: ({ event }: any) => {
              const bookingEvent = event as BookingEvent;
              const hasGuests = bookingEvent.guestEmails && bookingEvent.guestEmails.length > 0;
              return (
                <div className="relative w-full h-full flex items-center gap-2 px-2 py-1">
                  <span className="flex-1 truncate text-xs font-semibold leading-tight">{bookingEvent.title}</span>
                  {hasGuests && bookingEvent.guestEmails && (
                    <div className="flex-shrink-0 flex items-center gap-1 bg-white/30 rounded-full px-1.5 py-0.5" title={`${bookingEvent.guestEmails.length} guest(s)`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="text-xs font-bold">{bookingEvent.guestEmails.length}</span>
                    </div>
                  )}
                </div>
              );
            },
            resourceHeader: ({ resource }: any) => {
              const roomColor = resource.color || ROOM_COLORS[0];
              return (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  justifyContent: 'center', 
                  padding: '8px 4px',
                  position: 'relative'
                }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: roomColor.primary,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: '0.8125rem',
                    color: '#374151',
                    fontFamily: 'Lato, sans-serif'
                  }}>{resource.resourceTitle}</span>
                </div>
              );
            },
          }}
          resources={selectedRoom === 'all' ? resources : undefined}
          view={view}
          onView={(newView) => setView(newView as 'day' | 'week')}
          date={selectedDate}
          onNavigate={(date) => setSelectedDate(date)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent as any}
          onEventDrop={handleEventDrop as any}
          onEventResize={handleEventResize as any}
          selectable
          resizable
          eventPropGetter={eventStyleGetter as any}
          step={30}
          timeslots={2}
          min={min}
          max={max}
          style={{ height: 600 }}
          views={['day', 'week']}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border-2" style={{ borderColor: '#D2D7E1' }}>
            <div className="p-6" style={{ background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {modalType === 'create' ? 'Create Booking' : 'Edit Booking'}
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="mb-5">
                <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                  style={{ borderColor: '#D2D7E1' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                  style={{ borderColor: '#D2D7E1' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                  rows={3}
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Room *</label>
                <select
                  value={formData.roomId}
                  onChange={(e) =>
                    setFormData({ ...formData, roomId: e.target.value })
                  }
                  className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                  style={{ borderColor: '#D2D7E1' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                  required
                >
                  {rooms
                    .filter((room) => room.isActive)
                    .map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}{room.description ? ` - ${room.description}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Start Time *</label>
                <input
                  type="datetime-local"
                  value={formData.startTime ? utcToLocalDateTime(formData.startTime) : ''}
                  onChange={(e) => {
                    // datetime-local gives local time, convert to UTC ISO string
                    const localDate = new Date(e.target.value);
                    setFormData({
                      ...formData,
                      startTime: localDate.toISOString(),
                    });
                  }}
                  className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                  style={{ borderColor: '#D2D7E1' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>End Time *</label>
                <input
                  type="datetime-local"
                  value={formData.endTime ? utcToLocalDateTime(formData.endTime) : ''}
                  onChange={(e) => {
                    // datetime-local gives local time, convert to UTC ISO string
                    const localDate = new Date(e.target.value);
                    setFormData({
                      ...formData,
                      endTime: localDate.toISOString(),
                    });
                  }}
                  className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                  style={{ borderColor: '#D2D7E1' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                  required
                />
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-semibold" style={{ color: '#141E32' }}>Guests</label>
                  {formData.guestEmails.length > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold shadow-sm" style={{ backgroundColor: '#E9EDF2', color: '#141E32' }}>
                      {formData.guestEmails.length} {formData.guestEmails.length === 1 ? 'guest' : 'guests'}
                    </span>
                  )}
                </div>

                {/* Guest chips display */}
                {formData.guestEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-3 rounded-xl border-2 min-h-[44px]" style={{ backgroundColor: '#E9EDF2', borderColor: '#D2D7E1' }}>
                    {formData.guestEmails.map((email, index) => {
                      const initial = email.charAt(0).toUpperCase();
                      const suggestion = emailSuggestions.find(s => s.email.toLowerCase() === email.toLowerCase());
                      const displayName = suggestion?.name || email.split('@')[0];
                      return (
                        <div
                          key={`${email}-${index}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all hover:shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
                          style={{ backgroundColor: '#E9EDF2', color: '#141E32' }}
                        >
                          {/* Avatar circle with initial */}
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{ backgroundColor: '#FF6900' }}
                          >
                            {initial}
                          </div>
                          <span className="max-w-[200px] truncate" title={email}>
                            {displayName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGuest(email)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors flex-shrink-0"
                            style={{ color: '#141E32' }}
                            aria-label={`Remove ${email}`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#D2D7E1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Guest input with autocomplete */}
                <div className="relative">
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.guestEmailInput}
                      onChange={(e) => {
                        setFormData({ ...formData, guestEmailInput: e.target.value });
                        setGuestInputError(null);
                        setShowSuggestions(true);
                      }}
                      onKeyDown={handleGuestInputKeyDown}
                      onPaste={handlePasteGuests}
                      placeholder={formData.guestEmails.length === 0 ? "Add guests" : "Add another guest"}
                      className={`w-full border-2 rounded-xl px-4 py-3 pr-8 focus:outline-none transition-all duration-200 ${
                        guestInputError ? '' : ''
                      }`}
                      style={{ 
                        borderColor: guestInputError 
                          ? '#EF4444' 
                          : formData.guestEmails.length > 0 
                            ? '#D2D7E1' 
                            : '#D2D7E1',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FF6900';
                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 105, 0, 0.2)';
                        if (emailSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={(e) => {
                        // Delay to allow suggestion click
                        setTimeout(() => {
                          e.target.style.borderColor = guestInputError 
                            ? '#EF4444' 
                            : '#D2D7E1';
                          e.target.style.boxShadow = 'none';
                          setShowSuggestions(false);
                          if (formData.guestEmailInput.trim()) {
                            handleAddGuest(formData.guestEmailInput);
                          }
                        }, 200);
                      }}
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="animate-spin h-4 w-4" style={{ color: '#FF6900' }} fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Autocomplete suggestions dropdown */}
                  {showSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {emailSuggestions.map((suggestion, index) => {
                        const initial = suggestion.email.charAt(0).toUpperCase();
                        return (
                          <button
                            key={suggestion.email}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion.email)}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                              index === suggestionIndex ? 'bg-gray-50' : ''
                            }`}
                            onMouseEnter={() => setSuggestionIndex(index)}
                          >
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                              style={{ backgroundColor: '#FF6900' }}
                            >
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate" style={{ color: '#141E32' }}>
                                {suggestion.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {suggestion.email}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {guestInputError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {guestInputError}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or comma to add ? Paste multiple emails ? Backspace to remove last guest ? ?? to navigate suggestions
                </p>
              </div>

              <div className="mb-5">
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors duration-200" style={{ backgroundColor: '#E9EDF2', borderColor: '#D2D7E1' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D2D7E1'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E9EDF2'}>
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData({ ...formData, isRecurring: e.target.checked })
                    }
                    className="w-5 h-5 border-2 rounded"
                    style={{ borderColor: '#D2D7E1', accentColor: '#FF6900' }}
                  />
                  <span className="font-semibold" style={{ color: '#141E32' }}>Repeat this meeting</span>
                </label>
              </div>

              {formData.isRecurring && (
                <>
                  <div className="mb-5">
                    <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Repeat Pattern</label>
                    <select
                      value={formData.recurrencePattern}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrencePattern: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
                          recurrenceDaysOfWeek: [],
                        })
                      }
                      className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                      style={{ borderColor: '#D2D7E1' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>

                  <div className="mb-5">
                    <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Repeat Every</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formData.recurrenceInterval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrenceInterval: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20 border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                        style={{ borderColor: '#D2D7E1' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                      />
                      <span style={{ color: '#6B7280' }}>
                        {formData.recurrencePattern === 'DAILY'
                          ? 'day(s)'
                          : formData.recurrencePattern === 'WEEKLY'
                          ? 'week(s)'
                          : 'month(s)'}
                      </span>
                    </div>
                  </div>

                  {formData.recurrencePattern === 'WEEKLY' && (
                    <div className="mb-5">
                      <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Days of Week</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 0, label: 'Sun' },
                          { value: 1, label: 'Mon' },
                          { value: 2, label: 'Tue' },
                          { value: 3, label: 'Wed' },
                          { value: 4, label: 'Thu' },
                          { value: 5, label: 'Fri' },
                          { value: 6, label: 'Sat' },
                        ].map((day) => (
                          <label
                            key={day.value}
                            className="flex items-center gap-1 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all duration-200"
                            style={{ borderColor: '#D2D7E1', backgroundColor: formData.recurrenceDaysOfWeek.includes(day.value) ? '#E9EDF2' : 'white' }}
                            onMouseEnter={(e) => {
                              if (!formData.recurrenceDaysOfWeek.includes(day.value)) {
                                e.currentTarget.style.backgroundColor = '#E9EDF2';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!formData.recurrenceDaysOfWeek.includes(day.value)) {
                                e.currentTarget.style.backgroundColor = 'white';
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.recurrenceDaysOfWeek.includes(day.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    recurrenceDaysOfWeek: [
                                      ...formData.recurrenceDaysOfWeek,
                                      day.value,
                                    ],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek.filter(
                                      (d) => d !== day.value
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                              style={{ accentColor: '#FF6900' }}
                            />
                            <span style={{ color: '#141E32', fontWeight: formData.recurrenceDaysOfWeek.includes(day.value) ? '600' : '500' }}>{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-5">
                    <label className="block font-semibold mb-2" style={{ color: '#141E32' }}>Repeat Until (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.recurrenceEndDate}
                      onChange={(e) =>
                        setFormData({ ...formData, recurrenceEndDate: e.target.value })
                      }
                      min={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''}
                      className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
                      style={{ borderColor: '#D2D7E1' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#FF6900'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#D2D7E1'}
                    />
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                      Leave empty to repeat indefinitely (max 1 year)
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t-2" style={{ borderColor: '#D2D7E1' }}>
                {modalType === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-5 py-2.5 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    style={{ backgroundColor: '#EF4444' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #D24B00 0%, #B83D00 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)';
                  }}
                >
                  {modalType === 'create' ? 'Create Booking' : 'Update Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
