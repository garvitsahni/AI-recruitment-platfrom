# AI Recruitment Platform

Production-grade AI-powered recruitment eligibility validation platform with citation-verified, binary eligibility model.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS, shadcn/ui |
| Backend | Node.js + Express |
| AI Service | Python + FastAPI |
| Database | PostgreSQL + Prisma |
| File Storage | AWS S3 |
| Infrastructure | AWS ECS Fargate, ALB, RDS, CloudWatch |
| IaC | Terraform |

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd recruitment-platform

# 2. Copy environment files
cp .env.example .env

# 3. Start infrastructure (PostgreSQL)
docker-compose up -d db

# 4. Backend setup
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 5. AI Service setup (new terminal)
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 6. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Docker (Full Stack)

```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- AI Service: http://localhost:8000
- PostgreSQL: localhost:5432

## Project Structure

```
recruitment-platform/
├── frontend/          # Next.js recruiter dashboard
├── backend/           # Node.js + Express API
├── ai-service/        # Python + FastAPI AI processing
├── infrastructure/    # Terraform IaC
├── .github/workflows/ # CI/CD pipelines
└── docker-compose.yml # Local development
```

## Testing

```bash
# Backend tests
cd backend && npm test

# AI Service tests
cd ai-service && pytest

# Frontend tests
cd frontend && npm test

# Integration tests (requires running database)
cd backend && npm run test:integration
```

## Database Migrations

```bash
cd backend

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations (production)
npx prisma migrate deploy

# Seed data
npx prisma db seed
```

## Environment Variables

See `.env.example` for all required environment variables. Never commit `.env` files.

## Deployment

See `infrastructure/` for Terraform configurations targeting AWS ECS Fargate.

### CI/CD Pipelines
- `ci.yml` — Lint, test, build on every push/PR
- `build.yml` — Docker image build + push to ECR
- `deploy-staging.yml` — Auto-deploy to staging on merge to main
- `deploy-production.yml` — Manual deployment with approval gate

## License

Proprietary — Internal use only.
