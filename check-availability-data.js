const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAvailabilityData() {
  console.log('=== Checking Availability Data ===');
  
  try {
    // Get all garages
    const garages = await prisma.garage.findMany({
      select: {
        id: true,
        name: true,
      }
    });
    
    console.log(`\n✅ Found ${garages.length} garage(s):`);
    garages.forEach(garage => {
      console.log(`  - ${garage.name} (${garage.id})`);
    });
    
    // Get all availability slots
    const availabilitySlots = await prisma.garageAvailability.findMany({
      include: {
        garage: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' }
      ]
    });
    
    console.log(`\n✅ Found ${availabilitySlots.length} availability slot(s):`);
    
    if (availabilitySlots.length === 0) {
      console.log('  ❌ No availability data found in database!');
    } else {
      // Group by date
      const slotsByDate = {};
      availabilitySlots.forEach(slot => {
        const dateStr = slot.date.toISOString().split('T')[0];
        if (!slotsByDate[dateStr]) {
          slotsByDate[dateStr] = [];
        }
        slotsByDate[dateStr].push(slot);
      });
      
      Object.keys(slotsByDate).forEach(date => {
        console.log(`\n  📅 ${date}:`);
        slotsByDate[date].forEach(slot => {
          const status = slot.isBlocked ? 'BLOCKED' : (slot.isBooked ? 'BOOKED' : 'AVAILABLE');
          console.log(`    ${slot.timeSlot} - ${status} (${slot.garage.name})`);
        });
      });
    }
    
    // Check for specific date range (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingSlots = await prisma.garageAvailability.findMany({
      where: {
        date: {
          gte: today,
          lte: nextWeek
        }
      },
      include: {
        garage: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`\n✅ Found ${upcomingSlots.length} slots in the next 7 days`);
    
  } catch (error) {
    console.error('❌ Error checking availability data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailabilityData();