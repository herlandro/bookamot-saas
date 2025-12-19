import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: UserRole
  phone?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  phone?: string
}

// Create a new user
export async function createUser(data: CreateUserData) {
  const hashedPassword = await bcrypt.hash(data.password, 12)
  
  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || UserRole.CUSTOMER,
      phone: data.phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
    }
  })
}

// Get user by email
export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      emailVerified: true,
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          postcode: true,
          phone: true,
          email: true,
          isActive: true,
          dvlaApproved: true,
          approvalStatus: true,
        }
      }
    }
  })
}

// Get user by ID
export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          isActive: true,
          dvlaApproved: true,
        }
      }
    }
  })
}

// Update user
export async function updateUser(id: string, data: UpdateUserData) {
  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      updatedAt: true,
    }
  })
}

// Verify user password
export async function verifyPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
    }
  })

  if (!user || !user.password) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password)
  
  if (!isValid) {
    return null
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Get all users (admin only)
export async function getAllUsers(page = 1, limit = 10) {
  const skip = (page - 1) * limit
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        garage: {
          select: {
            id: true,
            name: true,
            isActive: true,
            dvlaApproved: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.count()
  ])

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  }
}