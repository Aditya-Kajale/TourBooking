# 🌲 TourBooking

A premium, state-of-the-art tour booking platform featuring a **Forest-themed** design system. Built with a modern **React (Vite)** frontend and a robust **Django REST Framework** backend.

## ✨ Key Features

- **🌲 Forest Theme & UI/UX**: Professional, market-ready design featuring glassmorphism, curated color palettes, and smooth micro-animations.
- **📱 True Responsive Experience**: Fully optimized for both mobile and high-end desktop views with a dedicated split-screen design for authentication.
- **🗺️ Tour Management**: Create and manage detailed tours with categories (Adventure, Cultural, etc.), durations, and dynamic image uploading with smart URL handling.
- **🎟️ Real-time Availability**: Advanced seat-tracking logic ensures that booked seats are accurately reflected across the platform, from detail pages to the home grid.
- **📊 User Dashboard**: Personalized dashboard for users to track their own created tours and active bookings in one place.
- **⭐ Reviews & Ratings**: Integrated review system for users to share and view feedback on tours.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Backend**: Django 4.x, Django REST Framework, SQLite (Local Development)
- **Authentication**: JWT-based secure authentication
- **Styling**: Vanilla CSS extensions with Glassmorphism and Custom Theme Tokens

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18.x+
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

## 📄 License
MIT
