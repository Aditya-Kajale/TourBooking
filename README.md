# Tour Booking Application

A comprehensive tour booking system with a React (Vite) frontend and a Django REST framework backend.

## Project Structure

- `frontend/`: React application built with Vite and Tailwind CSS.
- `backend/`: Django application providing the REST API.

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.10 or higher)
- npm or pnpm

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .env
   source .env/bin/activate  # On Windows use `.env\Scripts\activate`
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   VITE_API_URL=http://127.0.0.1:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Design Aesthetics

The application features a modern, premium design with:
- Glassmorphism effects
- Responsive layouts for both mobile and desktop
- Consistent "Forest" theme color palette
- Smooth transitions and micro-animations

## License

MIT
