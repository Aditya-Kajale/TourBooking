# 🌲 TourBooking

A premium, state-of-the-art tour booking platform featuring a **Forest-themed** design system. Built with a modern **React (Vite)** frontend and a robust **Django REST Framework** backend.

## ✨ Key Features

- **🌲 Forest Theme & UI/UX**: Professional, market-ready design featuring glassmorphism, curated color palettes, and smooth micro-animations.
- **📱 True Responsive Experience**: Fully optimized for both mobile and high-end desktop views with a dedicated split-screen design for authentication.
- **🗺️ Tour Management**: Create and manage detailed tours with categories (Adventure, Cultural, etc.), durations, and dynamic image uploading with smart URL handling.
- **🔐 Two-Factor Authentication**: Added TOTP-based 2FA support for enhanced login security and recovery using backup codes.
- **⚡ Real-time Seat Updates**: WebSocket-powered real-time availability tracking using Django Channels - seats update instantly as bookings are made, with automatic reconnection and Redis scaling for high traffic.
- **🎟️ Accurate Seat Tracking**: Advanced seat-tracking logic ensures that booked seats are accurately reflected across the platform, from detail pages to the home grid.
- **📊 User Dashboard**: Personalized dashboard for users to track their own created tours and active bookings in one place.
- **⭐ Reviews & Ratings**: Integrated review system for users to share and view feedback on tours.
- **📜 API Documentation**: Fully interactive OpenAPI/Swagger documentation at `/api/docs/`.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, WebSocket (native)
- **Backend**: Django 6.x, Django REST Framework, Django Channels (WebSocket support), Daphne (ASGI), SQLite (Local Development)
- **Real-Time**: Django Channels 4.x, Redis (Channel Layer), ASGI Protocol
- **Authentication**: Token-based secure authentication with Two-Factor Authentication (TOTP + backup codes)
- **Styling**: Vanilla CSS extensions with Glassmorphism and Custom Theme Tokens

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 20.x+ (Recommended: 22.x)
- **npm** or **pnpm**

### Backend Setup (Django)
1. **Navigate to backend**:
   ```bash
   cd backend
   ```
2. **Environment Setup**:
   ```bash
   python -m venv .env
   source .env/bin/activate  # Windows: .env\Scripts\activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Database Initialization**:
   ```bash
   python manage.py migrate
   ```
5. **Run Server**:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup (Vite + React)
1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configuration**:
   Copy `.env.example` to `.env` and ensure `VITE_API_URL` points to your backend (default: `http://127.0.0.1:8000`).
4. **Run Application**:
   ```bash
   npm run dev
   ```

## 🎨 Design Philosophy

TourBooking is built with a focus on **visual excellence** and **interaction design**:
- **Glassmorphism**: Subtle translucent backgrounds and frosted glass effects on cards and modals.
- **Micro-interactions**: Hover effects on tour cards and smooth state transitions for a premium feel.
- **Forest Palette**: A curated selection of deep greens, earthy tones, and high-contrast text for maximum readability.

## 📁 Project Structure

```text
TourBooking/
├── frontend/           # React + Vite + Tailwind source
│   ├── src/            # Components, Hooks, API services
│   └── guidelines/     # UI/UX design tokens
├── backend/            # Django project
│   ├── tours/          # Tour listing and management
│   ├── bookings/       # Booking & Seat tracking logic
│   ├── reviews/        # User feedback system
│   └── users/          # Auth and profile management
└── media/              # Uploaded tour images
```

## 🧪 Testing

We use automated tests to ensure application stability.

### Backend Tests
```bash
cd backend
source .env/bin/activate
pytest
```

### Frontend Component Tests
```bash
cd frontend
npm run test  # Or npx vitest run
```

### End-to-End Tests
```bash
cd frontend
npx cypress open  # Or npx cypress run for headless
```

## 🚀 Deployment Steps

1. **Database & Environment**: Configure your production database (e.g., PostgreSQL) and environment variables (`SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`).
2. **Media Storage**: Ensure AWS S3 variables (`AWS_ACCESS_KEY_ID`, `AWS_STORAGE_BUCKET_NAME`) are set for scalable media handling.
3. **Backend Deployment**: Push your backend code to a provider like Render or Heroku. Run `python manage.py collectstatic` and `python manage.py migrate`.
4. **Frontend Deployment**: Build the React application `npm run build` and deploy the output to Vercel, Netlify, or an S3 bucket.
5. **API Docs**: Access `/api/docs/` on your production backend to view the Swagger UI.

## ⚠️ Known Limitations
- Real-time seat updates are currently handled via Server-Sent Events (SSE). While effective, extremely high-concurrency environments may benefit from an upgrade to WebSockets (Django Channels).
- SQLite is used for local development but must be migrated to a production-ready database (PostgreSQL/MySQL) before deployment.
- Payment processing is currently mocked. A real gateway (like Stripe) needs to be integrated before taking real bookings.

## 📄 License
MIT
