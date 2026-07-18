# 🎓 InterGuide AI

> An AI-powered internship discovery and career development platform that helps students and early-career professionals find, prepare for, and track internship opportunities — all in one place.
>
> Link to APP:https://internship.w-3b.tech/

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**InterGuide AI** is a full-stack web application designed to streamline the internship search and career preparation journey. It leverages Google's Gemini AI to provide intelligent features like AI-powered mock interviews, smart resume analysis, personalized internship recommendations, and an AI chatbot assistant.

---

## Features

| Feature | Description |
|---|---|
| **🔐 Authentication** | Secure user registration and login with JWT-based authentication |
| **📊 Dashboard** | Centralized dashboard with an overview of applications, recommendations, and activity |
| **🔍 AI Job Search** | Intelligent job and internship search powered by web scraping and RSS aggregation |
| **📄 Resume Tools** | Upload, parse (PDF/DOCX), and manage resumes with AI-powered analysis |
| **📝 ATS Analyzer** | Analyze resume compatibility against Applicant Tracking Systems |
| **🎤 AI Mock Interview** | Practice interviews with AI-generated questions, real-time feedback, and detailed reports |
| **💡 Internship Recommendations** | Personalized internship suggestions based on user skills and profile |
| **📋 Application Tracker** | Track internship applications through different stages (applied, interviewing, offered, etc.) |
| **👤 Profile Management** | Manage user profile, skills, and preferences |
| **🌙 Dark Mode** | Full dark/light theme support with system preference detection |
| **🌐 Internationalization** | Multi-language support via i18next |
| **⏰ Background Scheduler** | Automated RSS feed aggregation (every 6 hours) and web scraping (every 12 hours) |
| **💬 AI Chat Assistant** | Conversational AI assistant for career guidance and platform help |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **Vite** | Build tool and dev server |
| **React Router v6** | Client-side routing |
| **Redux Toolkit** | State management |
| **Tailwind CSS 3** | Utility-first CSS framework |
| **Framer Motion** | Animations and transitions |
| **Recharts & D3** | Data visualization and charts |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |
| **React Hook Form** | Form handling |
| **i18next** | Internationalization |
| **date-fns** | Date utility library |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework |
| **MongoDB + Mongoose** | Database and ODM |
| **Google Generative AI (Gemini)** | AI-powered features (interviews, chat, resume analysis) |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Multer** | File upload handling |
| **pdf-parse & Mammoth** | PDF and DOCX parsing |
| **node-cron** | Background job scheduling |
| **rss-parser** | RSS feed aggregation |
| **Axios** | External API requests |
| **edge-tts-universal** | Text-to-speech for interviews |

---

## Project Structure

```
interguide-ai/
├── backend/
│   ├── interview/            # AI interview module (routes, logic)
│   ├── middleware/            # Auth middleware, request validation
│   ├── models/               # Mongoose schemas
│   │   ├── Application.js    # Internship application tracking
│   │   ├── Internship.js     # Internship listing model
│   │   ├── InterviewReport.js # AI interview results
│   │   ├── SavedJob.js       # Saved job listings
│   │   └── User.js           # User accounts and profiles
│   ├── routes/               # Express API routes
│   │   ├── auth.js           # Registration, login
│   │   ├── applications.js   # Application CRUD
│   │   ├── chat.js           # AI chatbot
│   │   ├── internships.js    # Internship listings
│   │   ├── jobs.js           # Job search
│   │   ├── payment.js        # Payment processing
│   │   ├── recommendations.js # AI recommendations
│   │   ├── resume.js         # Resume upload and analysis
│   │   ├── scraper.js        # Web scraper endpoints
│   │   ├── skills.js         # Skills management
│   │   └── user.js           # User profile
│   ├── services/             # Business logic layer
│   │   ├── ai.service.js     # Gemini AI integration
│   │   ├── matcher.js        # Skill-to-internship matching
│   │   ├── resumeAnalyzer.js # Resume parsing and scoring
│   │   ├── rssAggregationService.js # RSS feed aggregator
│   │   └── webScraperService.js     # Job board scraper
│   ├── scripts/              # Utility scripts
│   ├── utils/                # Helper functions
│   ├── scheduler.js          # Cron job orchestrator
│   ├── server.js             # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React context providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── locales/          # i18n translation files
│   │   ├── pages/
│   │   │   ├── ai-interview/           # Mock interview interface
│   │   │   ├── application-tracker/    # Application management
│   │   │   ├── candidate-onboarding/   # New user onboarding flow
│   │   │   ├── internship-recommendations/ # AI-powered suggestions
│   │   │   ├── job-search/             # AI job search page
│   │   │   ├── main-dashboard/         # Central dashboard
│   │   │   ├── resume-tools/           # Resume builder and ATS analyzer
│   │   │   ├── user-login/             # Login page
│   │   │   ├── user-profile-management/ # Profile editor
│   │   │   └── user-registration/      # Signup page
│   │   ├── services/         # API service layer
│   │   ├── styles/           # Global styles
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx           # Root component
│   │   ├── Routes.jsx        # Route definitions
│   │   └── index.jsx         # React entry point
│   ├── index.html            # HTML template
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── vite.config.mjs       # Vite build configuration
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (local instance or MongoDB Atlas cloud)
- **Google Gemini API Key** (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AnkitIn-Code/Interguide-Internship.git
   cd Interguide-Internship
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the **backend** directory with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>

# Authentication
JWT_SECRET=your_jwt_secret_key

# AI Service
GEMINI_API_KEY=your_google_gemini_api_key

# Server
PORT=5000
```

Create a `.env` file in the **frontend** directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

1. **Start the backend server**

   ```bash
   cd backend
   node server.js
   ```

   The backend will start on `http://localhost:5000`.

2. **Start the frontend dev server**

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/user` | Get user profile |
| `GET` | `/api/skills` | Get user skills |
| `POST` | `/api/resume/upload` | Upload a resume (PDF/DOCX) |
| `POST` | `/api/resume/analyze` | AI-powered resume analysis |
| `GET` | `/api/recommendations` | Get personalized internship recommendations |
| `GET/POST` | `/api/applications` | Manage internship applications |
| `POST` | `/api/chat` | AI chatbot conversation |
| `GET` | `/api/internships` | Browse internship listings |
| `GET` | `/api/jobs` | Search jobs with AI |
| `POST` | `/api/interview/*` | AI mock interview endpoints |
| `GET` | `/api/scraper` | Trigger web scraper |
| `POST` | `/api/payment` | Payment processing |

---

## Screenshots

> _Screenshots coming soon._

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


