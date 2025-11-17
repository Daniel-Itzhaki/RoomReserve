const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing database connection...');

    const user = await prisma.user.findUnique({
      where: { email: 'admin@roomreserve.com' }
    });

    if (!user) {
      console.log('ERROR: User not found!');
      return;
    }

    console.log('User found:', user.email, 'Role:', user.role);
    console.log('Password hash:', user.password.substring(0, 20) + '...');

    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.password);

    console.log('Password test for "admin123":', isValid ? 'VALID ✓' : 'INVALID ✗');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
