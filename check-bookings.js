const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: true,
        vehicle: true,
        garage: true
      }
    });
    
    console.log('Total bookings:', bookings.length);
    
    bookings.forEach(booking => {
      console.log('\n--- Booking ---');
      console.log('ID:', booking.id);
      console.log('Reference:', booking.bookingRef);
      console.log('Garage:', booking.garage.name);
      console.log('Date:', booking.date);
      console.log('Time Slot:', booking.timeSlot);
      console.log('Status:', booking.status);
      console.log('Customer:', booking.customer.name);
      console.log('Vehicle:', booking.vehicle.make, booking.vehicle.model);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();