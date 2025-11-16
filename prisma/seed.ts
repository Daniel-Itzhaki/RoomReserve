import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.reservation.deleteMany()
  await prisma.room.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@roomreserve.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
    },
  })
  console.log('✅ Created admin user: admin@roomreserve.com / admin123')

  // Create regular users
  const userPassword = await bcrypt.hash('user123', 12)
  const user1 = await prisma.user.create({
    data: {
      email: 'john@company.com',
      name: 'John Doe',
      password: userPassword,
      role: 'user',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@company.com',
      name: 'Jane Smith',
      password: userPassword,
      role: 'user',
    },
  })
  console.log('✅ Created test users: john@company.com & jane@company.com / user123')

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: 'Executive Boardroom',
        description: 'Large executive boardroom with video conferencing capabilities',
        capacity: 20,
        location: 'Building A, Floor 5',
        amenities: JSON.stringify([
          'Video Conference',
          'Projector',
          'Whiteboard',
          'Phone',
          'Coffee Machine',
        ]),
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Conference Room A',
        description: 'Mid-size conference room perfect for team meetings',
        capacity: 10,
        location: 'Building A, Floor 3',
        amenities: JSON.stringify(['TV Screen', 'Whiteboard', 'Conference Phone']),
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Conference Room B',
        description: 'Small meeting room for quick discussions',
        capacity: 6,
        location: 'Building A, Floor 3',
        amenities: JSON.stringify(['TV Screen', 'Whiteboard']),
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Innovation Lab',
        description: 'Creative space with flexible seating and brainstorming tools',
        capacity: 15,
        location: 'Building B, Floor 2',
        amenities: JSON.stringify([
          'Whiteboard Walls',
          'Standing Desks',
          'Projector',
          'Sound System',
        ]),
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Training Room',
        description: 'Large training room with theater-style seating',
        capacity: 30,
        location: 'Building B, Floor 1',
        amenities: JSON.stringify(['Projector', 'Microphone System', 'Recording Equipment']),
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Phone Booth 1',
        description: 'Private phone booth for calls',
        capacity: 1,
        location: 'Building A, Floor 2',
        amenities: JSON.stringify(['Soundproof', 'Phone Charger']),
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Focus Room',
        description: 'Quiet room for focused work sessions',
        capacity: 4,
        location: 'Building A, Floor 4',
        amenities: JSON.stringify(['Whiteboard', 'Monitor', 'Quiet Environment']),
        isActive: true,
      },
    }),
  ])
  console.log(`✅ Created ${rooms.length} meeting rooms`)

  // Create sample reservations (some in the future)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(14, 0, 0, 0)

  await Promise.all([
    prisma.reservation.create({
      data: {
        title: 'Team Standup',
        description: 'Daily team standup meeting',
        roomId: rooms[1].id,
        userId: user1.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000), // 30 minutes
        attendees: 8,
        status: 'confirmed',
      },
    }),
    prisma.reservation.create({
      data: {
        title: 'Q4 Planning Session',
        description: 'Quarterly planning and strategy session',
        roomId: rooms[0].id,
        userId: admin.id,
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        attendees: 15,
        status: 'confirmed',
      },
    }),
    prisma.reservation.create({
      data: {
        title: 'Client Presentation',
        description: 'Product demo for potential client',
        roomId: rooms[3].id,
        userId: user2.id,
        startTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // Tomorrow afternoon
        endTime: new Date(tomorrow.getTime() + 4.5 * 60 * 60 * 1000), // 1.5 hours
        attendees: 12,
        status: 'confirmed',
      },
    }),
  ])
  console.log('✅ Created sample reservations')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📝 Login credentials:')
  console.log('   Admin: admin@roomreserve.com / admin123')
  console.log('   User:  john@company.com / user123')
  console.log('   User:  jane@company.com / user123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
