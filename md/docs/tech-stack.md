# Tech Stack

This document provides a comprehensive overview of the technology stack used in the BookaMOT SaaS application.

---

## 1. Core Framework & Runtime

### Frontend Framework
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.4.7 | React framework with App Router, server components, and API routes |
| **React** | 19.1.0 | UI library with latest features and hooks |
| **TypeScript** | ^5 | Static type checking and type safety |
| **Node.js** | Latest LTS | JavaScript runtime environment |

### Key Features
- ✅ **App Router** - File-based routing with nested layouts
- ✅ **Server Components** - Server-side rendering for performance
- ✅ **API Routes** - Built-in serverless API endpoints
- ✅ **Turbopack** - Fast bundler for development (`npm run dev --turbopack`)
- ✅ **Standalone Build** - Optimized production build for self-hosted deployment

---

## 2. UI & Styling

### CSS Framework
| Technology | Version | Purpose |
|---|---|---|
| **Tailwind CSS** | ^4 | Utility-first CSS framework for styling |
| **PostCSS** | Latest | CSS processing with `@tailwindcss/postcss` plugin |
| **Tailwind Merge** | ^3.3.1 | Utility class merging to prevent conflicts |

### UI Component Libraries
| Technology | Version | Purpose |
|---|---|---|
| **Radix UI** | Latest | Unstyled, accessible component primitives |
| **Shadcn UI** | Custom | Pre-built components built on Radix UI |
| **Class Variance Authority** | ^0.7.1 | CSS class composition for component variants |
| **clsx** | ^2.1.1 | Conditional CSS class names |

### Icon Library
| Technology | Version | Purpose |
|---|---|---|
| **Lucide React** | ^0.540.0 | Beautiful, consistent SVG icon library |

