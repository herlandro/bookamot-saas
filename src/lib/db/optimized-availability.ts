import { prisma } from '@/lib/prisma'

// Função otimizada para calcular disponibilidade dinamicamente
export async function getAvailableTimeSlotsOptimized(garageId: string, date: Date) {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Buscar horário de funcionamento da garagem para o dia da semana
  const schedule = await prisma.garageSchedule.findUnique({
    where: {
      garageId_dayOfWeek: {
        garageId,
        dayOfWeek
      }
    }
  })
  
  // Se não há horário definido ou garagem fechada, retornar array vazio
  if (!schedule || !schedule.isOpen) {
    return []
  }
  
  // Verificar se há exceção para esta data específica
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  
  const exception = await prisma.garageScheduleException.findUnique({
    where: {
      garageId_date: {
        garageId,
        date: startOfDay
      }
    }
  })
  
  // Se há exceção e garagem está fechada, retornar array vazio
  if (exception && exception.isClosed) {
    return []
  }
  
  // Usar horários da exceção se existir, senão usar horário padrão
  const openTime = exception?.openTime || schedule.openTime
  const closeTime = exception?.closeTime || schedule.closeTime
  const slotDuration = schedule.slotDuration
  
  // Gerar slots de tempo baseado no horário de funcionamento
  const timeSlots = generateTimeSlots(openTime, closeTime, slotDuration)
  
  // Buscar agendamentos existentes para o dia
  const existingBookings = await prisma.booking.findMany({
    where: {
      garageId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    },
    select: {
      timeSlot: true
    }
  })
  
  // Buscar bloqueios específicos para o dia
  const blockedSlots = await prisma.garageTimeSlotBlock.findMany({
    where: {
      garageId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    select: {
      timeSlot: true
    }
  })
  
  const bookedTimeSlots = existingBookings.map(booking => booking.timeSlot)
  const blockedTimeSlots = blockedSlots.map((block: { timeSlot: string }) => block.timeSlot)
  const unavailableSlots = [...bookedTimeSlots, ...blockedTimeSlots]
  
  // Filtrar slots disponíveis
  const availableSlots = timeSlots.filter(slot => !unavailableSlots.includes(slot))
  
  return availableSlots
}

// Função auxiliar para gerar slots de tempo
function generateTimeSlots(openTime: string, closeTime: string, durationMinutes: number): string[] {
  const slots: string[] = []
  
  const [openHour, openMinute] = openTime.split(':').map(Number)
  const [closeHour, closeMinute] = closeTime.split(':').map(Number)
  
  const openTimeInMinutes = openHour * 60 + openMinute
  const closeTimeInMinutes = closeHour * 60 + closeMinute
  
  for (let time = openTimeInMinutes; time < closeTimeInMinutes; time += durationMinutes) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    const timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    slots.push(timeSlot)
  }
  
  return slots
}

// Função para criar horário padrão para uma garagem
export async function createDefaultScheduleForGarage(garageId: string) {
  const defaultSchedule = [
    { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Monday
    { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Tuesday
    { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Wednesday
    { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Thursday
    { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Friday
    { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '13:00' }, // Saturday (half day)
    { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' }, // Sunday (closed)
  ]
  
  for (const schedule of defaultSchedule) {
    await prisma.garageSchedule.upsert({
      where: {
        garageId_dayOfWeek: {
          garageId,
          dayOfWeek: schedule.dayOfWeek
        }
      },
      update: schedule,
      create: {
        garageId,
        ...schedule
      }
    })
  }
}

// Função para migrar dados existentes
export async function migrateExistingAvailabilityData() {
  console.log('🔄 Iniciando migração de dados de disponibilidade...')
  
  // Buscar todas as garagens
  const garages = await prisma.garage.findMany({
    select: { id: true, name: true }
  })
  
  for (const garage of garages) {
    console.log(`📝 Criando horário padrão para ${garage.name}...`)
    await createDefaultScheduleForGarage(garage.id)
  }
  
  console.log('✅ Migração concluída!')
}

// Função para comparar performance
export async function comparePerformance(garageId: string, date: Date) {
  console.time('Método Original')
  const originalSlots = await getOriginalAvailableTimeSlots(garageId, date)
  console.timeEnd('Método Original')
  
  console.time('Método Otimizado')
  const optimizedSlots = await getAvailableTimeSlotsOptimized(garageId, date)
  console.timeEnd('Método Otimizado')
  
  console.log('Slots originais:', originalSlots)
  console.log('Slots otimizados:', optimizedSlots)
  
  return { originalSlots, optimizedSlots }
}

// Função original para comparação
async function getOriginalAvailableTimeSlots(garageId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const bookedSlots = await prisma.booking.findMany({
    where: {
      garageId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    },
    select: {
      timeSlot: true
    }
  })

  const standardSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ]

  const bookedTimeSlots = bookedSlots.map(slot => slot.timeSlot)
  const availableSlots = standardSlots.filter(slot => !bookedTimeSlots.includes(slot))

  return availableSlots
}