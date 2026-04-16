# Push Notifications Setup Guide

## Overview

Your Pantry Guardian app now supports PWA push notifications with the following features:

1. **Permission Prompt**: Users see a notification permission prompt on the login page
2. **Expiry Alerts**: Automatic notifications when items are about to expire (within 3 days)
3. **Recipe Suggestions**: Random recipe suggestions (2-3 per day)
4. **Rate Limiting**: Limited to 2-3 notifications per user per day
5. **Direct Mobile Support**: Works on mobile browsers (iOS Safari, Android Chrome)

## Files Added

### Frontend
- `components/PushNotificationPrompt.tsx` - Permission request UI shown during login
- `components/PwaInstaller.tsx` - Service worker registration component
- `lib/usePushNotifications.ts` - Hook for managing push subscriptions
- `public/manifest.json` - PWA manifest with app metadata
- `public/service-worker.js` - Service worker handling push events

### Backend
- `models/PushSubscriber.ts` - MongoDB model for storing subscriptions
- `app/api/push/subscribe/route.ts` - Subscribe to push notifications
- `app/api/push/unsubscribe/route.ts` - Unsubscribe from notifications
- `app/api/push/send/route.ts` - Internal API for sending notifications
- `app/api/notifications/schedule/route.ts` - Cron endpoint for scheduled notifications

### Configuration
- `.env` - Added VAPID keys, API keys, and secrets

## Configuration

### 1. VAPID Keys (Already Generated)

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BKJBBuf-ptMv6NSd7cJMhcnRsFiYyPnslRgvKqqjxYXtP0nXYsASNeH5iuj6tIaF8SajBCjcdHDtH9-ytrE1qlU"
VAPID_PRIVATE_KEY="7U86s9bGdF7i6zuIzVWTQmHkxWJTH1REac-jY_OVhlc"
VAPID_SUBJECT="mailto:support@pantyguardian.app"
```

### 2. Security Keys (Change in Production)

⚠️ **IMPORTANT**: Change these in production!

```env
INTERNAL_API_KEY="your-internal-api-key-change-in-production"
CRON_SECRET="your-cron-secret-key-change-in-production"
```

## How It Works

### User Registration Flow

1. User logs in
2. `PushNotificationPrompt` component shows permission request at bottom of screen
3. User clicks "Enable" or browser shows system permission dialog
4. `useP wishNotifications` hook:
   - Registers service worker
   - Requests browser permission
   - Creates push subscription
   - Sends subscription to POST `/api/push/subscribe`
5. `PushSubscriber` model stores the subscription in MongoDB

### Notification Sending Flow

1. **Scheduled Notifications** (via cron):
   - Cron job triggers POST `/api/notifications/schedule`
   - Endpoint finds:
     - Items expiring within 3 days (via Prediction model)
     - Random users for recipe suggestions (rate limited)
   - Sends notifications via POST `/api/push/send`

2. **Sending Process**:
   - Backend uses `web-push` library with VAPID keys
   - Sends encrypted notification payload to each subscriber
   - Service worker receives notification and displays it
   - User can click notification to navigate to relevant page

### Service Worker

The service worker (`public/service-worker.js`):
- Listens for `push` events from the notification service
- Displays system notifications to the user
- Handles notification clicks to navigate users to relevant pages

## Setting Up Cron Jobs

### Option 1: Vercel Cron (Recommended for Vercel deployment)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/schedule",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours.

### Option 2: EasyCron or Similar Service

Create a webhook POST to:

```
https://your-domain.com/api/notifications/schedule
```

Headers:
```
Authorization: Bearer your-cron-secret-key
```

### Option 3: Manual Testing

Test the endpoint locally or in production:

```bash
curl -X POST https://your-domain.com/api/notifications/schedule \
  -H "Authorization: Bearer your-cron-secret-key" \
  -H "Content-Type: application/json"
