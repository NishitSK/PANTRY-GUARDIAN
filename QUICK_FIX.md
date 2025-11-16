# Quick Fix Guide - API URL Configuration

## The Problem

Your frontend on Vercel is trying to call `/api/products` which doesn't exist there (404 error).
The API routes exist on your Render backend, not on Vercel.

## The Solution

### Step 1: Get Your Render Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your `pantry-guardian-backend` service
3. Copy the URL at the top (looks like: `https://pantry-guardian-backend-xxxx.onrender.com`)

### Step 2: Set Environment Variable on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your `pantry-guardian` project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-xxxx.onrender.com` (your Render URL from Step 1)
   - **Environment**: Check all three (Production, Preview, Development)
5. Click **Save**

### Step 3: Update Render Environment Variable

On Render, make sure `FRONTEND_URL` is set to your Vercel URL:

1. Go to Render Dashboard → Your backend service
2. Go to **Environment**
3. Update or add:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://pantry-guardian.vercel.app` (your actual Vercel URL)
4. Click **Save Changes**

### Step 4: Redeploy

**Vercel:**
- Go to Deployments tab
- Click "Redeploy" on the latest deployment
- OR just push any commit to trigger redeploy

**Render:**
- Should auto-redeploy when you save environment variables
- OR click "Manual Deploy" → "Deploy latest commit"

### Step 5: Test

1. Open your Vercel app: `https://pantry-guardian.vercel.app`
2. Open Browser DevTools (F12)
3. Go to **Network** tab
4. Try to load the app
5. Look for API calls - they should now go to:
   - ✅ `https://your-backend.onrender.com/api/products`
   - ✅ `https://your-backend.onrender.com/api/storage-methods`
   - ✅ `https://your-backend.onrender.com/api/weather/current`

NOT to:
   - ❌ `https://pantry-guardian.vercel.app/api/products` (404)

## Verification Checklist

- [ ] `NEXT_PUBLIC_API_URL` is set on Vercel (must start with `https://`)
- [ ] `FRONTEND_URL` is set on Render (your Vercel URL)
- [ ] Both services have been redeployed after setting env vars
- [ ] Render backend health check works: Visit `https://your-backend.onrender.com/health`
- [ ] Network tab shows API calls going to Render (not Vercel)
- [ ] No CORS errors in browser console
- [ ] No 404 errors for `/api/*` paths

## Common Issues

### Issue: Still getting 404 errors

**Cause:** `NEXT_PUBLIC_API_URL` not set on Vercel or frontend not redeployed

**Fix:** 
1. Verify env var is set in Vercel Settings
2. Redeploy frontend
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: CORS errors

**Cause:** `FRONTEND_URL` not set correctly on Render backend

**Fix:**
1. Set `FRONTEND_URL=https://pantry-guardian.vercel.app` on Render
2. Redeploy backend
3. Check Render logs for "CORS blocked origin" messages

### Issue: Backend returns 500 errors

**Cause:** Environment variables missing on Render

**Fix:**
1. Verify these are set on Render:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `WEATHER_API_KEY`
   - `FRONTEND_URL`
2. Check Render logs for specific errors

### Issue: Weather API CORS error

**Cause:** Frontend trying to call OpenWeather API directly

**Fix:** Already fixed! Weather calls go through your backend at `/api/weather/current`

## How to Check Current Setup

### Check Vercel Environment Variables

```bash
# In your project
vercel env ls
```

Or check in Vercel Dashboard → Settings → Environment Variables

### Check Render Environment Variables

Go to Render Dashboard → Your service → Environment tab

### Test Backend Directly

Open in browser or use curl:

```bash
# Health check (should work without auth)
curl https://your-backend.onrender.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Check Frontend Code

The code is already correctly using `getApiBaseUrl()`:

```typescript
const baseUrl = getApiBaseUrl()
fetch(`${baseUrl}/api/products`)
```

This will:
- Return `""` locally (uses Next.js API routes)
- Return `"https://your-backend.onrender.com"` on Vercel (if env var is set)

## Need More Help?

1. Check Render logs: Dashboard → Your service → Logs
2. Check Vercel logs: Dashboard → Your project → Deployments → View Function Logs
3. Check browser console for errors
4. Share the error messages for more specific help

## Quick Commands

```bash
# Check if env var is being used (in browser console on Vercel site)
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should show: "https://your-backend.onrender.com"

# Test backend health
curl https://your-backend.onrender.com/health

# Redeploy Vercel (from terminal)
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

## Expected URLs After Fix

| What | Where | Correct URL |
|------|-------|-------------|
| Frontend | Vercel | `https://pantry-guardian.vercel.app` |
| Backend API | Render | `https://pantry-guardian-backend-xxxx.onrender.com` |
| Products API | Backend | `https://backend-xxxx.onrender.com/api/products` |
| Weather API | Backend | `https://backend-xxxx.onrender.com/api/weather/current` |
| Health Check | Backend | `https://backend-xxxx.onrender.com/health` |

Your frontend should NEVER call its own `/api/*` paths - all API calls must go to Render!
