# Vercel Environment Variables - Complete Setup

## Go to: https://vercel.com/daniels-projects-58e97ebc/room-reserve/settings/environment-variables

## Add These Variables (One by One):

### 1. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `postgres://aaa61edc9d0615142f8d314fec7e726629fb7dc21e11ab031c2c52431b05a2cd:sk_VoM8xcvRGONAkUEJXXOEM@db.prisma.io:5432/postgres?sslmode=require`
- **Environment**: ? Production ? Preview ? Development

### 2. NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: `433NfpWmAX60mcelZzOyKVwEI8taGViFnIwM4wvaa4g=`
- **Environment**: ? Production ? Preview ? Development

### 3. NEXTAUTH_URL
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://room-reserve-daniels-projects-58e97ebc.vercel.app`
- **Environment**: ? Production ? Preview ? Development
- **Note**: Update this to your actual production URL after first deployment

### 4. SMTP_HOST
- **Name**: `SMTP_HOST`
- **Value**: `smtp.gmail.com`
- **Environment**: ? Production

### 5. SMTP_PORT
- **Name**: `SMTP_PORT`
- **Value**: `587`
- **Environment**: ? Production

### 6. SMTP_USER
- **Name**: `SMTP_USER`
- **Value**: `your-email@gmail.com` (Replace with your actual Gmail)
- **Environment**: ? Production

### 7. SMTP_PASS
- **Name**: `SMTP_PASS`
- **Value**: `your-gmail-app-password` (Replace with your Gmail App Password)
- **Environment**: ? Production
- **Note**: This is NOT your regular Gmail password. You need to create an App Password:
  1. Go to Google Account ? Security
  2. Enable 2-Step Verification
  3. Go to App Passwords
  4. Create a new app password for "Mail"
  5. Use that 16-character password here

### 8. EMAIL_FROM
- **Name**: `EMAIL_FROM`
- **Value**: `Room Reserve <noreply@roomreserve.com>`
- **Environment**: ? Production

---

## Quick Checklist:

- [ ] DATABASE_URL added (all environments)
- [ ] NEXTAUTH_SECRET added (all environments) ?? CRITICAL
- [ ] NEXTAUTH_URL added (all environments)
- [ ] SMTP_HOST added (Production)
- [ ] SMTP_PORT added (Production)
- [ ] SMTP_USER added (Production)
- [ ] SMTP_PASS added (Production)
- [ ] EMAIL_FROM added (Production)

---

## After Adding All Variables:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"..."** ? **"Redeploy"**
4. **Uncheck** "Use existing Build Cache"
5. Click **"Redeploy"**

---

## Verify Variables Are Set:

After redeploying, check the build logs to ensure:
- ? No "DATABASE_URL not found" errors
- ? No "NEXTAUTH_SECRET not found" errors
- ? Build completes successfully

---

## Troubleshooting:

### If NEXTAUTH_SECRET still shows error:
1. Double-check the variable name is exactly `NEXTAUTH_SECRET` (case-sensitive)
2. Make sure it's set for **Production** environment (not just Preview/Development)
3. Redeploy WITHOUT build cache
4. Check build logs for any errors

### If DATABASE_URL shows error:
1. Verify the connection string is correct
2. Make sure it's set for all environments
3. Check that your database allows connections from Vercel IPs
