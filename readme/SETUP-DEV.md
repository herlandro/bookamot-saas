# Developer Setup Guide

This guide provides detailed instructions for setting up the BookaMOT project on a new machine, from installing dependencies to running the project in a local development environment.

## System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher
- **Git**: Any recent version

## Step-by-Step Setup

### 1. Installing Global Dependencies

#### Node.js and npm

**macOS (using Homebrew):**
```bash
brew install node@18
```

**Windows:**
Download and install Node.js from the [official website](https://nodejs.org/)

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install PostgreSQL from the [official website](https://www.postgresql.org/download/windows/)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. PostgreSQL Configuration

**Create a user and database:**

```bash
# Access PostgreSQL as postgres user
sudo -u postgres psql

# Inside psql, create a user (replace 'yourusername' and 'yourpassword')
CREATE USER yourusername WITH PASSWORD 'yourpassword';

# Create the database
CREATE DATABASE bookamot;

# Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE bookamot TO yourusername;

# Exit psql
\q
```

### 3. Project Setup

#### Clone the Repository

```bash
git clone [repository-url]
cd bookamot-saas
```

#### Install Project Dependencies

```bash
npm install
```

#### Configure Environment Variables

1. Create a `.env` file in the project root
2. Add the following variables (adjust as needed):

```env
# For PostgreSQL
DATABASE_URL="postgresql://yourusername:yourpassword@localhost:5432/bookamot"

# Other required variables
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Development Tools

### Prisma Studio (Database Interface)

```bash
npx prisma studio
```

Access Prisma Studio at `http://localhost:5555`

### Direct PostgreSQL Access

```bash
psql -d bookamot
```

## Common Troubleshooting

### PostgreSQL Connection Error

Check if:
- The PostgreSQL service is running
- The credentials in the `.env` file are correct
- The `bookamot` database exists

### Prisma Migration Errors

If you encounter migration conflicts:

```bash
# Remove the migrations folder (caution: this deletes migration history)
rm -rf prisma/migrations

# Restart migrations
npx prisma migrate dev
```

### Port 3000 Already in Use

If port 3000 is already in use, Next.js will try to use the next available port (3001, 3002, etc.). You can also specify a different port:

```bash
npm run dev -- -p 3005
```

## Development Tips

- Use the `npm run lint` command to check for code issues
- Keep Node.js and dependencies updated
- Always run migrations after updating the database schema
- Use Prisma Studio to view and edit data during development

## Next Steps

After setting up the development environment, refer to the main `README.md` for more information about the project structure and development guidelines.

For production deployment instructions, see the `README-DEPLOY.md` file.