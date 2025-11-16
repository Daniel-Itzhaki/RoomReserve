import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.reservation.deleteMany()
  await prisma.room.deleteMany()

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

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('   Guest booking system is ready - no authentication required')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
