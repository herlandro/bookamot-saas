# Database Commands Reference

This document lists all available commands for managing the database in the BookaMOT SaaS project.

## Prisma Commands

### Migration Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset database and apply all migrations (development only - deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Create migration without applying (for review)
npx prisma migrate dev --create-only --name migration_name
```

### Schema Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Format Prisma schema file
npx prisma format

# Validate Prisma schema
npx prisma validate

# View current schema
cat prisma/schema.prisma
```

### Database Inspection Commands

```bash
# Open Prisma Studio (GUI database browser)
npx prisma studio

# View database URL (from .env)
npx prisma db pull

# Push schema changes to database without migration (development only)
npx prisma db push

# Introspect existing database and generate schema
npx prisma db pull
```

### Seed Commands

```bash
# Run seed script (creates admin user only)
npm run db:seed

# Clean database (removes all data)
npm run db:clean

# Reset database (clean + seed)
npm run db:reset
```

## Admin User Management

### Add Admin User

```bash
# Interactive mode (will prompt for email, password, and name)
npm run admin:add

# With command line arguments
npm run admin:add -- --email user@example.com --password securepass123 --name "John Doe"

# Using npx directly
npx tsx scripts/add-admin.ts
npx tsx scripts/add-admin.ts --email admin@example.com --password mypassword --name "Admin Name"
```

## Custom Scripts

### Database Management

```bash
# List all database entities
npm run db:list

# Clean database securely
npm run db:clean:secure

# Dry run of database clean (preview what would be deleted)
npm run db:clean:dry-run
```

### Query Scripts

```bash
# Query users
npm run query:users

# Query garages
npm run query:garages

# Query time slots
npm run query:slots
```

## PostgreSQL Direct Commands

If you need to connect directly to PostgreSQL:

```bash
# Connect to database (requires DATABASE_URL in .env)
psql $DATABASE_URL

# Or with explicit connection
psql -h localhost -U bookamot -d bookamot

# Common PostgreSQL commands once connected:
# \dt                    - List all tables
# \d table_name          - Describe table structure
# \du                    - List all users
# \l                     - List all databases
# SELECT * FROM "User";  - Query users table
# \q                     - Quit
```

## Environment Variables

Make sure your `.env` file contains:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Seed database with admin user only |
| `npm run db:clean` | Remove all data from database |
| `npm run db:reset` | Clean + seed database |
| `npm run admin:add` | Add new admin user interactively |
| `npx prisma studio` | Open database GUI browser |
| `npx prisma migrate dev` | Create and apply new migration |
| `npx prisma generate` | Regenerate Prisma Client |
| `npx prisma migrate deploy` | Apply migrations (production) |

## Troubleshooting

### Migration Issues

```bash
# If migrations are out of sync, reset (WARNING: deletes all data)
npx prisma migrate reset

# Mark migration as applied without running it (use with caution)
npx prisma migrate resolve --applied migration_name

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back migration_name
```

### Connection Issues

```bash
# Test database connection
npx prisma db pull

# Check if Prisma Client is generated
ls node_modules/.prisma/client
```

### Schema Sync Issues

```bash
# Push schema changes directly (development only)
npx prisma db push

# Pull schema from database
npx prisma db pull
```

## Notes

- Always backup your database before running destructive commands (`db:clean`, `migrate reset`)
- Use `migrate deploy` in production, not `migrate dev`
- The seed script now only creates the default admin user (`admin@bookamot.co.uk` / `admin123!`)
- Use `admin:add` script to create additional admin users
- Prisma Studio is great for inspecting data during development

## Main Commands

Seed and Cleanup
```bash
npm run db:seed # Creates only the admin
npm run db:clean # Removes all data
npm run db:reset # Cleans + seed
```

Add Admin
```bash
npm run admin:add # Interactive mode
npm run admin:add -- --email admin@example.com --password mypass --name "Admin Name"
```

Prisma
```bash
npx prisma studio # Database graphical interface
npx prisma migrate dev # Create new migration
npx prisma generate # Generate Prisma Client
npx prisma migrate deploy # Apply migrations (production)
```

Direct PostgreSQL
```bash
psql $DATABASE_URL # Connect to the database
# Inside psql:
# \dt - List tables
# \d User - View User table structure
# SELECT * FROM "User"; - Query users
```