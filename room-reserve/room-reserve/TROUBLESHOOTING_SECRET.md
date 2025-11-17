# Troubleshooting NEXTAUTH_SECRET Error

## If you're still getting NO_SECRET error after adding the variable:

### Step 1: Verify Environment Variable is Set Correctly

1. Go to: https://vercel.com/daniels-projects-58e97ebc/room-reserve-pied/settings/environment-variables
2. Check that `NEXTAUTH_SECRET` exists
3. Verify it's set for **Production** environment (not just Preview/Development)
4. Check for typos: Should be exactly `NEXTAUTH_SECRET` (case-sensitive)

### Step 2: Check Variable Value

Make sure the value:
- Is not empty
- Doesn't have extra spaces
- Is a valid base64 string (should look like: `xL4IVUkRNvhfcK3bW1xeMVbEEpnGQfCJRVmQrBw0uwY=`)

### Step 3: Force Redeploy

After adding/updating the variable:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"..."** ? **"Redeploy"**
4. Make sure to check **"Use existing Build Cache"** is UNCHECKED
5. Click **"Redeploy"**

### Step 4: Verify in Build Logs

After redeploying, check the build logs:
1. Go to the deployment
2. Click **"View Build Logs"**
3. Look for any errors about `NEXTAUTH_SECRET`
4. Verify the build completed successfully

### Step 5: Check Runtime Logs

1. Go to deployment ? **"Functions"** tab
2. Check runtime logs for any errors
3. Look for `NEXTAUTH_SECRET` related errors

### Step 6: Alternative - Set Secret Directly in Code (Temporary)

If nothing works, you can temporarily hardcode it in `lib/auth.ts`:

```typescript
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-here-temporary',
  // ... rest of config
}
```

**?? WARNING**: This is only for testing. Remove the hardcoded secret before going to production!

### Step 7: Verify Environment Variable Names

Make sure you're using the correct variable names:
- ? `NEXTAUTH_SECRET` (correct)
- ? `NEXT_AUTH_SECRET` (wrong)
- ? `NEXTAUTH_SECRET_KEY` (wrong)
- ? `AUTH_SECRET` (wrong)

### Step 8: Check Vercel Project Settings

1. Go to project settings
2. Verify you're editing the correct project (`room-reserve-pied`)
3. Make sure you're in the right team/account

### Common Issues:

1. **Variable only set for Preview/Development**: Must be set for Production too
2. **Typo in variable name**: Must be exactly `NEXTAUTH_SECRET`
3. **Old deployment**: Need to redeploy after adding variable
4. **Build cache**: Clear build cache when redeploying
5. **Wrong project**: Make sure you're editing the correct Vercel project

### Quick Test:

After adding the variable and redeploying, check if it's available:
1. Add a temporary API route: `app/api/test-env/route.ts`
2. Return `process.env.NEXTAUTH_SECRET`
3. Visit the route to verify it's set
