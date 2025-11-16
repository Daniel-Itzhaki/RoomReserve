"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Room {
  id: string
  name: string
  description: string | null
  capacity: number
  location: string | null
  amenities: string | null
  isActive: boolean
}

interface Reservation {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  room: {
    name: string
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedRoom, setSelectedRoom] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [attendees, setAttendees] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchRooms()
      fetchReservations()
    }
  }, [status])

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/reservations")
      const data = await response.json()
      setReservations(data)
    } catch (error) {
      console.error("Failed to fetch reservations:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom,
          title,
          description,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          attendees,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create reservation")
      }

      setSuccess("Reservation created successfully! Confirmation email sent.")
      setTitle("")
      setDescription("")
      setStartTime("")
      setEndTime("")
      setSelectedRoom("")
      setAttendees(1)
      fetchReservations()
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) {
      return
    }

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to cancel reservation")
      }

      setSuccess("Reservation cancelled successfully")
      fetchReservations()
    } catch (error: any) {
      setError(error.message || "Failed to cancel reservation")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const upcomingReservations = reservations.filter(
    (r) => r.status === "confirmed" && new Date(r.startTime) > new Date()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">RoomReserve Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {session.user?.name || session.user?.email}</span>
            {session.user.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Book a Room */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Book a Meeting Room</h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room
                </label>
                <select
                  required
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Capacity: {room.capacity}
                      {room.location && ` - ${room.location}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Team Meeting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Meeting details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Attendees
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={attendees}
                  onChange={(e) => setAttendees(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Booking..." : "Book Room"}
              </button>
            </form>
          </div>

          {/* Upcoming Reservations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Your Upcoming Reservations</h2>

            {upcomingReservations.length === 0 ? (
              <p className="text-gray-500">No upcoming reservations</p>
            ) : (
              <div className="space-y-4">
                {upcomingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{reservation.title}</h3>
                        <p className="text-sm text-gray-600">{reservation.room.name}</p>
                        {reservation.description && (
                          <p className="text-sm text-gray-500 mt-1">{reservation.description}</p>
                        )}
                        <div className="mt-2 text-sm">
                          <p className="text-gray-700">
                            <strong>Start:</strong>{" "}
                            {new Date(reservation.startTime).toLocaleString()}
                          </p>
                          <p className="text-gray-700">
                            <strong>End:</strong>{" "}
                            {new Date(reservation.endTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Rooms */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Available Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg">{room.name}</h3>
                {room.description && (
                  <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                )}
                <div className="mt-2 text-sm text-gray-700">
                  <p>Capacity: {room.capacity} people</p>
                  {room.location && <p>Location: {room.location}</p>}
                  {room.amenities && (
                    <p className="mt-1">
                      Amenities:{" "}
                      {JSON.parse(room.amenities).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
