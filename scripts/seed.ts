#!/usr/bin/env tsx

import { PrismaClient, UserRole, FuelType, BookingStatus, PaymentStatus, GarageApprovalStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const CUSTOMER_NAMES = [
  'James Smith','Oliver Johnson','George Williams','Harry Brown','Jack Jones',
  'Jacob Miller','Charlie Davis','Thomas Wilson','Oscar Moore','William Taylor',
  'Emily Anderson','Olivia Thomas','Amelia Jackson','Isla White','Ava Harris',
  'Jessica Martin','Poppy Thompson','Sophie Garcia','Isabella Martinez','Mia Robinson',
  'Noah Clark','Alfie Rodriguez','Leo Lewis','Freddie Lee','Arthur Walker',
  'Archie Hall','Henry Allen','Theodore Young','Lucas Hernandez','Alexander King'
]

const GARAGE_DATA = [
  { name: "Smith's Motor Services", city: 'Stevenage', postcode: 'SG1 1AA', address: '45 High Street, Stevenage', motPrice: 45.00 },
  { name: 'Stevenage Auto Centre', city: 'Stevenage', postcode: 'SG1 2BB', address: '12 London Road, Stevenage', motPrice: 39.99 },
  { name: 'Quick Fit MOT & Service', city: 'Stevenage', postcode: 'SG2 7HG', address: '78 Fairlands Way, Stevenage', motPrice: 54.85 },
  { name: 'Town Centre Garage', city: 'Stevenage', postcode: 'SG1 3XY', address: '23 Queensway, Stevenage', motPrice: 35.50 },
  { name: 'Broadwater Motors', city: 'Stevenage', postcode: 'SG2 8UT', address: '156 Broadwater Crescent, Stevenage', motPrice: 42.00 },
  { name: 'Hitchin MOT Centre', city: 'Hitchin', postcode: 'SG4 9AA', address: '34 Bancroft, Hitchin', motPrice: 29.99 },
  { name: 'High Street Auto Repairs', city: 'Hitchin', postcode: 'SG5 1AT', address: '89 High Street, Hitchin', motPrice: 48.75 },
  { name: 'Walsworth Road Garage', city: 'Hitchin', postcode: 'SG4 9SP', address: '67 Walsworth Road, Hitchin', motPrice: 25.00 },
  { name: 'Hitchin Vehicle Services', city: 'Hitchin', postcode: 'SG5 2DA', address: '145 Cambridge Road, Hitchin', motPrice: 37.50 },
  { name: 'The MOT Workshop', city: 'Hitchin', postcode: 'SG4 0TW', address: '22 Bedford Road, Hitchin', motPrice: 32.00 }
]

const VEHICLE_DATA = [
  { make: 'Ford', model: 'Fiesta', fuelType: FuelType.PETROL },
  { make: 'Ford', model: 'Focus', fuelType: FuelType.DIESEL },
  { make: 'Vauxhall', model: 'Corsa', fuelType: FuelType.PETROL },
  { make: 'Vauxhall', model: 'Astra', fuelType: FuelType.DIESEL },
  { make: 'Volkswagen', model: 'Golf', fuelType: FuelType.PETROL },
  { make: 'Volkswagen', model: 'Polo', fuelType: FuelType.PETROL },
  { make: 'BMW', model: '3 Series', fuelType: FuelType.DIESEL },
  { make: 'Mercedes-Benz', model: 'C-Class', fuelType: FuelType.DIESEL },
  { make: 'Audi', model: 'A3', fuelType: FuelType.PETROL },
  { make: 'Toyota', model: 'Corolla', fuelType: FuelType.HYBRID },
  { make: 'Honda', model: 'Civic', fuelType: FuelType.PETROL },
  { make: 'Nissan', model: 'Qashqai', fuelType: FuelType.DIESEL },
  { make: 'Peugeot', model: '208', fuelType: FuelType.PETROL },
  { make: 'Renault', model: 'Clio', fuelType: FuelType.PETROL },
  { make: 'Mini', model: 'Cooper', fuelType: FuelType.PETROL },
  { make: 'Tesla', model: 'Model 3', fuelType: FuelType.ELECTRIC },
  { make: 'Hyundai', model: 'i30', fuelType: FuelType.PETROL },
  { make: 'Kia', model: 'Sportage', fuelType: FuelType.DIESEL },
  { make: 'Mazda', model: 'CX-5', fuelType: FuelType.PETROL },
  { make: 'Skoda', model: 'Octavia', fuelType: FuelType.DIESEL }
]

const COLORS = ['Black','White','Silver','Blue','Red','Grey','Green','Yellow','Orange','Brown']
const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

function reg(): string {
  const letters = () => String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const l3 = () => `${letters()}${letters()}${letters()}`
  const l2 = () => `${letters()}${letters()}`
  const n2 = () => String(Math.floor(Math.random() * 90) + 10)
  return `${l2()}${n2()} ${l3()}`
}

async function hash(password: string) { return bcrypt.hash(password, 12) }

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco')
  console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL ?? 'não definida'}`)

  await prisma.$connect()
  await prisma.$queryRaw`SELECT 1`
  console.log('✅ Conexão com banco validada')

  await prisma.review.deleteMany()
  await prisma.motResult.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.garageTimeSlotBlock.deleteMany()
  await prisma.garageScheduleException.deleteMany()
  await prisma.garageSchedule.deleteMany()
  await prisma.motHistory.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.garage.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  const admin = await prisma.user.create({
    data: { name: 'Admin', email: 'admin@bookamot.co.uk', password: await hash('admin123!'), role: UserRole.ADMIN }
  })
  console.log(`👤 Admin: ${admin.email}`)
  
  const now = new Date()

  const customerPwd = await hash('password123')
  const customers: Array<{ id: string; name: string; email: string }> = []
  for (let i = 0; i < 30; i++) {
    const name = CUSTOMER_NAMES[i]
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`
    const user = await prisma.user.create({ data: { name, email, password: customerPwd, role: UserRole.CUSTOMER } })
    customers.push(user)
  }

  const garagePwd = await hash('garage123')
  const garages: Array<{ id: string; name: string; motPrice: number }> = []
  for (let i = 0; i < GARAGE_DATA.length; i++) {
    const g = GARAGE_DATA[i]
    const ownerEmail = `${g.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@garage.com`
    const owner = await prisma.user.create({ data: { name: `${g.name.split(' ')[0]} Owner`, email: ownerEmail, password: garagePwd, role: UserRole.GARAGE_OWNER } })
    const garage = await prisma.garage.create({
      data: {
        name: g.name,
        email: `${g.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@garage.co.uk`,
        phone: `01438${Math.floor(Math.random()*900000+100000)}`,
        address: g.address,
        city: g.city,
        postcode: g.postcode,
        latitude: 51.9,
        longitude: -0.2,
        motLicenseNumber: `MOT-${String(i+1).padStart(6,'0')}`,
        dvlaApproved: true,
        isActive: true,
        // Approval fields - garages in seed are pre-approved
        approvalStatus: GarageApprovalStatus.APPROVED,
        approvedAt: now,
        approvedById: admin.id,
        motPrice: g.motPrice,
        retestPrice: Math.round(g.motPrice*50)/100,
        ownerId: owner.id
      }
    })
    garages.push({ id: garage.id, name: garage.name, motPrice: garage.motPrice })

    // Create garage schedules (Monday = 1, Tuesday = 2, ..., Sunday = 0)
    const scheduleData = [
      { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Monday
      { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Tuesday
      { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Wednesday
      { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Thursday
      { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Friday
      { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '13:00', slotDuration: 60 }, // Saturday
      { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00', slotDuration: 60 }, // Sunday (closed)
    ]

    try {
      for (const schedule of scheduleData) {
        await prisma.garageSchedule.create({
          data: {
            garageId: garage.id,
            ...schedule
          }
        })
      }
    } catch (error) {
      console.error(`❌ Erro ao criar schedules para garagem ${garage.name}:`, error)
      throw error
    }
  }
  
  console.log(`✅ Criados schedules para ${garages.length} garagens`)

  const vehicles: Array<{ id: string; ownerId: string }> = []
  for (let i = 0; i < customers.length; i++) {
    let count = 1
    if (i < 25) count = 2
    if (i < 10) count = 3
    for (let v = 0; v < count; v++) {
      const tpl = VEHICLE_DATA[Math.floor(Math.random()*VEHICLE_DATA.length)]
      const vehicle = await prisma.vehicle.create({
        data: {
          registration: reg(),
          make: tpl.make,
          model: tpl.model,
          year: Math.floor(Math.random()*15)+2010,
          color: ['Black','White','Silver','Blue','Red'][Math.floor(Math.random()*5)],
          fuelType: tpl.fuelType,
          engineSize: tpl.fuelType === FuelType.ELECTRIC ? null : `${Math.floor(Math.random()*20+10)/10}L`,
          mileage: Math.floor(Math.random()*100000)+10000,
          ownerId: customers[i].id
        }
      })
      vehicles.push({ id: vehicle.id, ownerId: customers[i].id })
    }
  }

  if (vehicles.length !== 65) throw new Error(`Esperado 65 veículos, obtido ${vehicles.length}`)

  const booked = new Set<string>()
  const dates: Date[] = []
  for (let d = 1; d <= 31; d++) { const date = new Date(2025, 11, d); if (date.getDay() !== 0) dates.push(date) }
  let bookingCount = 0
  while (bookingCount < 43) {
    const customer = customers[Math.floor(Math.random()*customers.length)]
    const cvs = vehicles.filter(v => v.ownerId === customer.id)
    const vehicle = cvs[Math.floor(Math.random()*cvs.length)]
    const garage = garages[Math.floor(Math.random()*garages.length)]
    const date = dates[Math.floor(Math.random()*dates.length)]
    const timeSlot = TIME_SLOTS[Math.floor(Math.random()*TIME_SLOTS.length)]
    const key = `${garage.id}-${date.toISOString().split('T')[0]}-${timeSlot}`
    if (booked.has(key)) continue
    booked.add(key)
    const status = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED][Math.floor(Math.random()*3)]
    await prisma.booking.create({
      data: {
        date,
        timeSlot,
        status,
        totalPrice: garage.motPrice,
        customerId: customer.id,
        garageId: garage.id,
        vehicleId: vehicle.id,
        paymentStatus: status === BookingStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.PENDING,
        paidAt: status === BookingStatus.COMPLETED ? date : null
      }
    })
    bookingCount++
  }

  const [customerCount, ownerCount, vehicleCount, garageCount, bookingsCount] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.user.count({ where: { role: UserRole.GARAGE_OWNER } }),
    prisma.vehicle.count(),
    prisma.garage.count(),
    prisma.booking.count()
  ])

  console.log(`✅ Contagens — customers: ${customerCount}, garage owners: ${ownerCount}, vehicles: ${vehicleCount}, garages: ${garageCount}, bookings: ${bookingsCount}`)
  if (customerCount !== 30 || ownerCount !== 10 || vehicleCount !== 65 || garageCount !== 10 || bookingsCount !== 43) {
    throw new Error('Contagens finais não conferem com o esperado')
  }

  await prisma.$disconnect()
  console.log('✨ Seed concluído com sucesso')
}

seedDatabase()
