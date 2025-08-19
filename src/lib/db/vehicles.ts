import { prisma } from '@/lib/prisma'
import { FuelType, Prisma } from '@prisma/client'

export interface CreateVehicleData {
  registration: string
  make: string
  model: string
  year: number
  color?: string
  fuelType: FuelType
  engineSize?: string
  mileage?: number
  ownerId: string
}

export interface UpdateVehicleData {
  make?: string
  model?: string
  year?: number
  color?: string
  fuelType?: FuelType
  engineSize?: string
  mileage?: number
}

export interface VehicleFilters {
  ownerId?: string
  make?: string
  fuelType?: FuelType
  yearFrom?: number
  yearTo?: number
}

// Create a new vehicle
export async function createVehicle(data: CreateVehicleData) {
  // Check if registration already exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { registration: data.registration.toUpperCase() }
  })

  if (existingVehicle) {
    throw new Error('Vehicle with this registration already exists')
  }

  return await prisma.vehicle.create({
    data: {
      registration: data.registration.toUpperCase(),
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      fuelType: data.fuelType,
      engineSize: data.engineSize,
      mileage: data.mileage,
      ownerId: data.ownerId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      _count: {
        select: {
          bookings: true,
          motHistory: true
        }
      }
    }
  })
}

// Get vehicle by ID
export async function getVehicleById(id: string) {
  return await prisma.vehicle.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      bookings: {
        include: {
          garage: {
            select: {
              id: true,
              name: true,
              address: true,
            }
          },
          motResult: true
        },
        orderBy: {
          date: 'desc'
        }
      },
      motHistory: {
        orderBy: {
          testDate: 'desc'
        }
      }
    }
  })
}

// Get vehicle by registration
export async function getVehicleByRegistration(registration: string) {
  return await prisma.vehicle.findUnique({
    where: { registration: registration.toUpperCase() },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      motHistory: {
        orderBy: {
          testDate: 'desc'
        },
        take: 5 // Get last 5 MOT records
      }
    }
  })
}

// Get vehicles with filters
export async function getVehicles(filters: VehicleFilters = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  
  const where: Prisma.VehicleWhereInput = {}

  if (filters.ownerId) {
    where.ownerId = filters.ownerId
  }

  if (filters.make) {
    where.make = {
      contains: filters.make
    }
  }

  if (filters.fuelType) {
    where.fuelType = filters.fuelType
  }

  if (filters.yearFrom || filters.yearTo) {
    where.year = {}
    if (filters.yearFrom) {
      where.year.gte = filters.yearFrom
    }
    if (filters.yearTo) {
      where.year.lte = filters.yearTo
    }
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            bookings: true,
            motHistory: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.vehicle.count({ where })
  ])

  return {
    vehicles,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  }
}

// Get vehicles by owner
export async function getVehiclesByOwner(ownerId: string) {
  return await prisma.vehicle.findMany({
    where: { ownerId },
    include: {
      bookings: {
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        include: {
          garage: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      },
      motHistory: {
        orderBy: {
          testDate: 'desc'
        },
        take: 1 // Get latest MOT record
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Update vehicle
export async function updateVehicle(id: string, data: UpdateVehicleData) {
  return await prisma.vehicle.update({
    where: { id },
    data,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  })
}

// Delete vehicle
export async function deleteVehicle(id: string) {
  // Check if vehicle has any bookings
  const bookingCount = await prisma.booking.count({
    where: {
      vehicleId: id,
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    }
  })

  if (bookingCount > 0) {
    throw new Error('Cannot delete vehicle with active bookings')
  }

  return await prisma.vehicle.delete({
    where: { id }
  })
}

// Get vehicle MOT history
export async function getVehicleMotHistory(vehicleId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  
  const [motHistory, total] = await Promise.all([
    prisma.motHistory.findMany({
      where: { vehicleId },
      skip,
      take: limit,
      orderBy: {
        testDate: 'desc'
      }
    }),
    prisma.motHistory.count({ where: { vehicleId } })
  ])

  return {
    motHistory,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  }
}

// Get latest MOT for vehicle
export async function getLatestMot(vehicleId: string) {
  return await prisma.motHistory.findFirst({
    where: { vehicleId },
    orderBy: {
      testDate: 'desc'
    }
  })
}

// Check if vehicle needs MOT
export async function checkMotStatus(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      year: true,
      registration: true
    }
  })

  if (!vehicle) {
    throw new Error('Vehicle not found')
  }

  // Vehicles need MOT after they are 3 years old
  const currentYear = new Date().getFullYear()
  const vehicleAge = currentYear - vehicle.year
  
  if (vehicleAge < 3) {
    return {
      needsMot: false,
      reason: 'Vehicle is less than 3 years old'
    }
  }

  // Get latest MOT
  const latestMot = await getLatestMot(vehicleId)
  
  if (!latestMot) {
    return {
      needsMot: true,
      reason: 'No MOT record found',
      overdue: true
    }
  }

  const now = new Date()
  const expiryDate = latestMot.expiryDate
  
  if (!expiryDate) {
    return {
      needsMot: true,
      reason: 'MOT failed or no expiry date',
      overdue: true
    }
  }

  const isExpired = now > expiryDate
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    needsMot: isExpired || daysUntilExpiry <= 30,
    reason: isExpired ? 'MOT has expired' : daysUntilExpiry <= 30 ? 'MOT expires soon' : 'MOT is valid',
    overdue: isExpired,
    expiryDate,
    daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
    latestResult: latestMot.result
  }
}

// Get vehicle statistics
export async function getVehicleStats(ownerId?: string) {
  const where: Prisma.VehicleWhereInput = ownerId ? { ownerId } : {}
  
  const [fuelTypeStats, yearStats, totalVehicles] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ['fuelType'],
      where,
      _count: {
        fuelType: true
      }
    }),
    prisma.vehicle.groupBy({
      by: ['year'],
      where,
      _count: {
        year: true
      },
      orderBy: {
        year: 'desc'
      }
    }),
    prisma.vehicle.count({ where })
  ])

  return {
    fuelTypeStats,
    yearStats,
    totalVehicles
  }
}

// Search vehicles by registration (partial match)
export async function searchVehiclesByRegistration(query: string, limit = 10) {
  return await prisma.vehicle.findMany({
    where: {
      registration: {
        contains: query.toUpperCase()
      }
    },
    take: limit,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
    orderBy: {
      registration: 'asc'
    }
  })
}