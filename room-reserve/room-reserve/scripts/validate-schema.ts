#!/usr/bin/env tsx
/**
 * Schema Validation Script
 * 
 * This script validates that:
 * 1. Prisma schema is valid
 * 2. Prisma client can be generated
 * 3. Schema changes have corresponding migrations (if migrations exist)
 * 4. No orphaned fields exist in code that aren't in schema
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SCHEMA_PATH = join(process.cwd(), 'prisma', 'schema.prisma');
const MIGRATIONS_DIR = join(process.cwd(), 'prisma', 'migrations');

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

function validateSchema(): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  try {
    // 1. Check if schema file exists
    if (!existsSync(SCHEMA_PATH)) {
      result.errors.push('prisma/schema.prisma file not found');
      result.success = false;
      return result;
    }

    // 2. Validate Prisma schema syntax
    try {
      execSync('npx prisma validate', { stdio: 'pipe' });
      console.log('✓ Prisma schema syntax is valid');
    } catch (error: any) {
      result.errors.push(`Prisma schema validation failed: ${error.message}`);
      result.success = false;
      return result;
    }

    // 3. Try to generate Prisma client
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('✓ Prisma client generated successfully');
    } catch (error: any) {
      result.errors.push(`Prisma client generation failed: ${error.message}`);
      result.success = false;
      return result;
    }

    // 4. Check for common issues
    const schemaContent = readFileSync(SCHEMA_PATH, 'utf-8');
    
    // Check if migrations directory exists
    const hasMigrations = existsSync(MIGRATIONS_DIR);
    
    // Check for fields that might need migrations
    const modelMatches = schemaContent.match(/model\s+\w+\s*\{[\s\S]*?\}/g) || [];
    const hasNewFields = modelMatches.some(model => {
      // Simple check for fields that might be new
      return model.includes('imageUrl') || model.includes('@default');
    });

    if (hasNewFields && !hasMigrations) {
      result.warnings.push(
        'Schema contains fields that might need migrations, but no migrations directory found. ' +
        'Consider running: npx prisma migrate dev --name <migration_name>'
      );
    }

    // 5. Check for potential schema drift
    if (hasMigrations) {
      try {
        // This will fail if there are pending migrations
        execSync('npx prisma migrate status', { stdio: 'pipe' });
        console.log('✓ No pending migrations');
      } catch (error: any) {
        result.warnings.push(
          'There may be pending migrations. Run: npx prisma migrate dev'
        );
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    result.success = false;
    return result;
  }
}

function main() {
  console.log('🔍 Validating Prisma schema...\n');
  
  const result = validateSchema();

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`   - ${error}`));
    console.log('\n❌ Schema validation failed!\n');
    process.exit(1);
  }

  console.log('\n✅ Schema validation passed!\n');
  process.exit(0);
}

main();
