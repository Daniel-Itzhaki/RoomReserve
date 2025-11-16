# Vercel Deployment Guide

This guide will help you deploy RoomReserve to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (already done)

## Deployment Steps

### Option 1: Deploy via CLI (Fastest)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? **room-reserve** (or your choice)
   - Directory? **./
   - Override settings? **N**

3. **Set Environment Variables**

   After deployment, you need to set up environment variables in the Vercel dashboard:

   a. Go to your project on Vercel
   b. Click "Settings" → "Environment Variables"
   c. Add these variables:

   ```
   DATABASE_URL="postgresql://user:password@host/database"
   NEXTAUTH_URL="https://your-app.vercel.app"
   NEXTAUTH_SECRET="[generate with: openssl rand -base64 32]"
   ```

   Optional variables:
   ```
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT="587"
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="noreply@yourcompany.com"
   CRON_SECRET="your-cron-secret"
   ```

4. **Set up Production Database**

   For production, you'll need a PostgreSQL database. Options:

   **Option A: Vercel Postgres (Recommended)**
   ```bash
   vercel postgres create
   ```
   This will automatically set DATABASE_URL

   **Option B: External Provider**
   - [Supabase](https://supabase.com) - Free tier available
   - [Railway](https://railway.app) - Easy setup
   - [Neon](https://neon.tech) - Serverless Postgres

   Get your connection string and add it to Vercel environment variables.

5. **Update Prisma Schema for PostgreSQL**

   In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"  // changed from sqlite
     url      = env("DATABASE_URL")
   }
   ```

6. **Run Database Migrations**
   ```bash
   # After setting up DATABASE_URL in Vercel
   npx prisma migrate deploy
   npx prisma db seed
   ```

7. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub (Recommended for Teams)

1. **Push to GitHub**
   ```bash
   # Create a new repository on GitHub first
   git remote add origin https://github.com/yourusername/room-reserve.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables in the deployment settings
   - Click "Deploy"

3. **Set Environment Variables** (same as above)

4. **Set up Database** (same as above)

## Post-Deployment

### 1. Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```
Add this to your Vercel environment variables.

### 2. Update NEXTAUTH_URL
Set it to your Vercel deployment URL:
```
NEXTAUTH_URL="https://room-reserve.vercel.app"
```

### 3. Configure Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Add authorized redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

### 4. Set up Cron Job for Reminders (Optional)

Use Vercel Cron or external service:

**Option A: Vercel Cron**
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "*/5 * * * *"
  }]
}
```

**Option B: External Cron Service**
Use [cron-job.org](https://cron-job.org) to call:
```
https://your-app.vercel.app/api/cron/send-reminders
```
with header:
```
Authorization: Bearer your-cron-secret
```

## Database Seeding in Production

To seed your production database:

1. Install dependencies locally with production DATABASE_URL
2. Run:
   ```bash
   npx prisma db seed
   ```

Or create an API endpoint for seeding (secure it with a secret).

## Troubleshooting

**Issue: Database connection errors**
- Verify DATABASE_URL is set correctly in Vercel
- For Vercel Postgres, make sure it's linked to your project

**Issue: Authentication not working**
- Check NEXTAUTH_SECRET and NEXTAUTH_URL are set
- Verify Google OAuth redirect URIs match your domain

**Issue: Build fails**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript errors locally first

## Monitoring

- **Logs**: View in Vercel dashboard under "Deployments" → "Functions"
- **Analytics**: Enable in Vercel project settings
- **Performance**: Use Vercel Speed Insights

## Custom Domain (Optional)

1. Go to your Vercel project
2. Settings → Domains
3. Add your custom domain
4. Update DNS records as shown
5. Update NEXTAUTH_URL to your custom domain

## Environment Variables Summary

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your app's URL
- `NEXTAUTH_SECRET` - Random secret for JWT

**Optional:**
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `EMAIL_SERVER_*` - For email notifications
- `CRON_SECRET` - For reminder emails endpoint

## Security Checklist

- ✅ NEXTAUTH_SECRET is strong and random
- ✅ Database credentials are secure
- ✅ .env files are not committed
- ✅ CRON_SECRET is set for reminder endpoint
- ✅ CORS is properly configured
- ✅ Rate limiting enabled (Vercel does this automatically)

## Performance Optimization

Vercel automatically handles:
- Edge caching
- Image optimization
- Code splitting
- Compression

For better performance:
- Use Vercel Postgres for lower latency
- Enable Edge Functions if needed
- Add database indexes (already done in schema)

---

Your app is now live and production-ready! 🚀
