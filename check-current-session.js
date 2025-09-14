const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentSession() {
  try {
    // Check all sessions to see who might be logged in
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true
          }
        }
      },
      orderBy: {
        expires: 'desc'
      }
    });
    
    console.log('Active sessions:');
    sessions.forEach(session => {
      console.log(`Session ID: ${session.id}`);
      console.log(`User: ${session.user.email} (${session.user.role})`);
      console.log(`Expires: ${session.expires}`);
      console.log(`Is expired: ${new Date() > session.expires}`);
      console.log('---');
    });
    
    // Check accounts
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true
          }
        }
      }
    });
    
    console.log('\nAccounts:');
    accounts.forEach(account => {
      console.log(`Provider: ${account.provider}`);
      console.log(`User: ${account.user.email} (${account.user.role})`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentSession();