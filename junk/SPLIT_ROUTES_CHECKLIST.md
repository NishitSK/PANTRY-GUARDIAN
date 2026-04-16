# Split Routes Checklist

Status: Frontend API callers now use configurable base URL helper.

## Updated client areas
- lib/usePushNotifications.ts
- app/inventory/page.tsx
- app/profile/page.tsx
- components/ImageCapture.tsx
- components/dashboard/ReceiptScanModal.tsx
- components/SpoilageNotifier.tsx
- app/ocr-test/page.tsx

## Verification steps before cutover
1. Set NEXT_PUBLIC_API_URL to backend Render URL in frontend production environment.
2. Confirm inventory list/create/update/delete works.
3. Confirm profile fetch/update works.
4. Confirm image analysis and OCR fallback flow works.
5. Confirm push subscribe/unsubscribe works.
6. Confirm scheduled notifications endpoint still authenticates with CRON_SECRET.

## Remaining migration work
1. Frontend still has server-rendered pages using direct DB access in app/dashboard, app/insights, and app/recipes.
2. For a pure frontend deployment, refactor those pages to fetch from backend APIs instead of importing models/connectDB.

## Cutover rule
When frontend and backend are deployed separately, no client code should rely on same-origin '/api' calls.
