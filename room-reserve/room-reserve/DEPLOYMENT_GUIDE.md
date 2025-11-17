# Room Reserve - Vercel Deployment Guide

## Step-by-Step Deployment Instructions

### Prerequisites
- GitHub repository: `Daniel-Itzhaki/RoomReserve`
- Vercel account (already authorized)
- Database URL ready

---

## Step 1: Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** ? **"Project"**
3. Import your GitHub repository: `Daniel-Itzhaki/RoomReserve`
4. Click **"Import"**

---

## Step 2: Configure Project Settings

### 2.1 General Settings
1. **Project Name**: `room-reserve` (or your preferred name)
2. **Framework Preset**: Select **"Next.js"** (IMPORTANT!)
3. **Root Directory**: Click **"Edit"** and set to: `room-reserve/room-reserve`
4. **Build Command**: Leave as default (`npm run build`)
5. **Output Directory**: Leave as default (`.next`)
6. **Install Command**: Leave as default (`npm install`)

### 2.2 Environment Variables
Go to **Settings** ? **Environment Variables** and add:

#### Required Variables:
```
DATABASE_URL
Value: postgres://aaa61edc9d0615142f8d314fec7e726629fb7dc21e11ab031c2c52431b05a2cd:sk_VoM8xcvRGONAkUEJXXOEM@db.prisma.io:5432/postgres?sslmode=require
Environment: Production, Preview, Development

NEXTAUTH_URL
Value: https://your-project-name.vercel.app
Environment: Production, Preview, Development
(Replace with your actual Vercel URL after first deployment)

NEXTAUTH_SECRET
Value: [Generate a random string - use: openssl rand -base64 32]
Environment: Production, Preview, Development

SMTP_HOST
Value: smtp.gmail.com
Environment: Production

SMTP_PORT
Value: 587
Environment: Production

SMTP_USER
Value: your-email@gmail.com
Environment: Production
(Your Gmail address)

SMTP_PASS
Value: your-app-password
Environment: Production
(Gmail App Password - not your regular password)

EMAIL_FROM
Value: Room Reserve <noreply@yourdomain.com>
Environment: Production
```

---

## Step 3: Update package.json Build Script

The `package.json` should have this build script:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Important**: Do NOT include `prisma db push` in the build script. We'll run it manually after first deployment.

---

## Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete (usually 1-2 minutes)
3. If build fails, check the build logs for errors

---

## Step 5: Run Database Migration (After First Deployment)

After the first successful deployment:

### Option A: Using Vercel CLI (Recommended)
```bash
cd room-reserve/room-reserve
npx vercel env pull .env.local
npx prisma db push --accept-data-loss
```

### Option B: Using Prisma Studio (Alternative)
1. Install Prisma CLI: `npm install -g prisma`
2. Set DATABASE_URL: `export DATABASE_URL="your-database-url"`
3. Run: `npx prisma db push --accept-data-loss`

### Option C: Manual SQL (If needed)
Connect to your PostgreSQL database and run:
```sql
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
-- Then run the rest of your schema
```

---

## Step 6: Verify Deployment

1. Visit your deployment URL: `https://your-project-name.vercel.app`
2. You should see authentication required (this is normal)
3. Visit: `https://your-project-name.vercel.app/auth/signin`
4. Visit: `https://your-project-name.vercel.app/auth/signup`
5. Try creating an account

---

## Step 7: Set Up Admin User

After creating your first user account, you need to make yourself admin:

### Option A: Using Prisma Studio
1. Run: `npx prisma studio`
2. Open the `User` table
3. Find your user
4. Change `role` from `USER` to `ADMIN`
5. Save

### Option B: Using SQL
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

---

## Troubleshooting

### Issue: 404 Not Found
- **Solution**: Check that Root Directory is set to `room-reserve/room-reserve`
- **Solution**: Verify Framework Preset is set to "Next.js"

### Issue: Build Fails
- **Check**: Build logs in Vercel dashboard
- **Common fixes**: 
  - Ensure all environment variables are set
  - Check that `package.json` has correct build script
  - Verify Node.js version (should be 22.x)

### Issue: Database Connection Error
- **Check**: DATABASE_URL is correct
- **Check**: Database allows connections from Vercel IPs
- **Solution**: Run `prisma db push` manually after deployment

### Issue: Sign Up Returns 500 Error
- **Cause**: Database schema not synced
- **Solution**: Run `prisma db push --accept-data-loss` manually

### Issue: Authentication Required on All Pages
- **This is normal**: NextAuth protects routes
- **Solution**: Access `/auth/signin` or `/auth/signup` directly

---

## Important URLs After Deployment

- **Production URL**: `https://your-project-name.vercel.app`
- **Sign In**: `https://your-project-name.vercel.app/auth/signin`
- **Sign Up**: `https://your-project-name.vercel.app/auth/signup`
- **Dashboard**: `https://your-project-name.vercel.app/dashboard` (after login)
- **Calendar**: `https://your-project-name.vercel.app/calendar` (after login)

---

## Quick Checklist

- [ ] Created Vercel project
- [ ] Set Framework Preset to "Next.js"
- [ ] Set Root Directory to `room-reserve/room-reserve`
- [ ] Added all environment variables
- [ ] Deployed successfully
- [ ] Ran `prisma db push` manually
- [ ] Created first user account
- [ ] Set user role to ADMIN
- [ ] Tested sign in/sign up
- [ ] Tested creating a booking

---

## Notes

- The database schema will be created automatically when you run `prisma db push`
- You only need to run `prisma db push` once (after first deployment)
- Future deployments will use the existing database schema
- Make sure to update `NEXTAUTH_URL` with your actual Vercel URL after first deployment
