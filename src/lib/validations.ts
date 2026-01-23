import { z } from 'zod'
import { UserRole, FuelType, BookingStatus } from '@prisma/client'

// User validation schemas
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  // Garage-specific fields
  garageName: z.string().optional(),
  garageAddress: z.string().optional(),
  garageCity: z.string().optional(),
  garagePostcode: z.string().optional(),
  garagePhone: z.string().optional(),
  garageEmail: z.string().email().optional(),
  motLicenseNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === UserRole.GARAGE_OWNER) {
    return data.garageName && data.garageAddress && data.garageCity && 
           data.garagePostcode && data.garagePhone && data.garageEmail && 
           data.motLicenseNumber
  }
  return true
}, {
  message: "All garage fields are required for garage owners",
  path: ["garageName"],
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
})

// Vehicle validation schemas
export const createVehicleSchema = z.object({
  registration: z.string()
    .min(2, 'Registration must be at least 2 characters')
    .max(10, 'Registration must be less than 10 characters')
    .regex(/^[A-Z0-9\s]+$/, 'Registration must contain only letters, numbers, and spaces'),
  make: z.string().min(1, 'Make is required').max(50, 'Make must be less than 50 characters'),
  model: z.string().min(1, 'Model is required').max(50, 'Model must be less than 50 characters'),
  year: z.number()
    .min(1900, 'Year must be after 1900')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  color: z.string().max(30, 'Color must be less than 30 characters').optional(),
  fuelType: z.nativeEnum(FuelType),
  engineSize: z.string().max(10, 'Engine size must be less than 10 characters').optional(),
  mileage: z.number().min(0, 'Mileage cannot be negative').max(999999, 'Mileage seems too high').optional(),
})

export const updateVehicleSchema = createVehicleSchema.partial().omit({ registration: true })

// Garage validation schemas
export const createGarageSchema = z.object({
  name: z.string().min(2, 'Garage name must be at least 2 characters').max(100, 'Garage name must be less than 100 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address must be less than 200 characters'),
  city: z.string().min(2, 'City must be at least 2 characters').max(50, 'City must be less than 50 characters'),
  postcode: z.string()
    .min(5, 'Postcode must be at least 5 characters')
    .max(10, 'Postcode must be less than 10 characters')
    .regex(/^[A-Z0-9\s]+$/i, 'Invalid postcode format'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must be less than 15 characters')
    .regex(/^[0-9\s\+\-\(\)]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address'),
  motLicenseNumber: z.string().min(5, 'MOT license number must be at least 5 characters').max(20, 'MOT license number must be less than 20 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export const updateGarageSchema = createGarageSchema.partial().omit({ motLicenseNumber: true })

// Booking validation schemas
export const createBookingSchema = z.object({
  garageId: z.string().cuid('Invalid garage ID'),
  vehicleId: z.string().cuid('Invalid vehicle ID'),
  date: z.string().refine((date) => {
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }, 'Booking date must be today or in the future'),
  timeSlot: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const updateBookingSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

// Review validation schemas
export const createReviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
  bookingId: z.string().cuid('Invalid booking ID'),
})

// Search and filter schemas
export const garageSearchSchema = z.object({
  city: z.string().optional(),
  postcode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(100).optional(), // in kilometers
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
})

export const bookingSearchSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
})

export const vehicleSearchSchema = z.object({
  make: z.string().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  yearFrom: z.number().min(1900).optional(),
  yearTo: z.number().max(new Date().getFullYear() + 1).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
})

// Utility validation functions
export function validateUKPostcode(postcode: string): boolean {
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i
  return ukPostcodeRegex.test(postcode.replace(/\s/g, ''))
}

export function validateUKRegistration(registration: string): boolean {
  // UK registration patterns (simplified)
  const patterns = [
    /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$/, // Current format (AB12 CDE)
    /^[A-Z][0-9]{1,3}\s?[A-Z]{3}$/, // Prefix format (A123 BCD)
    /^[A-Z]{3}\s?[0-9]{1,3}[A-Z]$/, // Suffix format (ABC 123D)
    /^[0-9]{1,4}\s?[A-Z]{1,3}$/, // Dateless format (1234 AB)
  ]
  
  return patterns.some(pattern => pattern.test(registration.replace(/\s/g, '')))
}

export function validatePhoneNumber(phone: string): boolean {
  // UK phone number validation (simplified)
  const ukPhoneRegex = /^(?:(?:\+44)|(?:0))(?:[1-9]\d{8,9})$/
  return ukPhoneRegex.test(phone.replace(/\s/g, ''))
}

// Date validation utilities
export function isValidBookingDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 6) // Allow booking up to 6 months in advance
  
  return date >= today && date <= maxDate
}

export function isValidTimeSlot(timeSlot: string): boolean {
  // Validate time slot format (HH:MM) and check if minutes are 00 or 30
  const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
  if (!timeSlotRegex.test(timeSlot)) {
    return false
  }
  
  const [, , minutes] = timeSlot.match(timeSlotRegex) || []
  // Accept slots at :00 or :30 (30-minute intervals)
  return minutes === '00' || minutes === '30'
}

// MOT validation utilities
export function isMotRequired(vehicleYear: number): boolean {
  const currentYear = new Date().getFullYear()
  return (currentYear - vehicleYear) >= 3
}

export function calculateMotExpiry(testDate: Date): Date {
  const expiryDate = new Date(testDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)
  return expiryDate
}

// Type exports for use in components
export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>
export type CreateGarageFormData = z.infer<typeof createGarageSchema>
export type CreateBookingFormData = z.infer<typeof createBookingSchema>
export type CreateReviewFormData = z.infer<typeof createReviewSchema>
export type GarageSearchFormData = z.infer<typeof garageSearchSchema>
export type BookingSearchFormData = z.infer<typeof bookingSearchSchema>
export type VehicleSearchFormData = z.infer<typeof vehicleSearchSchema>