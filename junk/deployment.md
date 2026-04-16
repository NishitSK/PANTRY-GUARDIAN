# Deployment Guide

## Split deployment layout
- Frontend: Vercel
- Backend: Render

## Frontend deployment on Vercel
1. Import the repository into Vercel.
2. Set the project root to `frontend`.
3. Use the default Next.js framework detection.
4. Set these environment variables in Vercel:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
   - `NEXTAUTH_URL` = your Vercel frontend URL
   - `NEXTAUTH_SECRET` = production auth secret
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Clerk publishable key
   - `CLERK_SECRET_KEY` = Clerk secret key
   - `MONGODB_URI` = MongoDB connection string for server-rendered pages
5. Deploy.

## Backend deployment on Render
1. Create a new Render Web Service from the same repository.
2. Use the repository root blueprint in `render.yaml`.
3. Set the root directory to `backend`.
4. Set these environment variables in Render:
   - `BACKEND_ONLY_DEPLOY` = `true`
   - `DATABASE_URL`
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `WEATHER_API_KEY`
   - `FRONTEND_URL`
5. Deploy the service and copy the public URL.
6. Put that backend URL into `NEXT_PUBLIC_API_URL` in Vercel.

## Notes
- The frontend uses Next.js rewrites for `/api/*` requests during split deployment.
- Some server-rendered frontend pages still use MongoDB directly, so `MONGODB_URI` is still required for a full deployment.
- Beer, beverages, and other canonical categories are already normalized in the app.
