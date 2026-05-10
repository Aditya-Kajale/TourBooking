# 🌲 TourBooking

**A premium, high-performance tour booking platform built for scalability, security, and real-time user experiences.**

## ✨ Core Features
- **Real-Time Seat Tracking**: Live seat availability powered by WebSockets, Django Channels, and Redis.
- **Enterprise Security**: Token-based authentication with TOTP Two-Factor Authentication (2FA) and backup codes.
- **Guide Verification**: Dedicated Admin Dashboard for reviewing and approving guide document applications.
- **Premium UI/UX**: "Forest Theme" with glassmorphism, responsive split-screen auth, and smooth micro-animations.
- **Dynamic Tour Management**: End-to-end tour creation, personalized user dashboards, and integrated review systems.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Native WebSockets
- **Backend**: Django 6.x, Django REST Framework, Django Channels, Daphne (ASGI), Redis
- **Docs**: Auto-generated OpenAPI/Swagger (`/api/docs/`)

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python -m venv .env
source .env/bin/activate
pip install -r requirements.txt
python manage.py migrate

# Run with Daphne for WebSocket support
daphne -b 127.0.0.1 -p 8000 tour_backend.asgi:application 
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## ⚠️ Pending Integrations
- Migrate from local SQLite to PostgreSQL/MySQL for production.
- Replace the mocked checkout flow with a payment gateway (e.g., Stripe, PayPal).
- Configure `EMAIL_BACKEND` (SendGrid/AWS SES) for live verification emails.

## 📄 License
MIT
