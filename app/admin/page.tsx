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
  startTime: string
  endTime: string
  status: string
  room: { name: string }
  user: { name: string | null; email: string }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [roomCapacity, setRoomCapacity] = useState("")
  const [roomLocation, setRoomLocation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchRooms()
      fetchAllReservations()
    }
  }, [status, session])

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    }
  }

  const fetchAllReservations = async () => {
    try {
      const response = await fetch("/api/reservations")
      const data = await response.json()
      setReservations(data)
    } catch (error) {
      console.error("Failed to fetch reservations:", error)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          description: roomDescription,
          capacity: roomCapacity,
          location: roomLocation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create room")
      }

      setSuccess("Room created successfully!")
      setRoomName("")
      setRoomDescription("")
      setRoomCapacity("")
      setRoomLocation("")
      setShowRoomForm(false)
      fetchRooms()
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room? This will also delete all reservations.")) {
      return
    }

    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete room")
      }

      setSuccess("Room deleted successfully")
      fetchRooms()
    } catch (error: any) {
      setError(error.message || "Failed to delete room")
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
      fetchAllReservations()
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

  if (!session || session.user.role !== "admin") {
    return null
  }

  const upcomingReservations = reservations.filter(
    (r) => r.status === "confirmed" && new Date(r.startTime) > new Date()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              User Dashboard
            </button>
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

        {/* Manage Rooms */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Manage Rooms</h2>
            <button
              onClick={() => setShowRoomForm(!showRoomForm)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {showRoomForm ? "Cancel" : "Add New Room"}
            </button>
          </div>

          {showRoomForm && (
            <form onSubmit={handleCreateRoom} className="mb-6 p-4 border border-gray-200 rounded space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Conference Room A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    required
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Large conference room with projector"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={roomLocation}
                  onChange={(e) => setRoomLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Building A, Floor 2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </form>
          )}

          <div className="space-y-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex justify-between items-center border border-gray-200 rounded-lg p-4"
              >
                <div>
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  {room.description && <p className="text-sm text-gray-600">{room.description}</p>}
                  <p className="text-sm text-gray-700 mt-1">
                    Capacity: {room.capacity} | {room.location || "No location"}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* All Reservations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">All Upcoming Reservations</h2>

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
                    <div>
                      <h3 className="font-semibold text-lg">{reservation.title}</h3>
                      <p className="text-sm text-gray-600">{reservation.room.name}</p>
                      <p className="text-sm text-gray-600">
                        User: {reservation.user.name || reservation.user.email}
                      </p>
                      <div className="mt-2 text-sm">
                        <p className="text-gray-700">
                          <strong>Start:</strong> {new Date(reservation.startTime).toLocaleString()}
                        </p>
                        <p className="text-gray-700">
                          <strong>End:</strong> {new Date(reservation.endTime).toLocaleString()}
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
      </main>
    </div>
  )
}
