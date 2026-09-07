# X-Financial - AI-Powered Financial Intelligence Platform

Transform financial data into actionable intelligence. Upload PDF/Excel files, get AI-powered analysis, trends, risk detection, and an intelligent copilot.

## Features

- 🔐 **Authentication** - Firebase Google OAuth
- 📊 **File Upload** - PDF/Excel with privacy scanning & quality scoring (0-100)
- 📈 **Dashboard** - Three specialized charts:
  - Chart A: Growth Engine (Revenue vs Net Income)
  - Chart B: Profitability Safety Gap (Gross Margin vs Net Margin %)
  - Chart C: Cash Runway Horizon (Months of Survival)
- 🤖 **AI Copilot** - Chat with your data (Gemini API + persistent memory)
- 📋 **History** - Manage datasets with delete & memory cleanup
- 🎨 **Animations** - Framer Motion throughout

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Framer Motion
- Recharts for visualizations
- Firebase Auth
- Supabase for data storage
- Zustand for state management

### Backend
- FastAPI
- Python 3.11+
- pdfplumber + pandas for extraction
- scikit-learn for anomaly detection
- Google Gemini API for AI chat
- Supabase for persistence

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Firebase project
- Supabase project
- Google AI Studio API key

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your credentials
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
# Windows:
start.bat
# Or manually:
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

#### Backend (.env)
```env
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=

SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=

GEMINI_API_KEY=

CORS_ORIGINS=["http://localhost:3000"]
```

## Project Structure

```
x-financial/
├── frontend/                 # Next.js app
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── page.tsx     # Homepage
│   │   │   ├── login/       # Login page
│   │   │   ├── signup/      # Signup page
│   │   │   ├── upload/      # File upload
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── chat/        # AI Copilot
│   │   │   └── history/     # Dataset history
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Base UI components
│   │   │   ├── AuthProvider.tsx
│   │   │   └── Layout.tsx
│   │   ├── lib/             # Utilities & configs
│   │   │   ├── firebase.ts
│   │   │   ├── supabase.ts
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── store/           # Zustand store
│   │   └── types/           # TypeScript types
│   └── vercel.json
│
├── backend/                  # FastAPI app
│   ├── app/
│   │   ├── api/routes.py    # API endpoints
│   │   ├── services/
│   │   │   ├── extractor.py # PDF/Excel extraction
│   │   │   ├── quality.py   # Quality assessment
│   │   │   └── analyzer.py  # Financial analysis
│   │   ├── models/schemas.py # Pydantic models
│   │   ├── core/config.py   # Settings
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── start.bat
│
└── shared/                   # Shared types (future)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload & process financial file |
| GET | `/api/datasets` | List user datasets |
| GET | `/api/datasets/{id}` | Get dataset details |
| DELETE | `/api/datasets/{id}` | Delete dataset |
| GET | `/api/analysis/{id}` | Get/generate analysis |
| POST | `/api/chat` | Chat with AI copilot |
| POST | `/api/calculate` | Calculate financial metric |

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Backend (Railway/Render/Fly.io)
1. Create new service
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

## Data Flow

```
Upload → Privacy Scan → Quality Check → Extraction → 
Financial Intelligence → Trends/Anomalies/Forecast → 
Root Cause → Risk Engine → Recommendations → WHY? Evidence → 
Dashboard + AI Copilot
```

## Quality Scoring

| Score | Level | Meaning |
|-------|-------|---------|
| 80-100 | 🟢 Excellent | Ready for analysis |
| 60-79 | 🟡 Good | Analysis with warnings |
| 40-59 | 🟠 Warning | Limited analysis |
| <40 | 🔴 Poor | Significant issues |

## License

MIT