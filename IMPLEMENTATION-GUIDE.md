# Implementation Guide - BookaMOT Scalability Improvements

This document provides detailed instructions for implementing the scalability improvements identified in the roadmap. Each section contains code examples, commands, and specific configurations for the BookaMOT project.

## 1. Automated Tests

### Jest Configuration

```bash
# Install Jest and necessary dependencies
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom

# Install React Testing Library
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Create `jest.config.js` file in the project root:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js` file in the project root:

```javascript
import '@testing-library/jest-dom';
```

Add scripts to `package.json`:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### Unit Test Example

To test the `getErrorMessage` function in `/src/lib/utils.ts`:

```typescript
// src/lib/utils.test.ts
import { getErrorMessage } from './utils';

describe('getErrorMessage', () => {
  it('should return the message from an Error object', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('should return the error as string if it has a toString method', () => {
    const error = { toString: () => 'Custom error object' };
    expect(getErrorMessage(error)).toBe('Custom error object');
  });

  it('should return a default message for unknown error types', () => {
    expect(getErrorMessage(undefined)).toBe('Erro desconhecido');
    expect(getErrorMessage(null)).toBe('Erro desconhecido');
  });
});
```

### Component Test Example

To test a UI component:

```typescript
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    await userEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button', { name: /disabled button/i })).toBeDisabled();
  });
});
```

### Cypress Configuration for E2E Tests

```bash
# Install Cypress
npm install --save-dev cypress
```

Add script to `package.json`:

```json
"scripts": {
  "cypress": "cypress open",
  "cypress:run": "cypress run"
}
```

Example of E2E test for the login flow:

```javascript
// cypress/e2e/auth/login.cy.js
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/signin');
  });

  it('should display error with invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    // Use test credentials or mock
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
  });
});
```

## 2. CI/CD and Containerization

### GitHub Actions Workflow

Create `.github/workflows/ci.yml` file:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: bookamot_test
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Lint
      run: npm run lint

    - name: Type check
      run: npm run type-check

    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bookamot_test

    - name: Build
      run: npm run build
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bookamot_test
```

### Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy dependencies and build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./

# Expose port
EXPOSE 3000

# Run migrations and start application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### Docker Compose for Development

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: builder
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/bookamot
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your_nextauth_secret
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=bookamot
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 3. Monitoring and Logging

### Sentry Configuration

```bash
# Install Sentry SDK
npm install @sentry/nextjs
```

Create `sentry.client.config.js` file in the project root:

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

Create `sentry.server.config.js` file in the project root:

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

Update `next.config.js` to integrate Sentry:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Existing configurations
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "your-org",
    project: "bookamot",
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

### Structured Logging Implementation

```bash
# Install Winston
npm install winston
```

Create `src/lib/logger.ts` file:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bookamot' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
  ],
});

// In production, add file transport
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
```

Example of using the logger in an API route:

```typescript
// src/app/api/bookings/route.ts
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    logger.info('Starting booking creation', { path: '/api/bookings' });
    
    // Existing logic
    
    logger.info('Booking created successfully', { bookingId: booking.id });
    return Response.json({ booking });
  } catch (error) {
    logger.error('Error creating booking', { 
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
```

## 4. Cache and Performance Optimization

### Redis Configuration

```bash
# Install Redis client
npm install ioredis
```

Create `src/lib/redis.ts` file:

```typescript
import Redis from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl);

redis.on('error', (error) => {
  logger.error('Redis connection error', { error: error.message });
});

export default redis;
```

Implement cache function for search results:

```typescript
// src/lib/cache.ts
import redis from './redis';
import logger from './logger';

const DEFAULT_EXPIRATION = 60 * 60; // 1 hour in seconds

export async function cacheData<T>(key: string, data: T, expiration = DEFAULT_EXPIRATION): Promise<void> {
  try {
    await redis.setex(key, expiration, JSON.stringify(data));
  } catch (error) {
    logger.error('Error storing data in cache', { key, error });
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cachedData = await redis.get(key);
    if (!cachedData) return null;
    return JSON.parse(cachedData) as T;
  } catch (error) {
    logger.error('Error retrieving data from cache', { key, error });
    return null;
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error('Error invalidating cache', { key, error });
  }
}
```

