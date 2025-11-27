import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CreateGarageData {
  name: string
  address: string
  city: string
  postcode: string
  phone: string
  email: string
  motLicenseNumber: string
  dvlaApproved?: boolean
  latitude?: number
  longitude?: number
  description?: string
  ownerId: string
}

export interface UpdateGarageData {
  name?: string
  address?: string
  city?: string
  postcode?: string
  phone?: string
  email?: string
  description?: string
  latitude?: number
  longitude?: number
  isActive?: boolean
  dvlaApproved?: boolean
}

export interface GarageSearchFilters {
  city?: string
  postcode?: string
  isActive?: boolean
  dvlaApproved?: boolean
  latitude?: number
  longitude?: number
  radius?: number // in kilometers
}

// Create a new garage
export async function createGarage(data: CreateGarageData) {
  return await prisma.garage.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      postcode: data.postcode,
      phone: data.phone,
      email: data.email,
      motLicenseNumber: data.motLicenseNumber,
      dvlaApproved: data.dvlaApproved || false,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      ownerId: data.ownerId,
    },
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

// Get garage by ID
export async function getGarageById(id: string) {
  return await prisma.garage.findUnique({
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
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          vehicle: true
        },
        orderBy: {
          date: 'asc'
        }
      },
      reviews: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
}

// Get garage by owner ID
export async function getGarageByOwnerId(ownerId: string) {
  return await prisma.garage.findUnique({
    where: { ownerId },
    include: {
      bookings: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          },
          vehicle: true
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
  })
}

// Search garages with filters
export async function searchGarages(filters: GarageSearchFilters = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  
  const where: Prisma.GarageWhereInput = {
    isActive: filters.isActive !== undefined ? filters.isActive : true,
    dvlaApproved: filters.dvlaApproved !== undefined ? filters.dvlaApproved : true,
  }

  if (filters.city) {
    where.city = {
      contains: filters.city
    }
  }

  if (filters.postcode) {
    where.postcode = {
      contains: filters.postcode
    }
  }

  // For location-based search, we'll use a simple bounding box for now
  // In production, you might want to use PostGIS or similar for more accurate distance calculations
  if (filters.latitude && filters.longitude && filters.radius) {
    const radiusInDegrees = filters.radius / 111 // Rough conversion: 1 degree ≈ 111 km
    
    where.AND = [
      {
        latitude: {
          gte: filters.latitude - radiusInDegrees,
          lte: filters.latitude + radiusInDegrees
        }
      },
      {
        longitude: {
          gte: filters.longitude - radiusInDegrees,
          lte: filters.longitude + radiusInDegrees
        }
      }
    ]
  }

  const [garages, total] = await Promise.all([
    prisma.garage.findMany({
      where,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          }
        },
        reviews: {
          select: {
            rating: true,
          }
        },
        _count: {
          select: {
            reviews: true,
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.garage.count({ where })
  ])

  // Calculate average rating for each garage
  const garagesWithRating = garages.map(garage => {
    const totalRating = garage.reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = garage.reviews.length > 0 ? totalRating / garage.reviews.length : 0
    
    return {
      ...garage,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: garage._count.reviews,
      bookingCount: garage._count.bookings
    }
  })

  return {
    garages: garagesWithRating,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  }
}

// Update garage
export async function updateGarage(id: string, data: UpdateGarageData) {
  return await prisma.garage.update({
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

// Get nearby garages (simplified version)
export async function getNearbyGarages(latitude: number, longitude: number, radiusKm = 10, limit = 10) {
  const radiusInDegrees = radiusKm / 111
  
  return await prisma.garage.findMany({
    where: {
      isActive: true,
      dvlaApproved: true,
      latitude: {
        gte: latitude - radiusInDegrees,
        lte: latitude + radiusInDegrees
      },
      longitude: {
        gte: longitude - radiusInDegrees,
        lte: longitude + radiusInDegrees
      }
    },
    take: limit,
    include: {
      reviews: {
        select: {
          rating: true,
        }
      },
      _count: {
        select: {
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Get garage statistics
export async function getGarageStats(garageId: string) {
  const [bookingStats, reviewStats] = await Promise.all([
    prisma.booking.groupBy({
      by: ['status'],
      where: {
        garageId
      },
      _count: {
        status: true
      }
    }),
    prisma.review.aggregate({
      where: {
        garageId
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })
  ])

  return {
    bookings: bookingStats,
    averageRating: reviewStats._avg.rating || 0,
    totalReviews: reviewStats._count.rating
  }
}