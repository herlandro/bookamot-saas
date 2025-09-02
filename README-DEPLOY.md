# Deployment Instructions for Coolify VPS

## PostgreSQL Database Configuration

The project is configured to use PostgreSQL. Follow these steps to set up PostgreSQL on your Coolify VPS:

### 1. Install PostgreSQL on Coolify

Coolify offers native support for PostgreSQL as a service. To configure:

1. Access the Coolify dashboard
2. Go to the "Resources" or "Databases" section
3. Click on "New Resource" or "New Database"
4. Select "PostgreSQL"
5. Configure the options:
   - Name: `bookamot-db` (or another name of your preference)
   - Version: Choose the most recent stable version (recommended 14 or higher)
   - Password: Set a strong password
   - Port: Keep the default port 5432 or choose another if necessary
6. Click on "Create" or "Deploy"

### 2. Create the Database

After installing PostgreSQL:

1. Access the PostgreSQL service in Coolify
2. Go to the "Console" or "Terminal" section
3. Execute the following commands:

```sql
CREATE DATABASE bookamot;
```

### 3. Configure Environment Variables

In your project on Coolify:

1. Go to your application's configuration section
2. Add the following environment variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@postgresql-address:5432/bookamot
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=https://your-domain.com
PORT=3000
```

Replace:
- `username` with the PostgreSQL username (usually "postgres" in Coolify)
- `password` with the password you set
- `postgresql-address` with the address of the PostgreSQL service (usually an internal name like "postgres" or the IP/hostname provided by Coolify)
- `your_secret_key_here` with a secure random string
- `your-domain.com` with the domain where your application will be hosted

### 4. Application Deployment

1. Connect your GitHub repository to Coolify
2. Configure the build:
   - Build Command: `npm run build`
   - Start Command: `npm start`
3. Start the deployment

### 5. Run Prisma Migrations

After deployment, you'll need to run Prisma migrations to create the tables in the database:

1. Access your application's terminal/console in Coolify
2. Execute the command:

```bash
npx prisma migrate deploy
```

## Alternative: Using SQLite in Production

If you prefer not to configure PostgreSQL, a simpler alternative (but less recommended for production with many users) is to use SQLite:

1. Modify `schema.prisma` to use SQLite:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./bookamot.db"
}
```

2. Update the environment variables in Coolify to remove the DATABASE_URL

3. Make sure the directory where the SQLite file will be stored has write permissions

**Note**: SQLite is not recommended for production environments with many simultaneous users or large data volumes, but it can be a simple temporary solution.

## Support

If you encounter problems during deployment, check:

1. Application logs in Coolify
2. Database connection
3. Environment variables configured correctly