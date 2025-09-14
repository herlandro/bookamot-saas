const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPassword() {
  try {
    // Find the Stevenage MOT Centre owner
    const user = await prisma.user.findFirst({
      where: {
        email: 'info@stevenagmot.co.uk'
      }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Has password: ${!!user.password}`);
    
    // Test common passwords
    const commonPasswords = ['password', 'test123', 'admin', '123456', 'testpassword123'];
    
    if (user.password) {
      console.log('\nTesting common passwords...');
      
      for (const testPassword of commonPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`✅ Password found: ${testPassword}`);
          return;
        }
      }
      
      console.log('❌ None of the common passwords match.');
      console.log('Setting a new password: testpassword123');
      
      const hashedPassword = await bcrypt.hash('testpassword123', 12);
      
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          password: hashedPassword
        }
      });
      
      console.log('✅ New password set successfully!');
      console.log('Login with: info@stevenagmot.co.uk / testpassword123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();