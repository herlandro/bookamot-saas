-- BookaMOT Database Initialization Script
-- This script runs when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- This file is for additional initialization

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON "Booking"("customerId");
CREATE INDEX IF NOT EXISTS idx_bookings_garage_id ON "Booking"("garageId");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON "Booking"(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON "Booking"(date);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON "Vehicle"("ownerId");
CREATE INDEX IF NOT EXISTS idx_garage_city ON "Garage"(city);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON "Review"("reviewerId");
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON "Review"("bookingId");

-- Set up connection limits
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Create role for application if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'bookamot_app') THEN
    CREATE ROLE bookamot_app WITH LOGIN PASSWORD 'changeme';
  END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE bookamot TO bookamot_app;
GRANT USAGE ON SCHEMA public TO bookamot_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bookamot_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bookamot_app;

