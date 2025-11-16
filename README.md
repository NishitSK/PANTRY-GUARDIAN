# Pantry Guardian

Pantry Guardian is a full-stack inventory management system that allows users to manage pantry items, track stock levels, and organize storage methods. The project includes a modern Next.js frontend and a dedicated Express backend powered by Prisma.

🔗 Live Demo: https://pantry-guardian.vercel.app/

## Features
- Add, edit, and delete pantry items  
- Track categories, quantities, and expiration dates  
- Manage storage methods (room, fridge, freezer, etc.)  
- RESTful Express backend  
- Prisma ORM with migrations  
- JWT-based authentication support  
- Next.js App Router frontend  
- Deployed on Vercel (frontend) and Render (backend)

## Tech Stack

### Frontend
- Next.js 14  
- React  
- TypeScript  
- Tailwind CSS  

### Backend
- Node.js  
- Express  
- Prisma ORM  
- PostgreSQL / MySQL  
- JSON Web Tokens  
- Zod validation  
- dotenv  

### Deployment
- Vercel — Frontend  
- Render — Backend  

## Project Structure
PANTRY-GUARDIAN/
├── app/ # Next.js frontend (App Router)
├── backend/ # Express backend API
│ ├── server.js
│ ├── prisma/
│ ├── routes/
│ ├── controllers/
│ └── package.json
├── prisma/
├── components/
├── public/
├── package.json
└── README.md

shell
Copy code

## Environment Variables

### Frontend (.env)
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com

shell
Copy code

### Backend (.env)
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

shell
Copy code

## Installation

### 1. Clone
git clone https://github.com/NishitSK/PANTRY-GUARDIAN.git
cd PANTRY-GUARDIAN

makefile
Copy code

### 2. Install Dependencies
Frontend:
npm install

makefile
Copy code
Backend:
cd backend
npm install

shell
Copy code

### 3. Prisma Setup
cd backend
npx prisma generate
npx prisma migrate dev
npm run seed # optional

makefile
Copy code

## Development

Frontend:
npm run dev

makefile
Copy code

Backend:
cd backend
npm run dev

markdown
Copy code

## Production
- Frontend deployed to Vercel: https://pantry-guardian.vercel.app/  
- Backend deployed to Render  
  - Build command: `npm install`  
  - Start command: `npm start`

