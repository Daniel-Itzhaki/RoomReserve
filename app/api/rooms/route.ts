import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error("[ROOMS_GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    )
  }
}

// POST create a new room (admin only)
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, capacity, location, amenities, imageUrl } = body

    if (!name || !capacity) {
      return NextResponse.json(
        { error: "Name and capacity are required" },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        capacity: parseInt(capacity),
        location,
        amenities: amenities ? JSON.stringify(amenities) : null,
        imageUrl
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error("[ROOMS_POST]", error)
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    )
  }
}
