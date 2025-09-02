# BookaMOT - MOT Booking System

BookaMOT is a modern web application that simplifies the process of booking MOT tests for vehicles in the UK. It connects vehicle owners with approved MOT testing stations and manages the entire booking process.

## Features

- User authentication and authorization
- Vehicle management
- MOT booking system
- Dashboard with booking statistics
- Garage management for MOT testing stations
- Real-time booking status updates

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn package manager
- Git
- PostgreSQL (v14 or higher) - Recommended
  - Or SQLite for quick development (no additional installation required)

## Getting Started

Follow these steps to set up the project for local development:

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd bookamot-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   - Create a `.env` file in the root directory
   - Add the following required environment variables:
     ```env
     # For PostgreSQL (recommended)
     DATABASE_URL="postgresql://username:password@localhost:5432/bookamot"
     
     # Or for SQLite (alternative)
     # DATABASE_URL="file:./prisma/dev.db"
     ```

4. **Database Setup**
   
   For PostgreSQL:
   ```bash
   # Create PostgreSQL database
   createdb bookamot
   
   # Run Prisma migrations to create/update the local database
   npx prisma migrate dev

   # Generate Prisma Client
   npx prisma generate
   ```
   
   For SQLite (alternative):
   ```bash
   # Run Prisma migrations to create/update the local database
   npx prisma migrate dev

   # Generate Prisma Client
   npx prisma generate
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The application should now be running at `http://localhost:3000`

## Database Management

- The project uses PostgreSQL for local development and production
- SQLite is also supported as an alternative for quick development
- Prisma Studio can be used to manage the database:
  ```bash
  npx prisma studio
  ```
- Access Prisma Studio at `http://localhost:5555`
- To access PostgreSQL directly:
  ```bash
  psql -d bookamot
  ```

## Project Structure

```
bookamot-saas/
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # Reusable React components
│   ├── lib/           # Utility functions and configurations
│   └── types/         # TypeScript type definitions
```

## Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Update migrations when making database schema changes
- Test your changes thoroughly before committing

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npx prisma studio`: Open database management UI

## Important Notes

- Never commit the `dev.db` file or any other database files
- Always keep your `.env` file secure and never commit it
- Run migrations after pulling changes that include database schema updates
- Use Prisma Studio for database management during development
- For detailed setup instructions on a new machine, refer to `README-DEV-SETUP.md`
- For deployment instructions, refer to `README-DEPLOY.md`

## Security Best Practices

- Always use environment variables for sensitive data (API keys, database credentials, etc.)
- Keep the Node.js version updated to receive security patches
- Regularly update project dependencies using `npm audit` and fix vulnerabilities
- Use strong password hashing with bcrypt (already configured)
- Implement rate limiting for API routes to prevent abuse
- Enable CORS only for trusted domains
- Never log sensitive information or stack traces in production
- Keep the `.env.example` file updated but never include real credentials

## Performance Optimization

- Enable caching for static assets
- Use Image component for optimized image loading
- Implement lazy loading for components when possible
- Keep bundle size minimal by:
  - Using dynamic imports for large components
  - Removing unused dependencies
  - Implementing code splitting
- Monitor API endpoint performance
- Use connection pooling for database queries
- Implement proper error boundaries to prevent app crashes
- Use production builds for deployment with:
  ```bash
  npm run build
  npm start
  ```