Example of using cache in the garage search route:

```typescript
// src/app/api/garages/search/route.ts
import { getCachedData, cacheData } from '@/lib/cache';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const date = searchParams.get('date');
    
    if (!location) {
      return Response.json({ error: 'Location is required' }, { status: 400 });
    }
    
    // Create cache key based on search parameters
    const cacheKey = `garages:search:${location}:${date || 'any'}`;
    
    // Try to get results from cache
    const cachedResults = await getCachedData(cacheKey);
    if (cachedResults) {
      logger.info('Search results retrieved from cache', { cacheKey });
      return Response.json(cachedResults);
    }
    
    // Existing logic to fetch garages
    const garages = await prisma.garage.findMany({
      where: {
        // Existing conditions
      },
      include: {
        // Existing includes
      },
    });
    
    // Store results in cache (30 minutes expiration)
    await cacheData(cacheKey, { garages }, 30 * 60);
    
    return Response.json({ garages });
  } catch (error) {
    logger.error('Error in garage search', { error: getErrorMessage(error) });
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
```

### Database Query Optimization

Example of query optimization with Prisma:

```typescript
// Before: Inefficient query with N+1 problem
const garages = await prisma.garage.findMany();
for (const garage of garages) {
  const services = await prisma.service.findMany({
    where: { garageId: garage.id },
  });
  // Do something with services
}

// After: Optimized query with include
const garages = await prisma.garage.findMany({
  include: {
    services: true,
  },
});
// Now each garage already has its services loaded
```

### ISR Implementation in Next.js

Example of using ISR in a page:

```typescript
// src/app/garages/[id]/page.tsx
import { Garage } from '@prisma/client';
import prisma from '@/lib/prisma';

interface GaragePageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  // Pre-render the most popular garages
  const popularGarages = await prisma.garage.findMany({
    where: { featured: true },
    select: { id: true },
  });

  return popularGarages.map((garage) => ({
    id: garage.id,
  }));
}

export default async function GaragePage({ params }: GaragePageProps) {
  const garage = await getGarage(params.id);
  
  if (!garage) {
    return <div>Garage not found</div>;
  }
  
  return (
    <div>
      {/* Page content */}
    </div>
  );
}

async function getGarage(id: string) {
  const garage = await prisma.garage.findUnique({
    where: { id },
    include: {
      services: true,
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
  
  return garage;
}

// Configure ISR with revalidation every 1 hour
export const revalidate = 3600;
```

## 5. Security and Protection

### Rate Limiting Implementation

```bash
# Install rate limiting package
npm install @upstash/ratelimit @upstash/redis
```

Create middleware for rate limiting:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create limiter for authentication (10 attempts per minute)
const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

// Create limiter for general API (100 requests per minute)
const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip = request.ip || '127.0.0.1';
  const path = request.nextUrl.pathname;
  
  // Apply more restrictive rate limiting for authentication routes
  if (path.startsWith('/api/auth')) {
    const { success, limit, reset, remaining } = await authLimiter.limit(`auth_${ip}`);
    
    if (!success) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }
  
  // Apply general rate limiting for other API routes
  else if (path.startsWith('/api/')) {
    const { success, limit, reset, remaining } = await apiLimiter.limit(`api_${ip}`);
    
    if (!success) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }
  
  return NextResponse.next();
}

// Configure which routes should go through the middleware
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
```

## 6. Database Scalability

### Connection Pooling Configuration with Prisma

Update `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Connection pooling configurations
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configure connection pooling
    // https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-pool
    __internal: {
      engine: {
        connectionLimit: 5, // Maximum number of connections in the pool
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Prisma Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  }
});

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

This implementation guide provides detailed instructions for each improvement area identified in the roadmap. The implementations should be adapted as needed based on the project's evolution and specific requirements.

Remember to update the documentation as implementations are completed and to maintain best development practices throughout the process.