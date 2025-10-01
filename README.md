# Piggy-Goals
“A personal finance management app to track income, expenses, transfers, and savings using React, Node.js, and MongoDB.”

📌 PiggyBank – Smart Savings App

A modern savings app prototype inspired by Piggy Goals / SaveJar concepts.
This app allows users to:

Create savings jars with goals

Deposit into jars and track progress

View overall bank balance (mock/demo integration)

See transaction history

Authenticate securely (JWT/Auth system)

Integrate with Stripe demo payment flow (prototype only)

Enjoy a modern, attractive React + Tailwind UI

🚀 Tech Stack

Frontend: React, Tailwind CSS, Framer Motion

Backend: Node.js, Express.js

Database: MongoDB (Mongoose ORM)

Auth: JWT (JSON Web Tokens)

Payments: Stripe (test/demo mode only)

Deployment: Vercel (frontend) + Render/Heroku (backend) + MongoDB Atlas

⚡ Features

✅ User Authentication (Sign up, Login, JWT-based sessions)
✅ Create & Manage Savings Jars
✅ Set Goals & Track Progress
✅ Deposit to Jar (with Stripe demo payment)
✅ Mock Bank Account Balance & Transactions
✅ Transaction History (savings + deposits)
✅ Clean, modern UI with animations

🔑 API & Services Used

Stripe API → For handling deposits/payments (test mode).

MongoDB Atlas → Cloud database for users, jars, and transactions.

JWT → For secure authentication.

🛠️ Setup & Installation
1️⃣ Clone Repository
git clone https://github.com/your-username/piggybank.git
cd piggybank

2️⃣ Setup Backend
cd backend
npm install


Create .env file inside backend/ with:

PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret


Run backend:

npm run dev

3️⃣ Setup Frontend
cd frontend
npm install


Create .env file inside frontend/ with:

REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_KEY=your_stripe_publishable_key


Run frontend:

npm start

🌍 Deployment

Frontend (React): Deploy on Vercel

Backend (Express): Deploy on Render
 or Heroku

Database: MongoDB Atlas

Stripe Keys: Use test keys from Stripe Dashboard

📊 Example Flow

Sign up / Login

Link Bank (mock balance shown)

Create a savings jar

Deposit using Stripe test card (4242 4242 4242 4242)

See updated jar + transaction history

🎯 Future Scope

Real UPI/Bank integrations

Rewards/interest system

Social saving groups