```

## Testing Locally

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Go to login page (or any page after login)

3. You should see the permission prompt

4. Grant permission

5. Service worker should be registered (check browser DevTools > Application > Service Workers)

6. Test subscription was saved (check MongoDB for PushSubscriber documents)

## Notification Content

### Expiry Alerts
- **Title**: `⏰ Item Expiring Soon`
- **Body**: Shows time remaining ("expires in 2 days!", "expires today!")
- **Tag**: `expiring-{itemId}` - prevents duplicate notifications
- **Click Action**: Navigates to `/inventory`

### Recipe Suggestions
- **Title**: `👨‍🍳 {Recipe Title}`
- **Body**: Recipe description (first 50 chars)
- **Tag**: `recipe-{recipeId}` - prevents duplicate notifications
- **Click Action**: Navigates to `/recipes`

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome Desktop | ✅ | Full support |
| Chrome Mobile (Android) | ✅ | Full support |
| Firefox Desktop | ✅ | Full support |
| Firefox Mobile (Android) | ✅ | Full support |
| Safari Desktop | ⚠️ | Limited - permissions only |
| Safari iOS | ✅ | Homescreen web app only |
| Edge | ✅ | Full support |

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Verify `/public/service-worker.js` exists
- Check browser DevTools > Application > Service Workers

### Notifications Not Showing
- Verify browser notification permission is granted
- Check browser DevTools > Application > Manifest
- Verify VAPID keys are correct in `.env`
- Ensure `web-push` package is installed

### Subscription Not Saving
- Check MongoDB connection
- Verify `PushSubscriber` model is imported
- Check API response in browser Network tab

### Cron Not Triggering
- Verify endpoint URL is correct
- Check cron service logs
- Verify `CRON_SECRET` in Authorization header
- Test manually with curl

## Rate Limiting

The system is designed to avoid notification fatigue:

- **Max 2-3 notifications per user per day**
- **Only unique items notified** when expiring
- **30% chance** to send recipe suggestions (random sampling)
- **3-day expiry window** for items

You can adjust these in:
- `components/PushNotificationPrompt.tsx` - Permission prompt styling
- `app/api/notifications/schedule/route.ts` - Limits and logic

## Disabling Notifications

To disable the permission prompt:

Comment out or remove the `<PushNotificationPrompt />` line from:
- `app/auth/login/[[...login]]/page.tsx`

To unsubscribe a user programmatically:

```typescript
// POST /api/push/unsubscribe
{
  "endpoint": "subscription.endpoint"
}
```

## Security Notes

1. **VAPID Keys**: Are stored in environment variables - keep private key secret
2. **CRON_SECRET**: Used to verify scheduled requests - change in production
3. **INTERNAL_API_KEY**: Used for internal API calls - change in production
4. **Service Worker**: Runs in User's browser - sandbox is enforced by browser
5. **Subscriptions**: Encrypted end-to-end by the browser's push service

## Next Steps

1. ✅ Test locally
2. ✅ Verify notifications work on mobile
3. ⏭️ Set up cron job for production
4. ⏭️ Configure better secrets management (use secret manager)
5. ⏭️ Monitor notification delivery and user engagement
6. ⏭️ Adjust rate limits based on user feedback

## API Reference

### POST `/api/push/subscribe`
Subscribe user to push notifications

**Body**:
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "auth": "...",
    "p256dh": "..."
  }
}
```

### POST `/api/push/unsubscribe`
Unsubscribe user from notifications

**Body**:
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

### POST `/api/push/send` (Internal)
Send notification to user

**Headers**:
```
Authorization: Bearer {INTERNAL_API_KEY}
```

**Body**:
```json
{
  "userId": "user_id",
  "title": "Notification Title",
  "body": "Notification body text",
  "icon": "/icon.svg",
  "badge": "/icon.svg",
  "tag": "unique-tag",
  "data": {
    "type": "notification-type",
    "url": "/path-to-navigate"
  }
}
```

### POST `/api/notifications/schedule` (Cron)
Trigger scheduled notifications (call from cron job)

**Headers**:
```
Authorization: Bearer {CRON_SECRET}
```

**Response**:
```json
{
  "message": "Notifications scheduled successfully",
  "expiringItemsNotified": 5,
  "recipeSuggestionsNotified": 3,
  "errors": []
}
```
