# 🍎 Pantry Guardian
**Brutalist Inventory Control & AI Smart Scanning**

Pantry Guardian is a modern, responsive web application built to help you track your groceries, reduce food waste, and get creative with recipes. It uses AI and OCR to intelligently analyze your grocery receipts and items, predict expiry dates, and manage your kitchen inventory in a beautifully bold, brutalist UI.

## ✨ Key Features
- **AI Smart Scan (OCR):** Upload or capture photos of grocery receipts. The app uses advanced OCR (Optical Character Recognition) to instantly extract product names, quantities, and suggest optimal storage methods (Fridge, Freezer, Room Temp).
- **Dynamic Expiry Prediction:** Based on a comprehensive shelf-life database, Pantry Guardian automatically calculates estimated expiry dates tailored to where you store the item.
- **Action-Oriented Dashboard:** Keep an eye on items expiring soon, quick actions to add items, and personalized weather-aware insights.
- **Recipe Gallery:** Turn what's in your pantry into meals. Discover recipes based on your available ingredients.
- **Brutalist Design System:** A clean, high-contrast, black-bordered spatial UI that is both accessible and distinct.
- **Smart Push Notifications:** Get alerted before your food expires.

## 🛠 Tech Stack
- **Frontend:** Next.js 14, React, Tailwind CSS, Clerk (Authentication)
- **Backend (API):** Next.js API Routes, MongoDB (via Prisma/Mongoose)
- **AI / OCR Service:** FastAPI (Python), Google Gemini / Tesseract.js for robust image processing
- **Styling:** Custom Brutalist UI components, responsive layouts, motion animations

## 🚀 Getting Started

Pantry Guardian is divided into three main services:

### 1. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3002 (or 3001 depending on your config)
```

### 2. Backend (Next.js / Optional API separate)
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. OCR Microservice (FastAPI)
```bash
cd ocr
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8005
```

## 🔐 Environment Variables
You will need to set up your `.env` file in the `frontend` directory with:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `GEMINI_API_KEY` (For the AI Smart Scan engine)

## 🎨 Design Philosophy
*Calm, modern, and professional.*
We believe managing chores should not be chaotic. The design relies on high-fidelity spatial awareness, precise typography (Anton & IBM Plex Mono), and context-aware animations that guide rather than distract.

---
*Developed with focus and simplicity.*
