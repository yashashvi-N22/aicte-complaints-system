# AICTE Integrated Institution Complaint Monitoring & Status Dashboard

> **Demonstration prototype — not an official AICTE service.**
> This portal is an engineering demonstration prototype of the central technical education grievance redressal system adhering to the Guidelines for Indian Government Websites (GIGW 3.0).

---

## 1. Project Overview

The **AICTE Integrated Institution Complaint Monitoring & Status Dashboard** is a full-stack, enterprise-grade system designed to streamline, track, and adjudicate grievances across AICTE-approved technical institutions in India.

### Key Capabilities:
- **Role-Based Access Control (RBAC):** Administrator, Department Officer, Institution Representative, and Reviewer.
- **Official GIGW Government Design:** Clean white background, dark navy-blue headers (`#002855`), saffron/green national accents, utilitarian typography (Arial), rectangular data panels, accessible high-contrast tables.
- **Real-Time Grievance Lifecycle Tracking:** Tracking ID generation (`AICTE-2026-XXXXX`), status transition workflow with mandatory audit remarks, and chronological timeline logging.
- **NLP-Powered Duplicate Detection:** Algorithmic similarity scoring (blended TF-IDF token cosine + Jaccard similarity) flags repetitive and multi-party filings for Reviewer adjudication.
- **Reviewer Adjudication Desk:** Dedicated workspace for Reviewers to compare candidate pairs side-by-side, designate primary cases, and consolidate duplicate records.
- **Institution Directory:** Comprehensive directory with state/district filters, discipline breakdowns, and historical audit summaries.
- **Inter-Bureau Technical Coordination:** Collaborative communication threads across specialized bureaus (Approvals, Faculty Welfare, Student Affairs, Finance).
- **Interactive Recharts Analytics:** Category breakdown, 6-month inflow vs resolution trends, status distribution, and bureau workload metrics.
- **Statutory Audit Trail:** Complete compliance logging of all authentications, transitions, and administrative modifications.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Charts** | Recharts |
| **Backend** | Python FastAPI, Pydantic v2, Pydantic-Settings |
| **Database** | PostgreSQL (with SQLAlchemy 2.0 ORM & SQLite local fallback) |
| **Migrations** | Alembic |
| **Authentication** | JWT (JSON Web Tokens) with direct bcrypt password hashing |
| **API Documentation**| FastAPI Swagger UI (`/docs`) & ReDoc (`/redoc`) |
| **Containerization** | Docker & Docker Compose with multi-stage builds and Nginx proxy |

---

## 3. Pre-Configured Demo Accounts

For immediate evaluation, the database is pre-seeded with realistic fictional Indian technical institutions, departments, and user roles with password **`Aicte@Portal2026`**:

| Persona / Name | Role | Username | Password | Purpose / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Narendra K. Verma** | `ADMIN` | `admin` | `Aicte@Portal2026` | Full administrative oversight, institution management, audit logs |
| **Dr. Arvind Singh** | `REVIEWER` | `reviewer_singh` | `Aicte@Portal2026` | Duplicate triage desk, candidate review, case consolidation |
| **Smt. Priya Sundaram** | `DEPT_OFFICER` | `officer_approval` | `Aicte@Portal2026` | Approval Bureau queue, investigation notes |
| **Shri Manoj Deshpande**| `DEPT_OFFICER` | `officer_faculty` | `Aicte@Portal2026` | Faculty Pay Scales & 7th CPC grievances |
| **Prof. Rajesh Sharma** | `INST_REP` | `rep_delhi` | `Aicte@Portal2026` | Delhi Technological Academy representative (complainant) |
| **Dr. Sunita Deshmukh** | `INST_REP` | `rep_mumbai` | `Aicte@Portal2026` | Mumbai Institute of Advanced Tech representative |

> **Quick Switcher:** Click the **"Switch Role Persona"** dropdown in the top navigation bar to switch between roles with a single click.

---

## 4. Local Development Setup

### Prerequisites:
- Python 3.10+ (Python 3.11–3.13 tested)
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

---

