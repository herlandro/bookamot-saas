# Database Cleanup Script Documentation

## Overview

The `clean-database.ts` script is a secure, production-ready tool for performing complete database cleanup operations. It safely removes all data from the database while preserving admin users and maintaining the database structure.

## ⚠️ WARNING

**THIS SCRIPT WILL DELETE ALL DATA FROM THE DATABASE**

- This action is **IRREVERSIBLE**
- Always run in `--dry-run` mode first to preview changes
- Ensure you have a database backup before running in production
- Double-check the environment before execution

## Features

### Security Features

- ✅ **Explicit Confirmation Required**: Must type "DELETE ALL DATA" to proceed
- ✅ **Environment Verification**: Prevents accidental execution in production without `--force-production`
- ✅ **Transaction-based Operations**: Automatic rollback on failure
- ✅ **Admin User Preservation**: Automatically preserves users with `role='ADMIN'`
- ✅ **Detailed Logging**: Comprehensive logs of all operations
- ✅ **Dry-run Mode**: Simulate operations without making changes

### What Gets Preserved

- ✅ Admin users (users with `role='ADMIN'`)
- ✅ Database structure (tables, indexes, constraints, foreign keys)
- ✅ Database schema and migrations

### What Gets Deleted

- ❌ All non-admin users
- ❌ All bookings
- ❌ All vehicles
- ❌ All garages
- ❌ All reviews
- ❌ All MOT history and results
- ❌ All notifications
- ❌ All email logs
- ❌ All sessions and accounts
- ❌ All other data tables

## Prerequisites

1. **Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/database
   NODE_ENV=production|development|test
   ```

2. **Dependencies**:
   - Node.js v18 or higher
   - TypeScript
   - Prisma Client (generated)
   - Database connection access

## Usage

### Basic Usage

```bash
# Dry-run mode (recommended first step)
npx tsx scripts/clean-database.ts --dry-run

# Normal execution with confirmation
npx tsx scripts/clean-database.ts

# Verbose mode for detailed logging
npx tsx scripts/clean-database.ts --verbose
```

### Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Simulate the operation without making changes |
| `--verbose` | `-v` | Enable detailed debug logging |
| `--admin-email` | `-a` | Preserve a specific user by email (in addition to admins) |
| `--force-production` | `-f` | Allow execution in production environment |

### Examples

#### Example 1: Dry-run to Preview Changes

```bash
npx tsx scripts/clean-database.ts --dry-run --verbose
```

This will:
- Show what would be deleted
- Display table statistics
- Not make any actual changes

#### Example 2: Clean Development Database

```bash
# Set environment
export NODE_ENV=development
export DATABASE_URL=postgresql://user:pass@localhost:5432/bookamot_dev

# Run cleanup
npx tsx scripts/clean-database.ts --verbose
```

#### Example 3: Preserve Specific Admin User

```bash
npx tsx scripts/clean-database.ts --admin-email admin@example.com --verbose
```

This will preserve:
- All users with `role='ADMIN'`
- The user with email `admin@example.com` (even if not admin)

#### Example 4: Production Cleanup (Requires Force Flag)

```bash
# Set production environment
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@prod-host:5432/bookamot

# Run with force flag (requires additional confirmation)
npx tsx scripts/clean-database.ts --force-production --verbose
```

**Note**: Production execution requires:
1. `--force-production` flag
2. Type "DELETE ALL DATA" to confirm
3. Type "YES DELETE PRODUCTION" for additional confirmation

## Execution Flow

1. **Environment Verification**
   - Checks `DATABASE_URL` is set
   - Verifies database connection
   - Checks environment mode (production requires `--force-production`)

2. **Admin User Identification**
   - Finds all users with `role='ADMIN'`
   - Includes any user specified with `--admin-email`
   - Displays list of users to be preserved

3. **Table Statistics**
   - Collects record counts from all tables
   - Displays initial statistics

4. **User Confirmation**
   - Requires typing "DELETE ALL DATA"
   - Additional confirmation for production

5. **Database Cleanup** (if not dry-run)
   - Executes within a transaction
   - Deletes data in correct order (respecting foreign keys)
   - Preserves admin users
   - Automatic rollback on error

6. **Final Statistics**
   - Displays final record counts
   - Shows operation duration

## Error Handling

The script includes robust error handling:

- **Connection Errors**: Fails immediately with clear error message
- **Transaction Errors**: Automatically rolls back all changes
- **Validation Errors**: Prevents execution with helpful messages
- **Unexpected Errors**: Logs detailed error information

## Logging

The script provides multiple log levels:

- **ERROR** (❌): Critical errors that prevent execution
- **WARN** (⚠️): Warnings about potential issues
- **INFO** (ℹ️): General information about operations
- **DEBUG** (🔍): Detailed debug information (requires `--verbose`)

## Safety Measures

1. **Transaction Isolation**: Uses `Serializable` isolation level for maximum safety
2. **Timeout Protection**: 5-minute timeout prevents hanging operations
3. **Automatic Rollback**: Any error triggers automatic rollback
4. **Environment Checks**: Prevents accidental production execution
5. **Explicit Confirmations**: Multiple confirmation steps required

## Best Practices

1. **Always Backup First**
   ```bash
   pg_dump -h host -U user -d database > backup.sql
   ```

2. **Test in Development First**
   ```bash
   # Test in dev environment
   NODE_ENV=development npx tsx scripts/clean-database.ts --dry-run
   ```

3. **Use Dry-run Mode**
   ```bash
   # Always preview changes first
   npx tsx scripts/clean-database.ts --dry-run --verbose
   ```

4. **Monitor Logs**
   - Use `--verbose` flag for detailed information
   - Review all log output before confirming

5. **Verify Admin Users**
   - Check that admin users are correctly identified
   - Verify email addresses if using `--admin-email`

## Troubleshooting

### Issue: "DATABASE_URL environment variable is not set"

**Solution**: Set the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL=postgresql://user:password@host:port/database
```

### Issue: "Failed to connect to database"

**Solution**: 
- Verify database is running
- Check connection string is correct
- Verify network connectivity
- Check firewall rules

### Issue: "Transaction timeout"

**Solution**:
- Database may be too large
- Consider running during off-peak hours
- Check database performance
- Verify no locks on tables

### Issue: "No admin users found"

**Solution**:
- Verify admin users exist in database
- Check user roles are set to 'ADMIN'
- Use `--admin-email` to preserve specific users

## Integration with Package.json

You can add this script to your `package.json`:

```json
{
  "scripts": {
    "db:clean": "tsx scripts/clean-database.ts",
    "db:clean:dry-run": "tsx scripts/clean-database.ts --dry-run --verbose",
    "db:clean:prod": "tsx scripts/clean-database.ts --force-production --verbose"
  }
}
```

Then run:
```bash
npm run db:clean:dry-run  # Preview changes
npm run db:clean          # Execute cleanup
```

## Support

For issues or questions:
1. Check the logs with `--verbose` flag
2. Verify environment variables
3. Test database connection separately
4. Review error messages carefully

## Version History

- **v1.0.0**: Initial release with full security features

