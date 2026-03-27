## ADDED Requirements

### Requirement: API is deployable to Railway
The system SHALL include Railway configuration that allows zero-manual-step deployment.

#### Scenario: railway.json defines build and start commands
- **WHEN** Railway reads `apps/api/railway.json`
- **THEN** the build command runs `prisma migrate deploy && tsc`
- **AND** the start command runs `node dist/main.js`
- **AND** health check path is `/health`

#### Scenario: API health check responds to Railway probes
- **WHEN** Railway sends a GET request to `/health`
- **THEN** the API responds with HTTP 200 and `{ "status": "ok" }`

---

### Requirement: Database migrations run automatically on deploy
The system SHALL run `prisma migrate deploy` as part of the Railway build step.

#### Scenario: Migration runs before server starts
- **WHEN** a new Railway deployment is triggered
- **THEN** `prisma migrate deploy` runs and applies any pending migrations
- **AND** the server starts only after migrations complete successfully

---

### Requirement: Frontend apps are deployable to Vercel
The system SHALL include Vercel configuration for both Angular SPA apps.

#### Scenario: SPA routing is handled by rewrites
- **WHEN** a user navigates directly to `/transactions/abc123`
- **THEN** Vercel rewrites the request to `index.html`
- **AND** Angular router handles the route client-side

---

### Requirement: GitHub Actions runs lint, test, and build on main branch
The system SHALL include a `.github/workflows/ci.yml` that automates the pipeline.

#### Scenario: Pipeline runs on push to main
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the pipeline runs lint → test → build stages in order

#### Scenario: Build artifacts are passed to deploy stage
- **WHEN** the build stage completes successfully
- **THEN** the compiled `dist/` directory is available as a GitHub Actions artifact for the deploy stage

---

### Requirement: All sensitive values are stored as environment variables
The system SHALL NOT commit any secrets or credentials to the repository.

#### Scenario: .env.example documents all required variables
- **WHEN** a developer clones the repository
- **THEN** `.env.example` lists all required environment variable names with placeholder values

#### Scenario: .gitignore excludes .env files
- **WHEN** a developer creates a `.env` file
- **THEN** git MUST NOT track or commit the file