### Step 1: Start the Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database seed (auto-creates tables and populates data):
   ```bash
   python -m app.seed
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

The backend API will be available at:
- **API Base:** `http://127.0.0.1:8000`
- **Swagger UI Documentation:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`

---

### Step 2: Start the Frontend (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Access the web application in your browser:
   ```
   http://localhost:5173
   ```
*(Vite is pre-configured with a reverse proxy forwarding all `/api` requests to `http://127.0.0.1:8000`)*

---

## 5. Docker Compose Deployment

To deploy the complete application (PostgreSQL + FastAPI + Nginx React Frontend) in containers:

1. In the project root directory, run:
   ```bash
   docker compose up --build
   ```

2. Access the services:
   - **Web Portal:** `http://localhost:3000`
   - **Backend API & Swagger:** `http://localhost:8000/docs`
   - **PostgreSQL Database:** `localhost:5432` (`aicte_db`)

To stop the containers:
```bash
docker compose down
```

---

## 6. Database Migrations (Alembic)

To create a new migration after editing SQLAlchemy models:
```bash
cd backend
alembic revision --autogenerate -m "describe_changes"
alembic upgrade head
```

---

## 7. Project Structure

```
aicte-complaint-system/
├── docker-compose.yml          # Container orchestration (Postgres, API, Web)
├── README.md                   # System documentation and instructions
├── backend/
│   ├── alembic.ini             # Migration settings
│   ├── Dockerfile              # Backend container image
│   ├── requirements.txt        # Python dependencies
│   ├── alembic/                # Migration scripts
│   └── app/
│       ├── main.py             # FastAPI entry point & CORS
│       ├── config.py           # Settings and environment configs
│       ├── database.py         # SQLAlchemy engine and session
│       ├── seed.py             # Database seed script
│       ├── models/             # Database ORM models
│       │   ├── user.py         # User & Role RBAC
│       │   ├── institution.py  # Institution registry
│       │   ├── department.py   # AICTE Bureaus
│       │   ├── complaint.py    # Complaints & Statuses
│       │   ├── complaint_history.py # Chronological audit trail
│       │   ├── assignment.py   # Bureau assignments
│       │   ├── duplicate.py    # Duplicate suggestions & reviews
│       │   ├── coordination.py # Inter-bureau communications
│       │   ├── notification.py # In-app notifications
│       │   └── audit.py        # System governance logs
│       ├── schemas/            # Pydantic validation schemas
│       ├── services/           # Business logic & NLP algorithms
│       │   ├── auth.py         # JWT tokens & bcrypt
│       │   ├── duplicate_detector.py # TF-IDF NLP similarity engine
│       │   ├── complaint_id.py # Unique Tracking ID generator
│       │   └── audit.py        # Audit trail logging
│       └── routers/            # API endpoints
│           ├── auth.py
│           ├── institutions.py
│           ├── departments.py
│           ├── complaints.py
│           ├── duplicates.py
│           ├── analytics.py
│           ├── audit.py
│           └── notifications.py
└── frontend/
    ├── Dockerfile              # Multi-stage production container
    ├── nginx.conf              # Reverse proxy & static web server
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.tsx             # Main layout & router
        ├── index.css           # GIGW government portal styling
        ├── types/              # TypeScript domain types
        ├── services/           # Axios/Fetch API client
        ├── context/            # AuthContext & role switcher
        ├── components/         # Header, Footer, Pagination
        └── pages/
            ├── DashboardPage.tsx     # Analytics KPIs & Recharts
            ├── InstitutionsPage.tsx  # Institution directory & CRUD
            ├── ComplaintsPage.tsx    # Grievance register & filters
            ├── ComplaintDetailPage.tsx # Full case file & workflows
            ├── SubmitComplaintPage.tsx # Grievance filing form
            ├── ReviewerPage.tsx      # Deduplication desk
            ├── DepartmentsPage.tsx   # Bureau workload overview
            ├── AuditPage.tsx         # Statutory governance logs
            └── LoginPage.tsx         # Sign-in & demo presets
```

---

## 8. License & Notice

This software is an educational prototype developed for demonstration and technical assessment purposes. It is not an official portal of the All India Council for Technical Education (AICTE) or the Ministry of Education, Government of India.
