import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE/Cancel a reservation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      )
    }

    // Only allow user to delete their own reservation, or admin can delete any
    if (reservation.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    await prisma.reservation.update({
      where: { id: params.id },
      data: { status: "cancelled" }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[RESERVATION_DELETE]", error)
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    )
  }
}

// PATCH update a reservation
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, startTime, endTime, attendees } = body

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      )
    }

    // Only allow user to update their own reservation, or admin can update any
    if (reservation.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // If updating time, check for conflicts
    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : reservation.startTime
      const end = endTime ? new Date(endTime) : reservation.endTime

      if (start >= end) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        )
      }

      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          roomId: reservation.roomId,
          status: "confirmed",
          id: { not: params.id },
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
    }

    const updated = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(attendees && { attendees })
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[RESERVATION_PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    )
  }
}
