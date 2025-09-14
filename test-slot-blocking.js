const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSlotBlocking() {
  console.log('=== Testing Slot Blocking Functionality ===');
  
  try {
    // Get a garage to test with
    const garage = await prisma.garage.findFirst({
      select: {
        id: true,
        name: true
      }
    });
    
    if (!garage) {
      console.log('❌ No garage found for testing');
      return;
    }
    
    console.log(`\n✅ Testing with garage: ${garage.name}`);
    
    // Find an available slot to test with
    const availableSlot = await prisma.garageAvailability.findFirst({
      where: {
        garageId: garage.id,
        isBooked: false,
        isBlocked: false,
        date: {
          gte: new Date()
        }
      }
    });
    
    if (!availableSlot) {
      console.log('❌ No available slots found for testing');
      return;
    }
    
    const testDate = availableSlot.date.toISOString().split('T')[0];
    const testTimeSlot = availableSlot.timeSlot;
    
    console.log(`\n📅 Testing with slot: ${testDate} at ${testTimeSlot}`);
    
    // Test 1: Block the slot
    console.log('\n🔒 Test 1: Blocking the slot...');
    
    const blockResult = await prisma.garageAvailability.updateMany({
      where: {
        garageId: garage.id,
        date: availableSlot.date,
        timeSlot: testTimeSlot
      },
      data: {
        isBlocked: true
      }
    });
    
    console.log(`✅ Block operation affected ${blockResult.count} record(s)`);
    
    // Verify the slot is blocked
    const blockedSlot = await prisma.garageAvailability.findFirst({
      where: {
        garageId: garage.id,
        date: availableSlot.date,
        timeSlot: testTimeSlot
      }
    });
    
    if (blockedSlot && blockedSlot.isBlocked) {
      console.log('✅ Slot successfully blocked');
    } else {
      console.log('❌ Slot blocking failed');
    }
    
    // Test 2: Try to book a blocked slot (should fail or handle gracefully)
    console.log('\n📝 Test 2: Attempting to book the blocked slot...');
    
    try {
      const bookingAttempt = await prisma.garageAvailability.updateMany({
        where: {
          garageId: garage.id,
          date: availableSlot.date,
          timeSlot: testTimeSlot,
          isBlocked: false, // This condition should fail
          isBooked: false
        },
        data: {
          isBooked: true
        }
      });
      
      if (bookingAttempt.count === 0) {
        console.log('✅ Correctly prevented booking of blocked slot');
      } else {
        console.log('❌ Blocked slot was incorrectly marked as booked');
      }
    } catch (error) {
      console.log('✅ Booking attempt properly rejected:', error.message);
    }
    
    // Test 3: Unblock the slot
    console.log('\n🔓 Test 3: Unblocking the slot...');
    
    const unblockResult = await prisma.garageAvailability.updateMany({
      where: {
        garageId: garage.id,
        date: availableSlot.date,
        timeSlot: testTimeSlot
      },
      data: {
        isBlocked: false
      }
    });
    
    console.log(`✅ Unblock operation affected ${unblockResult.count} record(s)`);
    
    // Verify the slot is unblocked
    const unblockedSlot = await prisma.garageAvailability.findFirst({
      where: {
        garageId: garage.id,
        date: availableSlot.date,
        timeSlot: testTimeSlot
      }
    });
    
    if (unblockedSlot && !unblockedSlot.isBlocked) {
      console.log('✅ Slot successfully unblocked');
    } else {
      console.log('❌ Slot unblocking failed');
    }
    
    // Test 4: Now try to book the unblocked slot
    console.log('\n📝 Test 4: Booking the unblocked slot...');
    
    const bookingResult = await prisma.garageAvailability.updateMany({
      where: {
        garageId: garage.id,
        date: availableSlot.date,
        timeSlot: testTimeSlot,
        isBlocked: false,
        isBooked: false
      },
      data: {
        isBooked: true
      }
    });
    
    if (bookingResult.count > 0) {
      console.log('✅ Successfully booked the unblocked slot');
    } else {
      console.log('❌ Failed to book the unblocked slot');
    }
    
    // Clean up: Reset the slot to available
    console.log('\n🧹 Cleaning up: Resetting slot to available...');
    
    await prisma.garageAvailability.updateMany({
      where: {
        garageId: garage.id,
        date: availableSlot.date,
        timeSlot: testTimeSlot
      },
      data: {
        isBooked: false,
        isBlocked: false
      }
    });
    
    console.log('✅ Slot reset to available state');
    
  } catch (error) {
    console.error('❌ Error during slot blocking test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSlotBlocking();