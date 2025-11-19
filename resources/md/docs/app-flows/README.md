# App Flows Documentation

This folder contains structured documentation for application flows using Mermaid diagrams.

## Overview

Each flow document describes a complete user journey through the BookaMOT application, including:
- **Purpose & Scope** - What the flow accomplishes
- **Implementation Guidelines** - How it's implemented
- **Mermaid Diagrams** - Visual representation of the flow
- **Detailed Steps** - Step-by-step breakdown
- **API Endpoints** - Backend integration points
- **Error Handling** - Edge cases and recovery
- **Testing Scenarios** - How to verify the flow works

---

## Available Flows

### Core User Flows

#### 1. **Onboarding Flow** (`onboarding-flow.md`)
**Purpose:** Guide new users through their first experience

**Steps:**
1. Welcome - Introduction and overview
2. Vehicle Registration - Add first vehicle with auto-lookup
3. Location Selection - GPS or postcode entry
4. Search Preferences - Quick or detailed MOT search

**Entry Point:** Dashboard (for new users with no vehicles/bookings)

**Exit Point:** Search page with auto-populated results

---

#### 2. **Booking Flow** (`booking-flow.md`)
**Purpose:** Complete MOT appointment booking

**Steps:**
1. Authentication Check - Ensure user is logged in
2. Vehicle Verification - Ensure user has registered vehicles
3. Booking Creation - Complete the appointment

**Entry Point:** Search page "Book Now" button

**Exit Point:** Booking confirmation page

**Key Features:**
- Context preservation across redirects
- Session storage for booking state
- Seamless authentication flow

---

#### 3. **Vehicle Registration Flow** (`vehicle-registration-flow.md`)
**Purpose:** Add vehicles to user account

**Features:**
- DVLA auto-lookup
- Manual entry fallback
- Duplicate detection
- Context-aware redirects (booking vs. normal flow)

**Entry Points:**
- Dashboard "Add Vehicle" button
- Booking flow (if no vehicles)
- Onboarding Step 2

**Exit Points:**
- Dashboard (normal flow)
- Booking page (booking flow)
- Next onboarding step (onboarding flow)

---

#### 4. **Garage Registration Flow** (`garage-registration-flow.md`)
**Purpose:** Create garage owner accounts

**Features:**
- User role mapping (GARAGE_OWNER)
- Automatic address geocoding
- City and postcode extraction
- Default schedule creation

**Entry Point:** Signup page (select "Garage" account type)

**Exit Point:** Signin page

---

## Flow Relationships

```
New User Journey:
  Signup → Signin → Dashboard → Onboarding → Search → Booking → Confirmation

Existing User Journey:
  Signin → Dashboard → Search → Booking → Confirmation

Garage Owner Journey:
  Signup (Garage) → Signin → Garage Dashboard
```

---

## Documentation Standards

### Structure
Each flow document must contain:
1. **Purpose & Scope** - Clear description of the flow's objective
2. **Implementation Guidelines** - Step-by-step guidelines
3. **Mermaid Diagram** - Visual representation using Mermaid syntax
4. **Detailed Steps** - Breakdown of each step
5. **API Endpoints** - Backend integration
6. **Error Handling** - Edge cases and recovery
7. **Testing Scenarios** - Verification steps
8. **Related Documentation** - Links to other relevant docs

### Mermaid Diagrams
- Use `sequenceDiagram` for user flows
- Include all participants (User, Pages, APIs, Services)
- Show decision points with `alt`/`else`
- Add notes for important details

### File Naming
- Use kebab-case: `flow-name.md`
- Be descriptive: `vehicle-registration-flow.md` not `vehicle.md`
- Keep under 250 lines per file

---

## Related Documentation

### System Documentation
- `../architecture.md` - System architecture
- `../tech-stack.md` - Technology stack
- `../database-schema.md` - Database schema

### Implementation Documentation
- `../../GEOCODING_SYSTEM.md` - Geocoding service
- `../../SEEDING_QUICK_REFERENCE.md` - Database seeding
- `../../readme/` - Project setup

### Historical Documentation
- `../archive/implementation-history/` - Archived implementation details

---

## Maintenance

### When to Update
- New features added to existing flows
- Flow logic changes
- API endpoints change
- Error handling improvements

### When to Create New Flow
- New user journey added
- New major feature with distinct flow
- Complex sub-flow that deserves separate documentation

### Archive Policy
- Old implementation details → `../archive/implementation-history/`
- Keep only current, accurate flow documentation here
- Update this README when flows are added/removed