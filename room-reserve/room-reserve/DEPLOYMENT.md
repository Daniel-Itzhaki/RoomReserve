# Deployment Guide for Vercel

## Quick Start

Your code is now on GitHub at: `https://github.com/Daniel-Itzhaki/RoomReserve`

## Step-by-Step Vercel Deployment

### 1. Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up/login with your GitHub account

### 2. Import Project
- Click "Add New Project"
- Select your `RoomReserve` repository
- Vercel will auto-detect Next.js

### 3. Configure Project Settings

**Root Directory**: Set to `room-reserve/room-reserve`

**Build Command**: `npm run build` (or leave default)
**Output Directory**: `.next` (or leave default)
**Install Command**: `npm install` (or leave default)

### 4. Set Environment Variables

In Vercel dashboard ? Settings ? Environment Variables, add:

#### Required Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
```

**Get a PostgreSQL database:**
- **Vercel Postgres** (Recommended - easiest): In Vercel dashboard ? Storage ? Create Database
- **Supabase**: https://supabase.com (free tier available)
- **Neon**: https://neon.tech (free tier available)
- **Railway**: https://railway.app (free tier available)

```
NEXTAUTH_URL=https://your-app-name.vercel.app
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

```
NEXTAUTH_SECRET=<paste-generated-secret>
```

#### Email Configuration (SMTP):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=Room Reserve <noreply@yourdomain.com>
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

### 5. Deploy

- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-app-name.vercel.app`

### 6. Run Database Migrations

After first deployment, run migrations:

**Option A: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel link
npx prisma db push
```

**Option B: Via Database Provider**
- Connect to your database using a client (pgAdmin, DBeaver, etc.)
- Run the Prisma migrations manually

**Option C: Add Migration Script**
Add this to your `package.json` scripts:
```json
"vercel-build": "prisma generate && prisma db push && next build"
```

### 7. Create Admin User

After deployment, you need to create an admin user:

1. Sign up through the app: `https://your-app.vercel.app/auth/signup`
2. Connect to your database
3. Update the user's role to `ADMIN`:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Or use Prisma Studio:
```bash
npx prisma studio
```

## Post-Deployment Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Test booking creation
- [ ] Test recurring meetings
- [ ] Test guest invitations
- [ ] Test email notifications

## Troubleshooting

### Build Fails
- Check that `DATABASE_URL` is set correctly
- Ensure Prisma can generate client (check build logs)
- Verify Node.js version (should be 18+)

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled if required

### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- Test SMTP connection separately
- Consider using Resend or SendGrid for better deliverability

## Custom Domain (Optional)

1. Go to Vercel Dashboard ? Settings ? Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` to your custom domain
4. Redeploy

## Monitoring

- Check Vercel dashboard for build logs
- Monitor function logs for API errors
- Set up error tracking (Sentry, etc.)

## Need Help?

- Check Vercel docs: https://vercel.com/docs
- Prisma docs: https://www.prisma.io/docs
- Next.js docs: https://nextjs.org/docs
