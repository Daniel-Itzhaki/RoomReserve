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
    <div className="h-full flex flex-col">
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

          }
          .rbc-time-header-content {
            border-left: none !important;
          }
          .rbc-header {
          }
          .rbc-resource-header::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
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
          }
          .rbc-day-slot .rbc-event:not(:last-child) {
            margin-bottom: 6px !important;
          }
          .rbc-time-slot .rbc-event:not(:last-child) {
            margin-bottom: 6px !important;
          }
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
              const isOwner = bookingEvent.userId === currentUserId;
              return (
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
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ background: 'rgba(20, 30, 50, 0.3)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            {/* Header */}
            <div className="px-6 py-5 border-b" style={{ borderColor: '#E9EDF2', background: 'linear-gradient(135deg, #FF6900 0%, #D24B00 100%)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {modalType === 'create' ? 'Create Booking' : 'Edit Booking'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1.5 text-sm" style={{ color: '#141E32' }}>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2.5 focus:outline-none transition-all text-sm"
                    style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FF6900';
                      e.target.style.boxShadow = '0 0 0 2px rgba(255, 105, 0, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D2D7E1';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1.5 text-sm" style={{ color: '#141E32' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2.5 focus:outline-none transition-all resize-none text-sm"
                    style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                    rows={3}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FF6900';
                      e.target.style.boxShadow = '0 0 0 2px rgba(255, 105, 0, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D2D7E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1.5 text-sm" style={{ color: '#141E32' }}>Room</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) =>
                      setFormData({ ...formData, roomId: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2.5 focus:outline-none transition-all bg-white text-sm"
                    style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FF6900';
                      e.target.style.boxShadow = '0 0 0 2px rgba(255, 105, 0, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D2D7E1';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  >
                    {rooms
                      .filter((room) => room.isActive)
                      .map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1.5 text-sm" style={{ color: '#141E32' }}>Start Time</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime ? utcToLocalDateTime(formData.startTime) : ''}
                      onChange={(e) => {
                        const localDate = new Date(e.target.value);
                        setFormData({
                          ...formData,
                          startTime: localDate.toISOString(),
                        });
                      }}
                      className="w-full border rounded-lg px-3 py-2.5 focus:outline-none transition-all text-sm"
                      style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FF6900';
                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 105, 0, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D2D7E1';
                        e.target.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1.5 text-sm" style={{ color: '#141E32' }}>End Time</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime ? utcToLocalDateTime(formData.endTime) : ''}
                      onChange={(e) => {
                        const localDate = new Date(e.target.value);
                        setFormData({
                          ...formData,
                          endTime: localDate.toISOString(),
                        });
                      }}
                      className="w-full border rounded-lg px-3 py-2.5 focus:outline-none transition-all text-sm"
                      style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FF6900';
                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 105, 0, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D2D7E1';
                        e.target.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-medium text-sm" style={{ color: '#141E32' }}>Guests</label>
                    {formData.guestEmails.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#E9EDF2', color: '#141E32' }}>
                        {formData.guestEmails.length} {formData.guestEmails.length === 1 ? 'guest' : 'guests'}
                      </span>
                    )}
                  </div>
                
                {/* Guest chips display */}
                {formData.guestEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-lg border min-h-[44px]" style={{ backgroundColor: '#E9EDF2', borderColor: '#D2D7E1' }}>
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
                      className={`w-full border rounded-lg px-3 py-2 pr-8 focus:outline-none transition-colors text-sm ${
                        guestInputError ? 'border-red-400' : ''
                      }`}
                      style={{ 
                        borderColor: guestInputError 
                          ? '#EF4444' 
                          : formData.guestEmails.length > 0 
                            ? '#D2D7E1' 
                            : '#9CA3AF',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FF6900';
                        e.target.style.boxShadow = '0 0 0 2px rgba(255, 105, 0, 0.15)';
                        if (emailSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={(e) => {
                        // Delay to allow suggestion click
                        setTimeout(() => {
                          e.target.style.borderColor = guestInputError 
                            ? '#EF4444' 
                            : formData.guestEmails.length > 0 
                              ? '#D2D7E1' 
                              : '#9CA3AF';
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
                  <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                    Press Enter or comma to add • Paste multiple emails • Backspace to remove last guest • Arrow keys to navigate suggestions
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData({ ...formData, isRecurring: e.target.checked })
                      }
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#FF6900' }}
                    />
                    <span className="font-medium text-sm" style={{ color: '#141E32' }}>Repeat this meeting</span>
                  </label>
                </div>

                {formData.isRecurring && (
                  <>
                    <div>
                      <label className="block font-semibold mb-2 text-sm" style={{ color: '#141E32' }}>Repeat Pattern</label>
                      <select
                        value={formData.recurrencePattern}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrencePattern: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
                            recurrenceDaysOfWeek: [],
                          })
                        }
                        className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all bg-white"
                        style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#FF6900';
                          e.target.style.boxShadow = '0 0 0 3px rgba(255, 105, 0, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#D2D7E1';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-2 text-sm" style={{ color: '#141E32' }}>Repeat Every</label>
                      <div className="flex items-center gap-3">
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
                          className="w-24 border-2 rounded-xl px-4 py-3 focus:outline-none transition-all"
                          style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#FF6900';
                            e.target.style.boxShadow = '0 0 0 3px rgba(255, 105, 0, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#D2D7E1';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <span className="font-medium" style={{ color: '#141E32' }}>
                          {formData.recurrencePattern === 'DAILY'
                            ? 'day(s)'
                            : formData.recurrencePattern === 'WEEKLY'
                            ? 'week(s)'
                            : 'month(s)'}
                        </span>
                      </div>
                    </div>

                    {formData.recurrencePattern === 'WEEKLY' && (
                      <div>
                        <label className="block font-semibold mb-2 text-sm" style={{ color: '#141E32' }}>Days of Week</label>
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
                              className="flex items-center gap-2 px-4 py-2 border-2 rounded-xl cursor-pointer transition-all"
                              style={{ 
                                borderColor: formData.recurrenceDaysOfWeek.includes(day.value) ? '#FF6900' : '#D2D7E1',
                                backgroundColor: formData.recurrenceDaysOfWeek.includes(day.value) ? '#FFD7B9' : 'transparent',
                                color: '#141E32'
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
                              <span className="font-medium">{day.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold mb-2 text-sm" style={{ color: '#141E32' }}>Repeat Until (Optional)</label>
                      <input
                        type="datetime-local"
                        value={formData.recurrenceEndDate}
                        onChange={(e) =>
                          setFormData({ ...formData, recurrenceEndDate: e.target.value })
                        }
                        min={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''}
                        className="w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all"
                        style={{ borderColor: '#D2D7E1', color: '#141E32' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#FF6900';
                          e.target.style.boxShadow = '0 0 0 3px rgba(255, 105, 0, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#D2D7E1';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                        Leave empty to repeat indefinitely (max 1 year)
                      </p>
                    </div>
                  </>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: '#E9EDF2' }}>
                  {modalType === 'edit' && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                      style={{ backgroundColor: '#EF4444', color: 'white' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all border"
                    style={{ backgroundColor: 'white', color: '#141E32', borderColor: '#D2D7E1' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E9EDF2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-all"
                    style={{ backgroundColor: '#000032' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#141E32';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#000032';
                    }}
                  >
                    {modalType === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
