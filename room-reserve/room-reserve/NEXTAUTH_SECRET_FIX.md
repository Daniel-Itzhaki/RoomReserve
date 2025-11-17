# Fix: NextAuth Missing Secret Error

## Problem
You're getting: `Error [MissingSecretError]: Please define a 'secret' in production.`

## Solution: Add NEXTAUTH_SECRET

### Step 1: Generate a Secret
Run this command to generate a secure random secret:
```bash
openssl rand -base64 32
```

Or use this online generator: https://generate-secret.vercel.app/32

### Step 2: Add to Vercel Environment Variables

1. Go to: https://vercel.com/daniels-projects-58e97ebc/room-reserve-pied/settings/environment-variables
2. Click **"Add New"**
3. Fill in:
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: Paste the generated secret (from Step 1)
   - **Environment**: Select **ALL** (Production, Preview, Development)
4. Click **"Save"**

### Step 3: Update NEXTAUTH_URL (if not already set)

Also make sure `NEXTAUTH_URL` is set:
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://room-reserve-pied.vercel.app`
- **Environment**: Production, Preview, Development

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

Or push a new commit to trigger automatic deployment.

## Quick Secret Generator

If you don't have `openssl`, you can use this Node.js command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use this Python command:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Important Notes

- **NEXTAUTH_SECRET must be set for ALL environments**
- Use a different secret for each environment (or same for all - your choice)
- Never commit the secret to git
- Keep it secure and don't share it publicly
