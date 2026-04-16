# Pantry Guardian

Pantry Guardian is a brutalist pantry control system for tracking inventory, predicting expiry, and reducing food waste using storage-aware logic and OCR-assisted intake.

## Live Demo

- https://pantry123.vercel.app

## What It Does

- Tracks pantry items with product, quantity, storage, purchase/open dates, and notes.
- Computes expiry status based on storage method shelf-life (room/fridge/freezer).
- Highlights expiring/expired items in dashboard and inventory views.
- Suggests better storage when current storage is reducing freshness.
- Adds groceries via OCR receipt scanning with review/confirmation flow.
- Supports bulk add from review list (including auto-create fallback for unmatched products).
- Includes push-notification plumbing and in-app spoilage notifier.

## OCR Flow (Current)

1. Upload receipt in Add Item or OCR Test.
2. Server OCR route is attempted first.
3. If server OCR fails, browser OCR fallback (tesseract.js) extracts text.
4. Selective parser filters receipt noise, applies grocery matching/fuzzy correction.
5. Review list allows editing matched names, quantity, and storage.
6. Add all reviewed items to inventory in one action.

## Tech Stack

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + Framer Motion
- Auth: Clerk
- Database: MongoDB + Mongoose
- OCR/AI libs: tesseract.js, openai, Google AI/vision packages (project includes multiple providers)
- Charts/UI utilities: recharts, lucide-react

## Requirements

- Node.js 22.x
- npm 10+
- MongoDB (local or Atlas)

## Environment Variables

Minimum recommended setup:

```env
MONGODB_URI="mongodb://127.0.0.1:27017/pantry-guardian"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"

# Optional but recommended for server OCR
RECEIPT_OCR_API_URL="http://localhost:8000"
RECEIPT_OCR_OCR_PATH="/ocr/"

# Optional weather integration
WEATHER_API_KEY="your-weather-api-key"

# Optional AI provider keys used by some routes/utilities
OPENAI_API_KEY="..."
GEMINI_API_KEY="..."
```

## Run Locally

Make sure MongoDB is running on your machine before starting the app. If you use a custom host or port, update `MONGODB_URI` in `.env` accordingly.

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

Seed demo data:

```bash
npm run seed
```

## Project Structure

```text
app/                    # Routes, pages, API handlers
components/             # Shared UI and feature components
lib/                    # Utilities and service helpers
models/                 # Mongoose models
public/                 # Static assets (including /icon.svg)
tools/receipt-ocr/      # Local OCR tooling/server support
junk/                   # Archived/unused files
```

## Notes

- The app uses a brutalist design language across landing/dashboard/inventory.
- Logo asset is centralized at `public/icon.svg` and reused in header/branding.
- Some legacy/deprecated files are intentionally archived under `junk/`.


