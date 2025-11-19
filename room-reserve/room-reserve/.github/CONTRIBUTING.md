# Contributing Guide

## Pre-commit Checks

Before committing, make sure to run:

```bash
npm run validate
```

This will:
- ✅ Validate Prisma schema syntax
- ✅ Generate Prisma client
- ✅ Run TypeScript type checking
- ✅ Run ESLint

## Schema Changes

When making changes to `prisma/schema.prisma`:

1. **Always create a migration** for production deployments:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Test locally** before pushing:
   ```bash
   npm run validate:schema
   npm run build
   ```

3. **Verify the migration** was created:
   ```bash
   ls prisma/migrations/
   ```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

- ✅ Validates Prisma schema
- ✅ Generates Prisma client
- ✅ Runs TypeScript type checking
- ✅ Runs linting
- ✅ Builds the application
- ✅ Tests database migrations

**If any step fails, the PR will be blocked from merging.**

## Common Issues

### Schema Validation Fails

If you see errors like:
```
The column `Room.imageUrl` does not exist in the current database.
```

**Solution:**
1. Check if your schema changes have migrations
2. Ensure migrations are committed with your schema changes
3. Run `npm run validate:schema` locally before pushing

### Missing Migrations

If the CI detects schema changes without migrations:
1. Create a migration: `npx prisma migrate dev --name <name>`
2. Commit both the schema and migration files
3. Push again

## Best Practices

1. **Never commit schema changes without migrations** (for production)
2. **Always run `npm run validate`** before pushing
3. **Test migrations locally** before deploying
4. **Keep migrations small and focused** - one logical change per migration
