import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  sendBookingUpdatedEmail,
  sendBookingCancelledEmail,
} from '@/lib/email';

const updateBookingSchema = z.object({
  roomId: z.string().cuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  guestEmails: z.array(z.string().email()).optional(),
});

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
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

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (
      booking.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
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

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (
      existingBooking.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateBookingSchema.parse(body);

    const roomId = validatedData.roomId || existingBooking.roomId;
    const startTime = validatedData.startTime
      ? new Date(validatedData.startTime)
      : existingBooking.startTime;
    const endTime = validatedData.endTime
      ? new Date(validatedData.endTime)
      : existingBooking.endTime;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

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

    const overlappingBooking = await checkBookingOverlap(
      roomId,
      startTime,
      endTime,
      id
    );

    if (overlappingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    const updateData: any = {
      title: validatedData.title,
      description: validatedData.description,
      startTime,
      endTime,
      roomId,
    };

    // Include guestEmails if provided
    if (validatedData.guestEmails !== undefined) {
      updateData.guestEmails = validatedData.guestEmails;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
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

    await sendBookingUpdatedEmail(
      booking.user.email,
      booking.user.name,
      {
        title: booking.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        room: { name: booking.room.name },
      },
      {
        startTime: existingBooking.startTime,
        endTime: existingBooking.endTime,
        room: { name: existingBooking.room.name },
      },
      validatedData.guestEmails || booking.guestEmails || []
    );

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
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

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (
      booking.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.booking.delete({
      where: { id },
    });

    await sendBookingCancelledEmail(booking.user.email, booking.user.name, {
      title: booking.title,
      startTime: booking.startTime,
      endTime: booking.endTime,
      room: { name: booking.room.name },
    });

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
