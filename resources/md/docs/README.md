# BookaMOT Documentation

Welcome to the BookaMOT technical documentation. This directory contains comprehensive documentation for the MOT booking SaaS platform.

---

## Quick Start

### For New Developers
1. **Project Overview:** `../../README.md`
2. **Development Setup:** `../../readme/SETUP-DEV.md`
3. **Architecture Overview:** `architecture.md`
4. **Tech Stack:** `tech-stack.md`
5. **Design Guidelines:** `design-guidelines.md`

### For Understanding Flows
1. **Flow Documentation Guide:** `app-flows/README.md`
2. **Onboarding Flow:** `app-flows/onboarding-flow.md`
3. **Booking Flow:** `app-flows/booking-flow.md`
4. **Vehicle Registration:** `app-flows/vehicle-registration-flow.md`
5. **Garage Registration:** `app-flows/garage-registration-flow.md`

### For Testing
1. **Quick Reference:** `database-seeding-quick-reference.md`
2. **All Test Credentials:** `SEED_DATA_CREDENTIALS.md`
3. **Reset Database:** `npm run db:reset`

---

## Documentation Structure

### 📱 Application Flows (`app-flows/`)
User journeys and system flows with Mermaid diagrams.

- **`booking-flow.md`** - Complete MOT booking process
- **`onboarding-flow.md`** - New user onboarding experience
- **`vehicle-registration-flow.md`** - Vehicle registration with DVLA lookup
- **`garage-registration-flow.md`** - Garage account creation

### 🏗️ System Architecture

- **`architecture.md`** - System architecture and design patterns
- **`tech-stack.md`** - Technology stack and dependencies
- **`design-guidelines.md`** - UI/UX design principles and standards

### 🔧 Technical Services

- **`geocoding-service.md`** - Geocoding service (address → coordinates)
  - 3-tier strategy: Database → Area match → External API
  - Garage search by distance
  - Address parsing and validation

### 🌱 Database & Testing

- **`database-seeding-quick-reference.md`** - Quick commands and test accounts
- **`SEED_DATA_CREDENTIALS.md`** - Complete list of all test credentials
  - 30 customer accounts
  - 10 garage owner accounts
  - All passwords and locations

### 📝 Documentation Templates

- **`templates/`** - Templates for creating new documentation
  - `apis.md` - API endpoint documentation template
  - `app-flows.md` - Application flow documentation template
  - `database-schema.md` - Database schema documentation template
  - `memory-entries.md` - Error documentation template

### 📦 Archive

- **`archive/implementation-history/`** - Historical implementation documentation (20 files)
  - Original implementation notes
  - Bug fixes and solutions
  - System summaries
- **`archive/planning-history/`** - Initial planning documents (3 files)
  - Original planning roadmap
  - Garage schedule optimization proposal
- **`archive/prd-initial-planning/`** - Initial Product Requirements Document (5 files)
  - Original PRD (Draft, never finalized)
  - Contains placeholders and outdated tech references
  - Archived because it mentions Supabase (project uses NextAuth)

---

## Common Tasks

### Setting Up Development Environment

```bash
# Clone repository
git clone <repository-url>
cd bookamot-saas

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed

# Start development server
npm run dev
```

See `../../readme/README-02-SETUP-DEV.md` for detailed setup instructions.

---

### Testing the Application

**Quick Test Accounts:**

Customer:
```
Email: james.smith@example.com
Password: password123
```

Garage Owner:
```
Email: smithsmotorservices@garage.com
Password: garage123
```

See `database-seeding-quick-reference.md` for all test accounts.

---

### Understanding a User Flow

1. Go to `app-flows/README.md` for overview
2. Open the specific flow document (e.g., `booking-flow.md`)
3. Review the Mermaid diagram
4. Read the detailed step-by-step breakdown
5. Check API endpoints and error handling

---

### Finding API Documentation

1. Check `apis.md` for endpoint overview
2. Check specific flow documents for API usage
3. Check `src/app/api/` for implementation

---

### Database Operations

**Reset database:**
```bash
npm run db:reset
```

**Clean and reseed:**
```bash
npm run db:clean
npm run db:seed
```

**View schema:**
```bash
npx prisma studio
```

See `database-seeding-quick-reference.md` for more commands.

---

## Documentation Standards

### File Naming
- Use kebab-case: `my-document.md`
- Be descriptive: `garage-registration-flow.md` not `garage.md`
- Group related docs in folders

### Content Structure
1. **Title** - Clear, descriptive title
2. **Purpose & Scope** - What this document covers
3. **Main Content** - Organized with headers
4. **Examples** - Code examples where relevant
5. **Related Documentation** - Links to related docs

### Mermaid Diagrams
- Use for user flows and system diagrams
- Include all participants
- Show decision points with `alt`/`else`
- Add notes for important details

