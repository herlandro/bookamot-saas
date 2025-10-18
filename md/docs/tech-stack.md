# Tech Stack

This document describes the actual technology stack used in the BookaMOT project.

---

## Frontend

### Core Framework
- **Next.js 15** - React framework with App Router
- **TypeScript** - Strict type safety throughout the application
- **React 19** - Latest React features

### UI & Styling
- **Shadcn UI** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Framer Motion** - Animation library (optional)

### State Management
- **React Hooks** - Built-in state management (useState, useEffect, etc.)
- **NextAuth Session** - Authentication state via useSession hook

---

## Backend

### Database
- **PostgreSQL** - Primary database (hosted on Coolify VPS)
- **Prisma 5** - ORM for type-safe database access
- **Prisma Migrate** - Database migration management

### Authentication
- **NextAuth.js v4** - Authentication solution
- **Credentials Provider** - Email/password authentication
- **JWT Strategy** - Session management with JSON Web Tokens
- **bcryptjs** - Password hashing

### API
- **Next.js API Routes** - Serverless API endpoints
- **Server Actions** - Next.js 15 server-side functions
- **REST API** - Standard HTTP methods (GET, POST, PUT, DELETE)

### Services
- **Geocoding Service** - Custom implementation for address → coordinates
  - Database lookup (exact match)
  - Database area match (postcode prefix)
  - External API fallback (Nominatim)
- **Distance Calculation** - Haversine formula for garage search

---

## Development Tools

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### Build & Development
- **Turbopack** - Fast bundler (Next.js 15)
- **npm** - Package manager
- **Git** - Version control

---

## Deployment

### Production Environment
- **Coolify VPS** - Self-hosted deployment platform
- **PostgreSQL** - Production database on Coolify
- **Node.js** - Runtime environment
- **Standalone Build** - Optimized production build

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - JWT signing secret

---

## Key Dependencies

### Production Dependencies
```json
{
  "next": "^15.x",
  "react": "^19.x",
  "next-auth": "^4.24.x",
  "@prisma/client": "^5.x",
  "bcryptjs": "^2.4.x",
  "tailwindcss": "^4.x",
  "@radix-ui/react-*": "Latest",
  "lucide-react": "Latest"
}
```

### Development Dependencies
```json
{
  "prisma": "^5.x",
  "typescript": "^5.x",
  "eslint": "^8.x",
  "@types/node": "^20.x",
  "@types/react": "^19.x"
}
```

---

## Architecture Decisions

### Why NextAuth instead of Supabase Auth?
- ✅ Full control over authentication logic
- ✅ Works with any database (PostgreSQL via Prisma)
- ✅ Flexible provider system
- ✅ No vendor lock-in

### Why PostgreSQL instead of Supabase?
- ✅ Self-hosted on Coolify VPS
- ✅ Full database control
- ✅ No external dependencies
- ✅ Cost-effective for production

### Why Coolify instead of Vercel?
- ✅ Self-hosted deployment
- ✅ Full infrastructure control
- ✅ Cost-effective for production
- ✅ PostgreSQL included

### Why Prisma?
- ✅ Type-safe database queries
- ✅ Excellent TypeScript integration
- ✅ Migration management
- ✅ Great developer experience

---

## Not Used (Despite Common Assumptions)

The following technologies are **NOT** used in this project:

- ❌ **Supabase** - Using PostgreSQL + NextAuth instead
- ❌ **Vercel AI SDK** - No AI features implemented
- ❌ **Stripe** - No payment processing implemented
- ❌ **Zod** - Using TypeScript for validation
- ❌ **Upstash** - No rate limiting implemented
- ❌ **Jest** - No testing framework configured yet
- ❌ **DVLA API** - No external vehicle lookup integration

---

## Related Documentation

- **Architecture:** [architecture.md](architecture.md)
- **Database Schema:** `../../prisma/schema.prisma`
- **Authentication:** `../../src/lib/auth.ts`
- **Geocoding Service:** [geocoding-service.md](geocoding-service.md)
- **Deployment Guide:** [../../readme/DEPLOY.md](../../readme/DEPLOY.md)

---

**Last Updated:** October 18, 2025
**Version:** 1.0 (Corrected to reflect actual implementation)