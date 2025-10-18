# BookaMOT - MOT Booking System

BookaMOT is a modern web application that simplifies the process of booking MOT tests for vehicles in the UK. It connects vehicle owners with approved MOT testing stations and manages the entire booking process.

---

## ✨ Features

- **User Authentication** - Secure login for customers and garage owners
- **Vehicle Management** - Add and manage vehicles with DVLA auto-lookup
- **Smart Search** - Distance-based garage search with geocoding
- **MOT Booking** - Complete booking flow with time slot selection
- **Onboarding Flow** - Guided experience for new users
- **Garage Dashboard** - Manage bookings and schedules
- **Real-time Updates** - Live booking status tracking

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher
- **Git**

### Setup

```bash
# 1. Clone the repository
git clone [repository-url]
cd bookamot-saas

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Set up database
createdb bookamot
npx prisma migrate deploy
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Accounts

**Customer:**
```
Email: james.smith@example.com
Password: password123
```

**Garage Owner:**
```
Email: smithsmotorservices@garage.com
Password: garage123
```

---

## 📚 Documentation

### Getting Started
- **[Development Setup Guide](readme/SETUP-DEV.md)** - Detailed setup instructions
- **[Deployment Guide](readme/DEPLOY.md)** - Deploy to production (Coolify VPS)
- **[Database Seeding](md/docs/database-seeding-quick-reference.md)** - Test data and credentials

### Technical Documentation
- **[Documentation Index](md/docs/README.md)** - Complete documentation index
- **[Architecture](md/docs/architecture.md)** - System architecture
- **[Tech Stack](md/docs/tech-stack.md)** - Technologies used
- **[Database Schema](md/docs/database-schema.md)** - Database structure

### Application Flows
- **[Onboarding Flow](md/docs/app-flows/onboarding-flow.md)** - New user experience
- **[Booking Flow](md/docs/app-flows/booking-flow.md)** - MOT booking process
- **[Vehicle Registration](md/docs/app-flows/vehicle-registration-flow.md)** - Add vehicles
- **[Garage Registration](md/docs/app-flows/garage-registration-flow.md)** - Garage account setup

### Advanced Topics
- **[Geocoding Service](md/docs/geocoding-service.md)** - Location and distance calculations
- **[Scalability Roadmap](readme/SCALABILITY-ROADMAP.md)** - Future improvements
- **[Scalability Guide](readme/SCALABILITY-GUIDE.md)** - Implementation details

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Database
npm run db:seed          # Seed database with test data
npm run db:clean         # Clean all data
npm run db:reset         # Reset and reseed database
npx prisma studio        # Open database management UI
npx prisma migrate dev   # Create and apply migrations

# Testing (future)
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

---

## 📁 Project Structure

```
bookamot-saas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── (auth)/            # Auth pages (signin, signup)
│   │   ├── dashboard/         # User dashboard
│   │   ├── onboarding/        # Onboarding flow
│   │   ├── search/            # Garage search
│   │   ├── booking/           # Booking flow
│   │   └── vehicles/          # Vehicle management
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   └── ...               # Custom components
│   │
│   ├── lib/                   # Utilities and services
│   │   ├── geocoding.ts      # Geocoding service
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Utility functions
│   │
│   └── types/                 # TypeScript types
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Seed script
│
├── public/                    # Static assets
├── md/docs/                   # Technical documentation
├── readme/                    # Setup and deployment guides
└── README.md                  # This file
```

---

## 🔧 Technology Stack

### Core
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library

### Backend
- **NextAuth.js** - Authentication
- **Prisma** - ORM
- **PostgreSQL** - Database

### Services
- **Nominatim API** - Geocoding (OpenStreetMap)
- **DVLA API** - Vehicle lookup (planned)

For detailed information, see [Tech Stack Documentation](md/docs/tech-stack.md).

---

## 🗄️ Database Management

### Quick Commands

```bash
# View database in browser
npx prisma studio

# Reset database (clean + migrate + seed)
npm run db:reset

# Clean database only
npm run db:clean

# Seed database only
npm run db:seed

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy
```

### Test Data

The seed script creates:
- **30 customers** with vehicles and bookings
- **10 garages** (5 in Stevenage, 5 in Hitchin)
- **50-70 vehicles** with realistic UK registrations
- **40-50 bookings** (past and future)

See [Database Seeding Guide](md/docs/database-seeding-quick-reference.md) for all test credentials.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bookamot"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional
NODE_ENV="development"
```

**Never commit the `.env` file!**

---

## 🚦 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow existing code style
- Update documentation if needed
- Test your changes

### 3. Database Changes
```bash
# If you modified schema.prisma
npx prisma migrate dev --name describe_your_changes
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: describe your changes"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

---

## 🧪 Testing

### Manual Testing

1. **Reset database** to clean state:
   ```bash
   npm run db:reset
   ```

2. **Test customer flow:**
   - Login as customer
   - Complete onboarding
   - Search for garages
   - Book MOT appointment

3. **Test garage owner flow:**
   - Login as garage owner
   - View bookings
   - Manage schedule

### Automated Testing (Planned)

See [Scalability Roadmap](readme/SCALABILITY-ROADMAP.md) for testing implementation plan.

---

## 🔒 Security Best Practices

- ✅ Environment variables for sensitive data
- ✅ Password hashing with bcrypt
- ✅ NextAuth.js for secure authentication
- ✅ Prisma for SQL injection prevention
- ✅ CORS configuration
- ⚠️ Rate limiting (planned)
- ⚠️ Input validation (in progress)

---

## 🚀 Performance Optimization

- ✅ Next.js Image optimization
- ✅ Database connection pooling
- ✅ Geocoding with database caching
- ✅ Server-side rendering
- ⚠️ Redis caching (planned)
- ⚠️ CDN for static assets (planned)

See [Scalability Guide](readme/SCALABILITY-GUIDE.md) for implementation details.

---

## 📝 Contributing

### Code Style
- Use TypeScript for type safety
- Follow existing naming conventions
- Use Prettier for formatting
- Write meaningful commit messages

### Documentation
- Update relevant documentation when making changes
- Add comments for complex logic
- Keep README and guides up to date

### Pull Requests
- Describe what your PR does
- Reference related issues
- Ensure all checks pass
- Request review from maintainers

---

## 🆘 Troubleshooting

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Verify DATABASE_URL in .env
```

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Migration failed"
```bash
# Reset database
npx prisma migrate reset --force
npm run db:seed
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

For more troubleshooting, see [Setup Guide](readme/SETUP-DEV.md).

---

## 📄 License

[Add your license here]

---

## 🤝 Support

- **Documentation:** [md/docs/README.md](md/docs/README.md)
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Built with ❤️ for the UK MOT booking industry**

