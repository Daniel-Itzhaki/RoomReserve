import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendBookingCreatedEmail } from '@/lib/email';

const createBookingSchema = z.object({
  roomId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  userId: z.string().cuid().optional(),
  guestEmails: z.array(z.string().email()).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  recurrenceInterval: z.number().int().positive().optional(),
  recurrenceEndDate: z.string().datetime().optional().nullable(),
  recurrenceDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
}).transform((data) => ({
  ...data,
  guestEmails: data.guestEmails || [],
  isRecurring: data.isRecurring ?? false,
  recurrenceDaysOfWeek: data.recurrenceDaysOfWeek || [],
}));

async function checkBookingOverlap(
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
) {
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      roomId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
  });

  return overlappingBooking;
}

function validateBookingTime(
  startTime: Date,
  endTime: Date
): { valid: boolean; error?: string } {
  if (endTime <= startTime) {
    return { valid: false, error: 'End time must be after start time' };
  }

  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  if (duration < 30) {
    return { valid: false, error: 'Minimum booking duration is 30 minutes' };
  }

  return { valid: true };
}

function generateRecurringDates(
  startTime: Date,
  endTime: Date,
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  interval: number,
  endDate: Date | null,
  daysOfWeek?: number[]
): Array<{ start: Date; end: Date }> {
  const occurrences: Array<{ start: Date; end: Date }> = [];
  const duration = endTime.getTime() - startTime.getTime();
  let currentStart = new Date(startTime);
  let currentEnd = new Date(endTime);
  const maxOccurrences = 365; // Safety limit (1 year max)
  let count = 0;
  let isFirstOccurrence = true;

  while (count < maxOccurrences) {
    // Check if we've passed the end date
    if (endDate && currentStart > endDate) {
      break;
    }

    // For weekly pattern with specific days
    if (pattern === 'WEEKLY' && daysOfWeek && daysOfWeek.length > 0) {
      const currentDay = currentStart.getDay();
      // Always include first occurrence, then check if day matches for subsequent ones
      if (isFirstOccurrence || daysOfWeek.includes(currentDay)) {
        occurrences.push({
          start: new Date(currentStart),
          end: new Date(currentEnd),
        });
        isFirstOccurrence = false;
      }
    } else {
      // For daily or monthly, or weekly without specific days
      occurrences.push({
        start: new Date(currentStart),
        end: new Date(currentEnd),
      });
      isFirstOccurrence = false;
    }

    // Calculate next occurrence BEFORE checking if we should continue
    let nextStart: Date | null = null;
    let nextEnd: Date | null = null;
    
    if (pattern === 'DAILY') {
      nextStart = new Date(currentStart);
      nextStart.setDate(nextStart.getDate() + interval);
      nextEnd = new Date(nextStart.getTime() + duration);
    } else if (pattern === 'WEEKLY') {
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find next matching day within the next 2 weeks
        let daysToAdd = 1;
        let found = false;
        for (let i = 0; i < 14; i++) {
          const nextDay = new Date(currentStart);
          nextDay.setDate(nextDay.getDate() + daysToAdd);
          const nextDayOfWeek = nextDay.getDay();
          if (daysOfWeek.includes(nextDayOfWeek)) {
            nextStart = nextDay;
            nextEnd = new Date(nextDay.getTime() + duration);
            found = true;
            break;
          }
          daysToAdd++;
        }
        if (!found) {
          // If no matching day found and no end date, generate at least 10 occurrences
          // by continuing with weekly interval
          if (!endDate && occurrences.length < 10) {
            nextStart = new Date(currentStart);
            nextStart.setDate(nextStart.getDate() + 7 * interval);
            nextEnd = new Date(nextStart.getTime() + duration);
          } else {
            break; // No more matching days
          }
        }
      } else {
        // Weekly without specific days - add 7 days * interval
        nextStart = new Date(currentStart);
        nextStart.setDate(nextStart.getDate() + 7 * interval);
        nextEnd = new Date(nextStart.getTime() + duration);
      }
    } else if (pattern === 'MONTHLY') {
      // Monthly - add months, preserving day of month when possible
      const originalDay = currentStart.getDate();
      nextStart = new Date(currentStart);
      nextStart.setMonth(nextStart.getMonth() + interval);
      
      // Handle month-end edge cases (e.g., Jan 31 -> Feb 28)
      if (nextStart.getDate() !== originalDay) {
        // If day changed (e.g., Jan 31 -> Feb 31 becomes Mar 3), set to last day of target month
        // Move to first day of next month, then go back one day
        nextStart.setMonth(nextStart.getMonth() + 1);
        nextStart.setDate(0); // Goes to last day of previous month (which is the target month)
      }
      
      nextEnd = new Date(nextStart.getTime() + duration);
    } else {
      break; // Unknown pattern
    }

    // Update for next iteration (only if we calculated next dates)
    if (nextStart && nextEnd) {
      currentStart = nextStart;
      currentEnd = nextEnd;
    } else {
      break; // Can't continue
    }
    count++;
    
    // If no end date, generate at least a reasonable number of occurrences
    if (!endDate && occurrences.length >= 52 && pattern === 'WEEKLY') {
      break; // Stop after 1 year of weekly occurrences
    }
    if (!endDate && occurrences.length >= 12 && pattern === 'MONTHLY') {
      break; // Stop after 1 year of monthly occurrences
    }
  }

  return occurrences;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (roomId) {
      where.roomId = roomId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.AND = [
        { startTime: { gte: new Date(startDate) } },
        { endTime: { lte: new Date(endDate) } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received booking data:', JSON.stringify(body, null, 2));
    
    const validatedData = createBookingSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    const targetUserId =
      validatedData.userId && session.user.role === 'ADMIN'
        ? validatedData.userId
        : session.user.id;

    const room = await prisma.room.findUnique({
      where: { id: validatedData.roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: 'Room is not active' },
        { status: 400 }
      );
    }

    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);

    const timeValidation = validateBookingTime(
      startTime,
      endTime
    );

    if (!timeValidation.valid) {
      return NextResponse.json(
        { error: timeValidation.error },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const overlappingBooking = await checkBookingOverlap(
      validatedData.roomId,
      startTime,
      endTime
    );

    if (overlappingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Handle recurring bookings
    if (validatedData.isRecurring && validatedData.recurrencePattern) {
      console.log('Creating recurring booking:', {
        pattern: validatedData.recurrencePattern,
        interval: validatedData.recurrenceInterval,
        endDate: validatedData.recurrenceEndDate,
        daysOfWeek: validatedData.recurrenceDaysOfWeek,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      const endDate = validatedData.recurrenceEndDate && 
                      validatedData.recurrenceEndDate !== 'null' && 
                      validatedData.recurrenceEndDate.trim() !== ''
        ? new Date(validatedData.recurrenceEndDate)
        : null;
      
      const occurrences = generateRecurringDates(
        startTime,
        endTime,
        validatedData.recurrencePattern,
        validatedData.recurrenceInterval || 1,
        endDate,
        validatedData.recurrenceDaysOfWeek
      );

      console.log(`Generated ${occurrences.length} occurrences:`, 
        occurrences.map(occ => ({
          start: occ.start.toISOString(),
          end: occ.end.toISOString(),
        }))
      );

      if (occurrences.length === 0) {
        return NextResponse.json(
          { error: 'No valid occurrences found for the recurrence pattern' },
          { status: 400 }
        );
      }

      // Check all occurrences for overlaps
      for (const occurrence of occurrences) {
        const overlap = await checkBookingOverlap(
          validatedData.roomId,
          occurrence.start,
          occurrence.end
        );
        if (overlap) {
          return NextResponse.json(
            { error: `Time slot ${occurrence.start.toISOString()} is already booked` },
            { status: 409 }
          );
        }
      }

      // Create parent booking first
      const parentBooking = await prisma.booking.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          startTime,
          endTime,
          roomId: validatedData.roomId,
          userId: targetUserId,
          guestEmails: validatedData.guestEmails || [],
          isRecurring: true,
          recurrencePattern: validatedData.recurrencePattern,
          recurrenceInterval: validatedData.recurrenceInterval || 1,
          recurrenceEndDate: endDate,
          recurrenceDaysOfWeek: validatedData.recurrenceDaysOfWeek || [],
        },
        include: {
          room: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create all recurring occurrences (skip first one as it's the parent)
      const createdBookings = [parentBooking];
      const remainingOccurrences = occurrences.slice(1);
      
      console.log(`Creating ${remainingOccurrences.length} additional occurrences`);
      
      for (let i = 0; i < remainingOccurrences.length; i++) {
        const occurrence = remainingOccurrences[i];
        try {
          const booking = await prisma.booking.create({
            data: {
              title: validatedData.title,
              description: validatedData.description,
              startTime: occurrence.start,
              endTime: occurrence.end,
              roomId: validatedData.roomId,
              userId: targetUserId,
              guestEmails: validatedData.guestEmails || [],
              isRecurring: true,
              recurrencePattern: validatedData.recurrencePattern,
              recurrenceInterval: validatedData.recurrenceInterval || 1,
              recurrenceEndDate: endDate,
              recurrenceDaysOfWeek: validatedData.recurrenceDaysOfWeek || [],
              parentBookingId: parentBooking.id,
            },
            include: {
              room: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
          createdBookings.push(booking);
          console.log(`Created occurrence ${i + 1}/${remainingOccurrences.length}: ${occurrence.start.toISOString()}`);
        } catch (error: any) {
          console.error(`Error creating occurrence ${i + 1}:`, error);
          throw error;
        }
      }
      
      console.log(`Successfully created ${createdBookings.length} recurring bookings`);

      // Send emails
      const user = parentBooking.user;
      await sendBookingCreatedEmail(user.email, user.name, {
        title: parentBooking.title,
        startTime: parentBooking.startTime,
        endTime: parentBooking.endTime,
        room: { name: parentBooking.room.name },
      }, validatedData.guestEmails || []);

      return NextResponse.json({ bookings: createdBookings, count: createdBookings.length }, { status: 201 });
    }

    // Single booking - explicitly set all fields
    const bookingData = {
      title: validatedData.title,
      description: validatedData.description || null,
      startTime,
      endTime,
      roomId: validatedData.roomId,
      userId: targetUserId,
      guestEmails: validatedData.guestEmails || [],
      isRecurring: false,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      recurrenceDaysOfWeek: [],
      parentBookingId: null,
    };

    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
    console.log('Booking data types:', {
      guestEmails: Array.isArray(bookingData.guestEmails),
      isRecurring: typeof bookingData.isRecurring,
    });
    
    try {
      const booking = await prisma.booking.create({
        data: bookingData,
        include: {
          room: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await sendBookingCreatedEmail(booking.user.email, booking.user.name, {
        title: booking.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        room: { name: booking.room.name },
      }, validatedData.guestEmails || []);

      return NextResponse.json(booking, { status: 201 });
    } catch (prismaError: any) {
      console.error('Prisma error details:', {
        code: prismaError.code,
        meta: prismaError.meta,
        message: prismaError.message,
      });
      throw prismaError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown';
    console.error('Error name:', errorName);
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);
    
    // Return detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Internal server error', 
          details: errorMessage,
          name: errorName,
          stack: errorStack 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