### Code Examples
- Use syntax highlighting
- Include comments
- Show realistic examples
- Explain what the code does

---

## Maintenance

### When to Update Documentation

**Update immediately when:**
- API endpoints change
- User flows change
- Database schema changes
- New features are added
- Bugs are fixed that affect documented behavior

**Update periodically:**
- Tech stack versions
- External API references
- Best practices
- Performance optimizations

### How to Update

1. **Find the relevant document** - Use this README to locate
2. **Make changes** - Update content, code examples, diagrams
3. **Update related docs** - Check for cross-references
4. **Test examples** - Verify code examples still work
5. **Update "Last Updated"** - Add date if document has one

### Creating New Documentation

1. **Check templates** - See `templates/` for documentation templates
2. **Determine category** - Which folder does it belong in?
3. **Follow naming conventions** - Use kebab-case
4. **Use standard structure** - Follow template structure
5. **Add to this README** - Update the relevant section
6. **Cross-reference** - Link from related documents

---

## Related Documentation

### Project Root
- `../../README.md` - Main project README
- `../../readme/SETUP-DEV.md` - Development setup
- `../../readme/DEPLOY.md` - Deployment guide
- `../../readme/SCALABILITY-ROADMAP.md` - Scalability roadmap
- `../../readme/SCALABILITY-GUIDE.md` - Scalability implementation guide

### Source Code
- `../../src/` - Application source code
- `../../prisma/schema.prisma` - Database schema definition
- `../../prisma/seed.ts` - Database seeding script

---

## Getting Help

### Documentation Issues
- Check if documentation is outdated
- Look for related documents
- Check implementation history in `archive/`

### Technical Issues
- Check relevant flow documentation
- Check API documentation
- Check database schema
- Review error handling sections

### Feature Questions
- Check PRD documents in `prd/`
- Check flow documentation in `app-flows/`
- Check architecture documentation

---

## Contributing to Documentation

### Guidelines
1. **Be clear and concise** - Write for developers who are new to the project
2. **Use examples** - Show, don't just tell
3. **Keep it current** - Update docs when code changes
4. **Link related docs** - Help readers find more information
5. **Use diagrams** - Visual aids help understanding

### Review Checklist
- [ ] Title is clear and descriptive
- [ ] Purpose/scope is defined
- [ ] Content is well-organized
- [ ] Code examples are tested
- [ ] Diagrams are accurate
- [ ] Links to related docs are included
- [ ] No typos or grammar errors
- [ ] Follows documentation standards

---

## Documentation Map

```
md/docs/
├── README.md                           # This file - Documentation index
│
├── app-flows/                          # Application Flows (5 files)
│   ├── README.md                       # Flow documentation guide
│   ├── booking-flow.md                 # MOT booking process
│   ├── onboarding-flow.md              # New user onboarding
│   ├── vehicle-registration-flow.md    # Vehicle registration
│   └── garage-registration-flow.md     # Garage account setup
│
├── templates/                          # Documentation Templates (5 files)
│   ├── README.md                       # Template guide
│   ├── apis.md                         # API documentation template
│   ├── app-flows.md                    # Flow documentation template
│   ├── database-schema.md              # Schema documentation template
│   └── memory-entries.md               # Error documentation template
│
├── archive/                            # Historical Documentation
│   ├── implementation-history/         # 20 implementation files
│   │   ├── README.md
│   │   ├── [16 original files]
│   │   ├── DATABASE_SEEDING_GUIDE.md
│   │   ├── SEEDING_SYSTEM_SUMMARY.md
│   │   └── DOCUMENTATION_CONSOLIDATION_SUMMARY.md
│   │
│   ├── planning-history/               # 3 planning files
│   │   ├── README.md
│   │   ├── initial-planning-roadmap.md
│   │   └── garage-schedule-optimization-proposal.prisma
│   │
│   └── prd-initial-planning/           # 5 PRD files (archived)
│       ├── ARCHIVE_README.md
│       ├── README.md
│       ├── 01-executive-summary-and-analysis.md
│       ├── 02-functional-and-technical-specs.md
│       ├── 03-success-metrics-and-implementation.md
│       └── epics/README.md
│
├── architecture.md                     # System architecture
├── tech-stack.md                       # Technology stack
├── design-guidelines.md                # UI/UX design principles
│
├── geocoding-service.md                # Geocoding service documentation
│
├── database-seeding-quick-reference.md # Quick seeding reference
└── SEED_DATA_CREDENTIALS.md            # Complete test credentials list
```

**Total:** 17 active documentation files + 28 archived files + 5 templates

---

**Last Updated:** October 18, 2025
**Documentation Version:** 3.0 (Post-PRD archival)