### Radix UI Components Used
- `@radix-ui/react-alert-dialog` - Alert dialogs
- `@radix-ui/react-collapsible` - Collapsible sections
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-label` - Form labels
- `@radix-ui/react-popover` - Popover tooltips
- `@radix-ui/react-select` - Select dropdowns
- `@radix-ui/react-tooltip` - Tooltips

### Animation & Visualization
| Technology | Version | Purpose |
|---|---|---|
| **GSAP** | ^3.13.0 | Advanced animations and transitions |
| **Recharts** | ^3.2.1 | React charting library for data visualization |

---

## 3. Backend & Database

### Database
| Technology | Version | Purpose |
|---|---|---|
| **PostgreSQL** | Latest | Relational database (self-hosted on Coolify VPS) |
| **Prisma** | ^6.14.0 | Type-safe ORM for database access |
| **Prisma Client** | ^6.14.0 | Generated database client |

### Prisma Features
- ✅ **Type-safe queries** - Full TypeScript support
- ✅ **Migrations** - Version-controlled schema changes
- ✅ **Seeding** - Database population scripts
- ✅ **Relations** - Automatic relationship handling

### Database Models
- **User** - Customer and garage owner accounts
- **Garage** - Garage business information
- **Vehicle** - Customer vehicles
- **Booking** - MOT test bookings
- **Review** - Bidirectional reviews (customer ↔ garage)
- **Availability** - Garage availability slots
- **Account/Session** - NextAuth authentication tables

---

## 4. Authentication & Security

### Authentication Framework
| Technology | Version | Purpose |
|---|---|---|
| **NextAuth.js** | ^4.24.11 | Authentication solution for Next.js |
| **NextAuth Prisma Adapter** | ^1.0.7 | Prisma database adapter for NextAuth |
| **bcryptjs** | ^3.0.2 | Password hashing and verification |

### Authentication Features
- ✅ **Credentials Provider** - Email/password authentication
- ✅ **JWT Strategy** - Secure session management with JSON Web Tokens
- ✅ **Role-based Access** - CUSTOMER and GARAGE_OWNER roles
- ✅ **Session Management** - Automatic session handling via `useSession` hook
- ✅ **Password Reset** - Token-based password recovery

### Security
- ✅ **Password Hashing** - bcryptjs for secure password storage
- ✅ **CSRF Protection** - Built-in NextAuth protection
- ✅ **Secure Cookies** - HttpOnly, Secure, SameSite flags
- ✅ **Environment Variables** - Sensitive data in `.env.local`

---

## 5. Form Handling & Validation

### Form Libraries
| Technology | Version | Purpose |
|---|---|---|
| **React Hook Form** | ^7.62.0 | Performant form state management |
| **Hook Form Resolvers** | ^5.2.1 | Validation schema integration |
| **Zod** | ^4.0.17 | TypeScript-first schema validation |

### Form Features
- ✅ **Uncontrolled Components** - Minimal re-renders
- ✅ **Schema Validation** - Zod for runtime validation
- ✅ **Error Handling** - Field-level error messages
- ✅ **Type Safety** - Full TypeScript support

---

## 6. Date & Time Handling

### Date Libraries
| Technology | Version | Purpose |
|---|---|---|
| **date-fns** | ^4.1.0 | Modern date utility library |
| **React Day Picker** | ^9.9.0 | Date picker component for React |

### Supported Locales
- English (enUS)
- Portuguese (ptBR)

### Features
- ✅ **Date Formatting** - Locale-aware date formatting
- ✅ **Date Calculations** - Add, subtract, compare dates
- ✅ **Timezone Support** - Proper timezone handling
- ✅ **Calendar UI** - Interactive date selection

---

## 7. Payment Processing

### Payment Gateway
| Technology | Version | Purpose |
|---|---|---|
| **Stripe** | ^18.4.0 | Payment processing backend |
| **Stripe.js** | ^7.8.0 | Stripe client-side library |

### Stripe Features
- ✅ **Payment Intent** - Secure payment processing
- ✅ **Webhook Handling** - Real-time payment updates
- ✅ **Customer Management** - Stripe customer profiles
- ✅ **Payment Methods** - Multiple payment options

---

## 8. Email & Notifications

### Email Service
| Technology | Version | Purpose |
|---|---|---|
| **Nodemailer** | ^6.10.1 | Email sending library |
| **Nodemailer Types** | ^7.0.1 | TypeScript type definitions |

### Email Features
- ✅ **SMTP Support** - Email server integration
- ✅ **HTML Templates** - Rich email formatting
- ✅ **Attachments** - File attachments support
- ✅ **Async Sending** - Non-blocking email delivery

---

## 9. Development Tools

### Code Quality & Linting
| Technology | Version | Purpose |
|---|---|---|
| **ESLint** | ^9 | JavaScript/TypeScript linting |
| **ESLint Config Next** | 15.4.7 | Next.js ESLint configuration |
| **TypeScript ESLint** | Latest | TypeScript support for ESLint |

### Build & Development
| Technology | Version | Purpose |
|---|---|---|
| **Turbopack** | Built-in | Fast bundler for development |
| **tsx** | ^4.19.2 | TypeScript execution for scripts |
| **npm** | Latest | Package manager |

### Type Definitions
| Technology | Version | Purpose |
|---|---|---|
| **@types/node** | ^20 | Node.js type definitions |
| **@types/react** | ^19 | React type definitions |
| **@types/react-dom** | ^19 | React DOM type definitions |
| **@types/bcryptjs** | ^2.4.6 | bcryptjs type definitions |
| **@types/nodemailer** | ^7.0.1 | Nodemailer type definitions |

### Development Scripts
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:seed      # Seed database with test data
npm run db:clean     # Clean database
npm run db:reset     # Reset database to initial state
```

---

## 10. Configuration Files

### TypeScript Configuration
- **Target:** ES2017
- **Module:** ESNext
- **Strict Mode:** Enabled
- **Path Aliases:** `@/*` → `./src/*`
- **JSX:** Preserve (Next.js handles JSX)

### Next.js Configuration
- **Output:** Standalone (for self-hosted deployment)
- **React Strict Mode:** Enabled
- **Powered By Header:** Disabled
- **Environment Variables:** DATABASE_URL, NEXTAUTH_URL

### Tailwind CSS Configuration
- **PostCSS Plugin:** `@tailwindcss/postcss`
- **Version:** 4 (latest)
- **Content:** Auto-detected from src files

---

## 11. Key Dependencies Summary

### Production Dependencies (15 packages)
```json
{
  "@hookform/resolvers": "^5.2.1",
  "@next-auth/prisma-adapter": "^1.0.7",
  "@prisma/client": "^6.14.0",
  "@radix-ui/react-*": "Latest (8 packages)",
  "@stripe/stripe-js": "^7.8.0",
  "@types/bcryptjs": "^2.4.6",
  "@types/nodemailer": "^7.0.1",
  "bcryptjs": "^3.0.2",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "gsap": "^3.13.0",
  "lucide-react": "^0.540.0",
  "next": "15.4.7",
  "next-auth": "^4.24.11",
  "next-themes": "^0.4.6",
  "nodemailer": "^6.10.1",
  "prisma": "^6.14.0",
  "react": "19.1.0",
  "react-day-picker": "^9.9.0",
  "react-dom": "19.1.0",
  "react-hook-form": "^7.62.0",
  "recharts": "^3.2.1",
  "stripe": "^18.4.0",
  "tailwind-merge": "^3.3.1",
  "zod": "^4.0.17"
}
```

### Development Dependencies (6 packages)
```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.4.7",
  "tailwindcss": "^4",
  "tsx": "^4.19.2",
  "typescript": "^5"
}
```

---

## 12. Architecture Decisions

### Why Next.js 15?
- ✅ Full-stack React framework with built-in API routes
- ✅ Server components for better performance
- ✅ Turbopack for fast development builds
- ✅ Excellent TypeScript support
- ✅ Automatic code splitting and optimization

### Why PostgreSQL + Prisma?
- ✅ Relational database for complex data relationships
- ✅ Type-safe ORM with excellent TypeScript integration
- ✅ Migration management for schema versioning
- ✅ Self-hosted on Coolify VPS for full control
- ✅ Cost-effective for production workloads

### Why NextAuth.js?
- ✅ Full control over authentication logic
- ✅ Works with any database (PostgreSQL via Prisma)
- ✅ Flexible provider system
- ✅ No vendor lock-in
- ✅ Excellent Next.js integration

### Why Tailwind CSS + Radix UI?
- ✅ Utility-first CSS for rapid UI development
- ✅ Unstyled Radix components for accessibility
- ✅ Shadcn UI for pre-built, customizable components
- ✅ Consistent design system across the application
- ✅ Easy theming with CSS variables

### Why Coolify for Deployment?
- ✅ Self-hosted deployment platform
- ✅ Full infrastructure control
- ✅ PostgreSQL included
- ✅ Cost-effective for production
- ✅ No vendor lock-in

---

## 13. Not Used (Despite Common Assumptions)

The following technologies are **NOT** used in this project:

- ❌ **Supabase** - Using PostgreSQL + NextAuth instead
- ❌ **Vercel** - Using Coolify for self-hosted deployment
- ❌ **Vercel AI SDK** - No AI features implemented
- ❌ **Redux** - Using React Hooks for state management
- ❌ **GraphQL** - Using REST API with Next.js API routes
- ❌ **Jest** - No testing framework configured yet
- ❌ **Storybook** - No component documentation tool
- ❌ **DVLA API** - No external vehicle lookup integration
- ❌ **Upstash** - No rate limiting implemented
- ❌ **Framer Motion** - Using GSAP for animations instead

---

## 14. Related Documentation

- **Architecture:** [architecture.md](architecture.md)
- **Database Schema:** `../../prisma/schema.prisma`
- **Authentication:** `../../src/lib/auth.ts`
- **Geocoding Service:** [geocoding-service.md](geocoding-service.md)
- **Deployment Guide:** [../../readme/DEPLOY.md](../../readme/DEPLOY.md)
- **Setup Guide:** [../../readme/SETUP-DEV.md](../../readme/SETUP-DEV.md)

---

**Last Updated:** October 20, 2025
**Version:** 2.0 (Comprehensive tech stack overview with all dependencies)