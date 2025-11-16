import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET a single room
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        reservations: {
          where: {
            status: "confirmed",
            endTime: {
              gte: new Date()
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error("[ROOM_GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    )
  }
}

// PATCH update a room (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, capacity, location, amenities, imageUrl, isActive } = body

    const { id } = await params
    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(location !== undefined && { location }),
        ...(amenities !== undefined && { amenities: JSON.stringify(amenities) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error("[ROOM_PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    )
  }
}

// DELETE a room (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    await prisma.room.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROOM_DELETE]", error)
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    )
  }
}
