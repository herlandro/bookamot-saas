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

# Or with explicit connection (Docker: user postgres, password postgres)
psql -h localhost -p 5432 -U postgres -d bookamot

# Common PostgreSQL commands once connected:
# \dt                    - List all tables
# \d table_name          - Describe table structure
# \du                    - List all users
# \l                     - List all databases
# SELECT * FROM "User";  - Query users table
# \q                     - Quit
```

## Database in Docker

When PostgreSQL runs in Docker, use one of these options.

### Option 1: Database only in Docker, app on host

1. **Start only the database service:**
   ```bash
   docker-compose up -d db
   ```
   Or with the development compose file:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d db
   ```

2. **In `.env` (app running on host):**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bookamot"
   ```
   The project uses port **5433** on the host to avoid conflicting with a locally installed PostgreSQL (which usually uses 5432).

3. **Run migrations (on host):**
   ```bash
   npx prisma migrate deploy
   ```
   Or in development:
   ```bash
   npx prisma migrate dev
   ```

4. **Check that the database is responding:**
   ```bash
   docker-compose ps
   npx prisma db pull
   ```

### Option 2: App and database in Docker

Use the full compose setup; the app uses the hostname `db`:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

The `DATABASE_URL` inside the container is already `postgresql://postgres:postgres@db:5432/bookamot`. To run migrations **from inside the container**:

```bash
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate deploy
```

### Direct connection to the database (Docker)

With the database container running (port **5433** on the host to avoid conflicting with local Postgres on 5432):

```bash
# Inside the container (always works)
docker compose exec db psql -U postgres -d bookamot

# From the host (use port 5433)
psql "postgresql://postgres:postgres@localhost:5433/bookamot"
# Or: psql -h localhost -p 5433 -U postgres -d bookamot
# Password: postgres
```

### If the database "doesn't work" with Docker

- [ ] Database container is running: `docker-compose ps` or `docker ps`
- [ ] Port 5432 is free on the host: `lsof -i :5432` (macOS/Linux)
- [ ] `.env` has `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/bookamot` when the app runs **on the host**
- [ ] Migrations applied: `npx prisma migrate deploy` or `npx prisma migrate dev`
- [ ] Prisma Client generated: `npx prisma generate`

If the container restarts or fails to start, the init script may be the cause. See `scripts/init-db.sql`; tables are created by Prisma migrations, not by the init script.

### Error P1010: User was denied access on the database

1. **Wait for Postgres to be ready** (the container may be "up" but Postgres still starting). After `docker compose up -d db`, wait 5–10 seconds or run:
   ```bash
   docker compose exec db pg_isready -U postgres
   ```
   Only when you see `accepting connections` should you run the migrations.

2. **Test the connection with psql** (port 5433 = Docker; use 5432 only if you do not have local Postgres):
   ```bash
   docker compose exec db psql -U postgres -d bookamot -c "SELECT 1"
   ```
   Or from the host, if Docker is on port 5433:
   ```bash
   psql "postgresql://postgres:postgres@localhost:5433/bookamot" -c "SELECT 1"
   ```
   If it fails, the issue is connection-related (credentials, port or firewall).

3. **Recreate the database from scratch** (deletes all data):
   ```bash
   docker compose down -v
   docker compose up -d db
   ```
   Wait ~10 s and run:
   ```bash
   npx prisma migrate deploy
   ```

4. **Run commands one at a time** in the terminal; do not paste blocks with lines starting with `#` (in zsh this can produce "command not found: #").

5. **"role postgres does not exist" when connecting to localhost:5432:** indicates that there is **PostgreSQL installed on the Mac** (Homebrew, Postgres.app, etc.) on port 5432. Connections to `localhost:5432` go to that local Postgres (which does not have the `postgres` user). The project uses port **5433** for the database in Docker; use `DATABASE_URL=...@localhost:5433/bookamot` in `.env` and recreate the container (`docker compose up -d db`) so that Prisma connects to the Docker Postgres.

---

## Environment Variables

Make sure your `.env` file contains:

```env
# When the database is in Docker and the app runs on the host (port 5433 to avoid conflicting with local Postgres):
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bookamot"
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

- Always back up your database before running destructive commands (`db:clean`, `migrate reset`)
- Use `migrate deploy` in production, not `migrate dev`
- The seed script creates the default admin user (`bookanmot@gmail.com` / `Frog3566!`)
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
npm run admin:add -- --email user@example.com --password mypass --name "Admin Name"
```

One-time migration (after removing SUPER_ADMIN role): ensure primary admin and remove legacy admin user
```bash
npm run db:migrate-admin-users
npm run db:migrate-admin-users -- --backup-dir=./backups  # optional backup for compliance
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