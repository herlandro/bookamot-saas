const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAndSetPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'info@stevenagmot.co.uk' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    console.log('User name:', user.name);
    console.log('User role:', user.role);
    console.log('Has password:', !!user.password);
    
    if (!user.password) {
      console.log('\nCreating password for user...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log('Password created successfully!');
      console.log('Email: info@stevenagmot.co.uk');
      console.log('Password: password123');
    } else {
      console.log('User already has a password');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSetPassword();