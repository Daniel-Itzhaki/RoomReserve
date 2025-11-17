import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@roomreserve.com' },
    update: {},
    create: {
      email: 'admin@roomreserve.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@roomreserve.com' },
    update: {},
    create: {
      email: 'user@roomreserve.com',
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log('Created regular user:', user.email);

  // Create rooms
  const roomNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];
  const rooms = [];

  for (const name of roomNames) {
    const room = await prisma.room.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} meeting room`,
        location: `Floor ${Math.floor(Math.random() * 5) + 1}`,
        capacity: [4, 6, 8, 10, 12][Math.floor(Math.random() * 5)],
        workingHoursStart: '08:00',
        workingHoursEnd: '19:00',
        isActive: true,
      },
    });
    rooms.push(room);
    console.log('Created room:', room.name);
  }

  // Create sample bookings for today and tomorrow
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's bookings
  await prisma.booking.create({
    data: {
      title: 'Team Standup',
      description: 'Daily team sync',
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
      endTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM
      roomId: rooms[0].id,
      userId: user.id,
    },
  });

  await prisma.booking.create({
    data: {
      title: 'Client Presentation',
      description: 'Q4 review with client',
      startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
      endTime: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 3:30 PM
      roomId: rooms[1].id,
      userId: admin.id,
    },
  });

  // Tomorrow's bookings
  await prisma.booking.create({
    data: {
      title: 'Sprint Planning',
      description: 'Planning for next sprint',
      startTime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
      endTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
      roomId: rooms[2].id,
      userId: user.id,
    },
  });

  console.log('Created sample bookings');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
