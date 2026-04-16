# Frontend Split Target

This folder is the target home for the frontend app during the split.

## Intended contents
- app/
- components/
- public/
- styles and frontend-only config

## API rule
Frontend code must call backend endpoints via the shared helper in lib/api.ts.
Do not use hardcoded relative '/api/...' URLs in client components.

## Deployment target
- Host: Vercel
- Required env: NEXT_PUBLIC_API_URL (Render backend URL in production)
- Recommended Vercel envs:
	- NEXT_PUBLIC_API_URL = your Render backend URL
	- NEXTAUTH_URL = your Vercel frontend URL
	- NEXTAUTH_SECRET = production auth secret
	- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = Clerk publishable key
	- CLERK_SECRET_KEY = Clerk secret key
	- MONGODB_URI = MongoDB connection string for server-rendered pages

## Current status
- API route folder was removed from this frontend split copy.
- Some server-rendered pages still use direct DB access and must be migrated to backend API calls before full independent frontend deployment.
