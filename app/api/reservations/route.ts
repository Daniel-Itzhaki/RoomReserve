import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendConfirmationEmail } from "@/lib/email"

// GET all reservations (filtered by user or all for admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")
    const userId = searchParams.get("userId")

    const where: any = {}

    // If not admin, only show user's own reservations
    if (session.user.role !== "admin") {
      where.userId = session.user.id
    } else {
      // Admin can filter by userId
      if (userId) {
        where.userId = userId
      }
    }

    if (roomId) {
      where.roomId = roomId
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error("[RESERVATIONS_GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    )
  }
}

// POST create a new reservation with conflict checking
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { roomId, title, description, startTime, endTime, attendees } = body

    if (!roomId || !title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // Validate time range
    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "Cannot create reservation in the past" },
        { status: 400 }
      )
    }

    // Check for conflicts
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: "confirmed",
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    })

    if (conflictingReservation) {
      return NextResponse.json(
        { error: "This time slot is already reserved" },
        { status: 409 }
      )
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        roomId,
        userId: session.user.id,
        title,
        description,
        startTime: start,
        endTime: end,
        attendees: attendees || 1
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Send confirmation email (don't wait for it to complete)
    try {
      await sendConfirmationEmail(session.user.email, {
        title: reservation.title,
        roomName: reservation.room.name,
        startTime: reservation.startTime,
        endTime: reservation.endTime
      })
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error("[RESERVATIONS_POST]", error)
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    )
  }
}
