# Fix: DATABASE_URL Environment Variable Error

## Problem
You're getting: `Error: Environment variable not found: DATABASE_URL`

## Solution

### Step 1: Add DATABASE_URL to Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/daniels-projects-58e97ebc/room-reserve-pied/settings/environment-variables
2. Click **"Add New"**
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgres://aaa61edc9d0615142f8d314fec7e726629fb7dc21e11ab031c2c52431b05a2cd:sk_VoM8xcvRGONAkUEJXXOEM@db.prisma.io:5432/postgres?sslmode=require`
   - **Environment**: Select **ALL** (Production, Preview, Development)
4. Click **"Save"**

### Step 2: Redeploy

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic deployment

### Step 3: Verify

After redeployment, check:
- Build logs should show "Prisma schema loaded" without errors
- Application should load without "Application error"

## Important Notes

- **DATABASE_URL must be set for ALL environments** (Production, Preview, Development)
- Prisma needs DATABASE_URL during `prisma generate` step
- The build will fail if DATABASE_URL is missing

## Alternative: If You Don't Want DATABASE_URL in Build

If you want to skip Prisma during build (not recommended), you can modify `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "postinstall": "prisma generate || true"
  }
}
```

But this is **NOT recommended** because:
- Prisma Client won't be generated
- Your app will fail at runtime

## Recommended Approach

**Always set DATABASE_URL in Vercel environment variables for all environments.**
