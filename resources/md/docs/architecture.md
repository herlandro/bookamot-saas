# Architecture Overview

## Purpose

This document provides a high-level overview of the BookaMOT system architecture, orienting developers quickly and linking to detailed documentation.

---

## 1) Project Summary

### Product
**BookaMOT** - A web application that simplifies MOT test booking for UK vehicle owners by connecting them with approved MOT testing stations.

### Scope
**Primary Capabilities:**
- User authentication (customers and garage owners)
- Vehicle management with registration lookup
- Distance-based garage search with geocoding
- MOT booking system with time slot management
- Garage dashboard for booking management
- Onboarding flow for new users

**Target Users:**
- Vehicle owners seeking convenient MOT booking
- Garage owners needing efficient booking management

**Boundaries (What We Don't Do):**
- Payment processing (not implemented)
- DVLA API integration (not implemented)
- Mobile app (web-only)
- Non-MOT automotive services

### Design Drivers
- **Time-to-market:** Rapid development with Next.js 15
- **Cost:** Self-hosted on Coolify VPS
- **Simplicity:** Monolithic Next.js app (no microservices)
- **Developer Experience:** TypeScript + Prisma for type safety

---

## 2) System Overview

### Architecture
**Monolithic Next.js Application** with server-side rendering, API routes, and PostgreSQL database.

**Stack:**
- **Frontend:** Next.js 15 App Router + React 19 + Tailwind CSS + Shadcn UI
- **Backend:** Next.js API Routes + Prisma ORM + PostgreSQL
- **Authentication:** NextAuth.js with JWT sessions
- **Deployment:** Coolify VPS (self-hosted)

**Tech Stack:** See [tech-stack.md](tech-stack.md) for complete details.

### Trust Boundaries & Data Sensitivity
- **PII Protection:** User emails, names, phone numbers, vehicle registrations
- **Auth Tokens:** JWT tokens stored in HTTP-only cookies
- **Secrets Management:** Environment variables (`.env` file)
- **Database Access:** Prisma ORM with parameterized queries (SQL injection protection)

### External Integrations
- **Nominatim API:** Geocoding fallback (address → coordinates)
- **No payment providers** (Stripe not implemented)
- **No AI services** (not implemented)
- **No analytics** (not implemented)

---

## 3) Core Components

### Web App (Next.js)
- **App Router:** File-based routing in `src/app/`
- **Server Components:** Default rendering strategy
- **Client Components:** Used only for interactivity (forms, modals)
- **UI Components:** Shadcn UI + custom components
- **Styling:** Tailwind CSS with custom design system

### API Layer (Next.js API Routes)
- **Location:** `src/app/api/`
- **Authentication:** NextAuth endpoints (`/api/auth/*`)
- **Resources:** Users, vehicles, garages, bookings
- **Validation:** TypeScript types + runtime checks
- **Error Handling:** Standardized JSON error responses

### Database (PostgreSQL + Prisma)
- **ORM:** Prisma 5 for type-safe queries
- **Schema:** `prisma/schema.prisma`
- **Migrations:** Prisma Migrate for version control
- **Seeding:** `prisma/seed.ts` for test data
- **Models:** User, Vehicle, Garage, Booking, GarageAvailability, MotHistory

### Authentication (NextAuth.js)
- **Provider:** Credentials (email/password)
- **Strategy:** JWT sessions (30-day expiry)
- **Password Hashing:** bcryptjs
- **Session Storage:** HTTP-only cookies
- **Role-Based Access:** CUSTOMER, GARAGE_OWNER, ADMIN

### Geocoding Service
- **Custom Implementation:** 3-tier strategy
  1. Database exact match (postcode → coordinates)
  2. Database area match (postcode prefix)
  3. External API fallback (Nominatim)
- **Distance Calculation:** Haversine formula
- **Location:** `src/lib/geocoding.ts`

---

## 4) Application Flows

### Authentication Flow
1. User submits credentials → `/api/auth/signin`
2. NextAuth validates → bcrypt password check
3. JWT token generated → stored in HTTP-only cookie
4. Session propagated to client via `useSession` hook

**Detailed Documentation:** [app-flows/onboarding-flow.md](app-flows/onboarding-flow.md)

### Booking Flow
1. Customer searches garages by postcode
2. Geocoding service finds coordinates
3. Haversine formula calculates distances
4. Customer selects garage + time slot
5. Booking created in database
6. Garage owner sees booking in dashboard

**Detailed Documentation:** [app-flows/booking-flow.md](app-flows/booking-flow.md)

### Vehicle Registration Flow
1. Customer enters vehicle registration
2. Manual entry of make, model, year, fuel type
3. Vehicle saved to database
4. Linked to customer account

**Detailed Documentation:** [app-flows/vehicle-registration-flow.md](app-flows/vehicle-registration-flow.md)

### Garage Registration Flow
1. Garage owner creates account
2. Enters garage details (name, address, postcode)
3. Geocoding service extracts coordinates
4. Garage saved with location data
5. Owner can manage availability

**Detailed Documentation:** [app-flows/garage-registration-flow.md](app-flows/garage-registration-flow.md)

---

## 5) Data & Security

### Database Schema
- **Location:** `prisma/schema.prisma`
- **Key Models:** User, Vehicle, Garage, Booking, GarageAvailability
- **Relationships:** One-to-many (User → Vehicles, Garage → Bookings)
- **Indexes:** Email (unique), postcode, garage coordinates

### Access Control
- **Authentication Required:** All API routes except auth endpoints
- **Session Validation:** `getServerSession(authOptions)` in API routes
- **Role-Based Access:**
  - Customers: Own vehicles and bookings
  - Garage Owners: Own garage and bookings
  - Admin: Full access (not implemented)

### Security Measures
- **Password Hashing:** bcryptjs with salt rounds = 12
- **SQL Injection Protection:** Prisma parameterized queries
- **XSS Protection:** React automatic escaping
- **CSRF Protection:** NextAuth built-in
- **Secrets:** Environment variables (never committed)
- **HTTPS:** Required in production (Coolify handles SSL)

### Data Validation
- **TypeScript:** Compile-time type checking
- **Runtime Validation:** Manual checks in API routes
- **Email Format:** Regex validation
- **Password Strength:** Minimum 6 characters (basic)

---

## 6) Quality & Performance

### Performance
- **Server-Side Rendering:** Fast initial page load
- **Static Generation:** Where possible (ISR not heavily used)
- **Database Queries:** Optimized with Prisma includes
- **N+1 Prevention:** Prisma eager loading
- **Image Optimization:** Next.js Image component (not heavily used)

### Reliability
- **Error Handling:** Try-catch blocks in all API routes
- **Graceful Degradation:** Geocoding fallback strategy
- **Database Transactions:** Not implemented (future improvement)

### Observability
- **Logging:** Console logs (basic)
- **Error Tracking:** Not implemented
- **Metrics:** Not implemented
- **Monitoring:** Not implemented

### Cost Optimization
- **Self-Hosted:** Coolify VPS (fixed monthly cost)
- **No Serverless:** Traditional server deployment
- **Database:** PostgreSQL on same VPS (no external DB costs)

---

## 7) Key Architectural Decisions

### Next.js 15 with App Router
**Why:** Modern React framework with excellent DX, SSR, and API routes in one package.

### NextAuth.js instead of Supabase Auth
**Why:**
- Full control over authentication logic
- Works with any database (PostgreSQL via Prisma)
- No vendor lock-in
- Flexible and well-documented

### PostgreSQL + Prisma instead of Supabase
**Why:**
- Self-hosted on Coolify VPS (cost-effective)
- Full database control
- Type-safe queries with Prisma
- No external dependencies

### Coolify VPS instead of Vercel
**Why:**
- Self-hosted deployment (full control)
- Cost-effective for production
- PostgreSQL included
- No vendor lock-in

### Monolithic Architecture
**Why:**
- Simpler deployment and development
- Faster initial development
- Sufficient for current scale
- Can split later if needed

### Custom Geocoding Service
**Why:**
- Reduce external API calls (cost + latency)
- Database caching of coordinates
- Fallback strategy for reliability

---

## 8) Documentation References

### Core Documentation
- **Tech Stack:** [tech-stack.md](tech-stack.md)
- **Database Schema:** `../../prisma/schema.prisma`
- **Design Guidelines:** [design-guidelines.md](design-guidelines.md)

### Application Flows
- **Flow Index:** [app-flows/README.md](app-flows/README.md)
- **Onboarding:** [app-flows/onboarding-flow.md](app-flows/onboarding-flow.md)
- **Booking:** [app-flows/booking-flow.md](app-flows/booking-flow.md)
- **Vehicle Registration:** [app-flows/vehicle-registration-flow.md](app-flows/vehicle-registration-flow.md)
- **Garage Registration:** [app-flows/garage-registration-flow.md](app-flows/garage-registration-flow.md)

### Services
- **Geocoding:** [geocoding-service.md](geocoding-service.md)
- **Authentication:** `../../src/lib/auth.ts`

### Setup & Deployment
- **Development Setup:** [../../readme/SETUP-DEV.md](../../readme/SETUP-DEV.md)
- **Deployment Guide:** [../../readme/DEPLOY.md](../../readme/DEPLOY.md)
- **Scalability Roadmap:** [../../readme/SCALABILITY-ROADMAP.md](../../readme/SCALABILITY-ROADMAP.md)

### Database
- **Seeding Guide:** [database-seeding-quick-reference.md](database-seeding-quick-reference.md)
- **Test Credentials:** [SEED_DATA_CREDENTIALS.md](SEED_DATA_CREDENTIALS.md)

---

**Last Updated:** October 18, 2025
**Version:** 1.0 (Corrected to reflect actual implementation)