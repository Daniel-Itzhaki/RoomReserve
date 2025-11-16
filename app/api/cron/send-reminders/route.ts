import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendReminderEmail } from "@/lib/email"

export async function GET(request: Request) {
  try {
    // Verify this is being called from a cron job or authorized source
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)
    const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000)

    // Find reservations starting in the next 15-20 minutes that haven't had reminders sent
    const reservations = await prisma.reservation.findMany({
      where: {
        status: "confirmed",
        reminderSent: false,
        startTime: {
          gte: fifteenMinutesFromNow,
          lte: twentyMinutesFromNow
        }
      },
      include: {
        room: true,
        user: true
      }
    })

    const results = []

    for (const reservation of reservations) {
      try {
        // Use guestEmail for guest bookings, otherwise use user email
        const email = reservation.guestEmail || reservation.user?.email

        if (!email) {
          console.error(`No email found for reservation ${reservation.id}`)
          continue
        }

        await sendReminderEmail(email, {
          title: reservation.title,
          roomName: reservation.room.name,
          startTime: reservation.startTime,
          location: reservation.room.location || undefined
        })

        // Mark reminder as sent
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { reminderSent: true }
        })

        results.push({
          id: reservation.id,
          status: 'sent'
        })
      } catch (error) {
        console.error(`Failed to send reminder for reservation ${reservation.id}:`, error)
        results.push({
          id: reservation.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      processed: reservations.length,
      results
    })
  } catch (error) {
    console.error("[SEND_REMINDERS]", error)
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    )
  }
}
