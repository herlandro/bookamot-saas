const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedGarages() {
  console.log('Seeding garages for Hertfordshire areas...');

  // Sample garages data for Stevenage, Hitchin, Letchworth, Baldock and surrounding areas
  const garagesData = [
    // Stevenage
    {
      name: "Stevenage MOT Centre",
      email: "info@stevenagmot.co.uk",
      phone: "01438 123456",
      address: "45 High Street, Stevenage",
      city: "Stevenage",
      postcode: "SG1 3EF",
      latitude: 51.9025,
      longitude: -0.2021,
      description: "Professional MOT testing service in the heart of Stevenage",
      website: "https://stevenagmot.co.uk",
      motLicenseNumber: "MOT-STV-001",
      dvlaApproved: true,
      motPrice: 54.85,
      retestPrice: 27.43,
      openingHours: {
        "monday": {"open": "08:00", "close": "18:00"},
        "tuesday": {"open": "08:00", "close": "18:00"},
        "wednesday": {"open": "08:00", "close": "18:00"},
        "thursday": {"open": "08:00", "close": "18:00"},
        "friday": {"open": "08:00", "close": "18:00"},
        "saturday": {"open": "08:00", "close": "16:00"},
        "sunday": {"closed": true}
      }
    },
    {
      name: "Quick Test Stevenage",
      email: "bookings@quickteststevenage.com",
      phone: "01438 234567",
      address: "12 London Road, Stevenage",
      city: "Stevenage",
      postcode: "SG1 1NT",
      latitude: 51.9015,
      longitude: -0.2035,
      description: "Fast and reliable MOT testing with same-day results",
      website: "https://quickteststevenage.com",
      motLicenseNumber: "MOT-STV-002",
      dvlaApproved: true,
      motPrice: 49.99,
      retestPrice: 25.00,
      openingHours: {
        "monday": {"open": "07:30", "close": "19:00"},
        "tuesday": {"open": "07:30", "close": "19:00"},
        "wednesday": {"open": "07:30", "close": "19:00"},
        "thursday": {"open": "07:30", "close": "19:00"},
        "friday": {"open": "07:30", "close": "19:00"},
        "saturday": {"open": "08:00", "close": "17:00"},
        "sunday": {"open": "09:00", "close": "15:00"}
      }
    },
    // Hitchin
    {
      name: "Hitchin Auto Services",
      email: "mot@hitchinautosevices.co.uk",
      phone: "01462 345678",
      address: "78 Cambridge Road, Hitchin",
      city: "Hitchin",
      postcode: "SG4 0JT",
      latitude: 51.9489,
      longitude: -0.2881,
      description: "Family-run garage providing comprehensive MOT services",
      website: "https://hitchinautosevices.co.uk",
      motLicenseNumber: "MOT-HIT-001",
      dvlaApproved: true,
      motPrice: 52.50,
      retestPrice: 26.25,
      openingHours: {
        "monday": {"open": "08:00", "close": "17:30"},
        "tuesday": {"open": "08:00", "close": "17:30"},
        "wednesday": {"open": "08:00", "close": "17:30"},
        "thursday": {"open": "08:00", "close": "17:30"},
        "friday": {"open": "08:00", "close": "17:30"},
        "saturday": {"open": "08:00", "close": "16:00"},
        "sunday": {"closed": true}
      }
    },
    {
      name: "The MOT Station Hitchin",
      email: "info@motstation-hitchin.com",
      phone: "01462 456789",
      address: "156 Bedford Road, Hitchin",
      city: "Hitchin",
      postcode: "SG5 2DP",
      latitude: 51.9501,
      longitude: -0.2795,
      description: "Specialist MOT testing centre with modern equipment",
      website: "https://motstation-hitchin.com",
      motLicenseNumber: "MOT-HIT-002",
      dvlaApproved: true,
      motPrice: 54.85,
      retestPrice: 27.43,
      openingHours: {
        "monday": {"open": "08:30", "close": "18:00"},
        "tuesday": {"open": "08:30", "close": "18:00"},
        "wednesday": {"open": "08:30", "close": "18:00"},
        "thursday": {"open": "08:30", "close": "18:00"},
        "friday": {"open": "08:30", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "16:00"},
        "sunday": {"closed": true}
      }
    },
    // Letchworth
    {
      name: "Letchworth Garden City MOT",
      email: "bookings@letchworth-mot.co.uk",
      phone: "01462 567890",
      address: "23 Station Road, Letchworth Garden City",
      city: "Letchworth Garden City",
      postcode: "SG6 3BQ",
      latitude: 51.9781,
      longitude: -0.2281,
      description: "Trusted MOT centre serving Letchworth and surrounding areas",
      website: "https://letchworth-mot.co.uk",
      motLicenseNumber: "MOT-LET-001",
      dvlaApproved: true,
      motPrice: 50.00,
      retestPrice: 25.00,
      openingHours: {
        "monday": {"open": "08:00", "close": "17:00"},
        "tuesday": {"open": "08:00", "close": "17:00"},
        "wednesday": {"open": "08:00", "close": "17:00"},
        "thursday": {"open": "08:00", "close": "17:00"},
        "friday": {"open": "08:00", "close": "17:00"},
        "saturday": {"open": "08:00", "close": "15:00"},
        "sunday": {"closed": true}
      }
    },
    {
      name: "Express MOT Letchworth",
      email: "contact@expressmot-letchworth.com",
      phone: "01462 678901",
      address: "89 Broadway, Letchworth Garden City",
      city: "Letchworth Garden City",
      postcode: "SG6 3PH",
      latitude: 51.9795,
      longitude: -0.2295,
      description: "Quick turnaround MOT testing with competitive prices",
      website: "https://expressmot-letchworth.com",
      motLicenseNumber: "MOT-LET-002",
      dvlaApproved: true,
      motPrice: 48.50,
      retestPrice: 24.25,
      openingHours: {
        "monday": {"open": "07:00", "close": "19:00"},
        "tuesday": {"open": "07:00", "close": "19:00"},
        "wednesday": {"open": "07:00", "close": "19:00"},
        "thursday": {"open": "07:00", "close": "19:00"},
        "friday": {"open": "07:00", "close": "19:00"},
        "saturday": {"open": "08:00", "close": "18:00"},
        "sunday": {"open": "10:00", "close": "16:00"}
      }
    },
    // Baldock
    {
      name: "Baldock MOT & Service Centre",
      email: "info@baldockmot.co.uk",
      phone: "01462 789012",
      address: "34 High Street, Baldock",
      city: "Baldock",
      postcode: "SG7 6BG",
      latitude: 51.9906,
      longitude: -0.1881,
      description: "Complete automotive services including MOT testing",
      website: "https://baldockmot.co.uk",
      motLicenseNumber: "MOT-BAL-001",
      dvlaApproved: true,
      motPrice: 54.85,
      retestPrice: 27.43,
      openingHours: {
        "monday": {"open": "08:00", "close": "18:00"},
        "tuesday": {"open": "08:00", "close": "18:00"},
        "wednesday": {"open": "08:00", "close": "18:00"},
        "thursday": {"open": "08:00", "close": "18:00"},
        "friday": {"open": "08:00", "close": "18:00"},
        "saturday": {"open": "08:00", "close": "16:00"},
        "sunday": {"closed": true}
      }
    },
    {
      name: "Hertfordshire Auto Test",
      email: "bookings@hertsautotest.com",
      phone: "01462 890123",
      address: "67 London Road, Baldock",
      city: "Baldock",
      postcode: "SG7 6ND",
      latitude: 51.9890,
      longitude: -0.1895,
      description: "Professional MOT testing for all vehicle types",
      website: "https://hertsautotest.com",
      motLicenseNumber: "MOT-BAL-002",
      dvlaApproved: true,
      motPrice: 53.00,
      retestPrice: 26.50,
      openingHours: {
        "monday": {"open": "08:30", "close": "17:30"},
        "tuesday": {"open": "08:30", "close": "17:30"},
        "wednesday": {"open": "08:30", "close": "17:30"},
        "thursday": {"open": "08:30", "close": "17:30"},
        "friday": {"open": "08:30", "close": "17:30"},
        "saturday": {"open": "09:00", "close": "15:00"},
        "sunday": {"closed": true}
      }
    }
  ];

  try {
    // Create garage owners first
    for (let i = 0; i < garagesData.length; i++) {
      const garageData = garagesData[i];
      
      // Create a user account for the garage owner
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const owner = await prisma.user.upsert({
        where: { email: garageData.email },
        update: {},
        create: {
          name: `${garageData.name} Owner`,
          email: garageData.email,
          password: hashedPassword,
          phone: garageData.phone,
          role: 'GARAGE_OWNER'
        }
      });

      // Create the garage
      const garage = await prisma.garage.upsert({
        where: { email: garageData.email },
        update: { ownerId: owner.id },
        create: {
          ...garageData,
          ownerId: owner.id
        }
      });

      console.log(`Created garage: ${garage.name} in ${garage.city}`);

      // Create availability slots for the next 30 days
      const today = new Date();
      for (let day = 0; day < 30; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        
        // Skip Sundays if garage is closed
        if (date.getDay() === 0 && garageData.openingHours.sunday?.closed) {
          continue;
        }

        // Create time slots matching frontend expectations
        const timeSlots = [
          '09:00', '10:00', '11:00', '12:00', '13:00',
          '14:00', '15:00', '16:00', '17:00'
        ];
        
        for (const timeSlot of timeSlots) {
          await prisma.garageAvailability.create({
            data: {
              garageId: garage.id,
              date: date,
              timeSlot: timeSlot,
              isBooked: false
            }
          });
        }
      }

      console.log(`Created availability slots for ${garage.name}`);
    }

    console.log('✅ Garages seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding garages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedGarages();