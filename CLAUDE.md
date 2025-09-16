# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Analyze bundle size
npm run analyze
```

### Database Operations
```bash
# Run migrations (development)
npm run db:migrate

# Push schema changes without migration
npm run db:push

# Seed database with initial data
npm run db:seed

# Open Prisma Studio GUI
npm run db:studio

# Generate Prisma client
npx prisma generate

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Testing
```bash
# Run all tests (verbose output)
npm test

# Run tests in watch mode (development)
npm run test:dev

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests with Playwright
npm run test:e2e

# Run smoke tests only
npm run test:smoke

# Run with coverage report
npm run test:coverage

# Run performance tests with Artillery
npm run test:performance

# Run specific test file
npx vitest run src/lib/ai-provider.test.ts

# Debug tests interactively
npm run test:watch
```

### Deployment
```bash
# Deploy to Google Cloud Platform
npm run deploy:gcp

# Deploy to Fly.io
npm run deploy:fly

# Deploy to Railway
npm run deploy:railway

# Deploy to Render
npm run deploy:render

# Deploy to production VPS at crowecode.com
bash deploy-production.sh

# Docker operations
npm run docker:build  # Build Docker image
npm run docker:run    # Run Docker container

# Build and run with Docker Compose (production)
docker-compose -f docker-compose.production.yml up --build

# GCP-specific commands
npm run gcp:build   # Submit build to Cloud Build
npm run gcp:deploy  # Deploy to Cloud Run
npm run gcp:logs    # View Cloud Run logs

# Run background worker
npm run worker
```

## Architecture Overview

### Service Architecture
The platform uses a **modular monolith** architecture with multiple specialized services:

1. **Main Application** (`app:3000`): Next.js 15 app with React 19, handles UI and core API
2. **MCP Server** (`mcp-server:3001`): KiloCode Model Context Protocol integration for extensible AI
3. **WebSocket Server** (`websocket:3002`): Real-time collaboration and live updates
4. **AI Worker** (`ai-worker:3003`): Background AI task processing with Bull queues
5. **Analysis Engine** (`analysis-engine:3004`): Code analysis and refactoring suggestions

### CroweCode Intelligence System
The platform features a proprietary AI system with multiple provider abstraction in `src/lib/ai-provider.ts`:
- **Primary**: CroweCode Intelligence (XAI_API_KEY) - Custom neural architecture
- **Performance**: <1 second response time, 256K context window, 94%+ code accuracy
- **Capabilities**: 50+ languages, autonomous coding, security analysis, multi-step reasoning
- **Fallbacks**: Claude Opus 4.1, GPT-4 Turbo, Grok, Gemini Pro, Codex
- **Features**: Load balancing, automatic failover, usage tracking, cost optimization
- All AI interactions branded as "CroweCode Intelligence" regardless of underlying provider

### Authentication & Security
- **JWT-based auth** using jose library (not jsonwebtoken)
- **Middleware protection** in `src/middleware/auth.ts`
- **Rate limiting** per endpoint and user
- **Security headers** configured in middleware
- **CORS** handled at application level, not nginx
- **Data Privacy**: No data retention, encrypted communications, local processing option
- **Compliance**: SOC 2, HIPAA, GDPR ready

### Database Strategy
```typescript
// Primary: PostgreSQL with Prisma
const prisma = new PrismaClient()

// Secondary: MongoDB for unstructured data
const mongodb = new MongoClient(process.env.MONGODB_URI)

// Enterprise: Oracle for legacy integration
const oracle = oracledb.createPool(oracleConfig)

// Caching: Redis for sessions and queues
const redis = new Redis(process.env.REDIS_URL)
```

### Key Integration Points

#### VS Code Marketplace (`src/lib/marketplace/marketplace-manager.ts`)
- Extension search and installation
- Compatibility verification
- Security scanning before installation

#### KiloCode MCP Integration (`src/lib/marketplace/kilocode-integration.ts`)
- Manages MCP servers for extensible AI capabilities
- Supports STDIO, SSE, and WebSocket transports
- Enterprise security with audit logging

#### Autonomous AI Agents (`src/lib/ai/autonomous-agent.ts`)
Multi-mode agent system with phases:
1. **Orchestrator**: Task breakdown and planning
2. **Architect**: System design and structure
3. **Coder**: Implementation
4. **Debugger**: Error detection and fixing
5. **Reviewer**: Code quality and best practices
6. **Tester**: Test generation and validation

#### Real-time Collaboration (`src/lib/collaboration/real-time-collaboration.ts`)
- WebSocket-based shared editing
- Voice/video support integration
- AI assistance in collaborative sessions
- Conflict resolution with CRDTs

#### CI/CD Pipeline Integration (`src/lib/ci-cd/pipeline-integration.ts`)
Supports GitHub Actions, GitLab CI, Jenkins, Azure DevOps with:
- Automated deployment triggers
- Pipeline status monitoring
- AI-optimized build configurations

### Environment Configuration
Critical environment variables (from README and codebase):
```bash
# Required for core functionality
NEXTAUTH_URL=https://crowecode.com
DATABASE_URL=postgresql://user:pass@postgres:5432/crowe_platform
REDIS_URL=redis://redis:6379

# CroweCode Intelligence (Primary AI System)
XAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Oracle Database Integration
ORACLE_DB_USER=system
ORACLE_DB_PASSWORD=password
ORACLE_DB_CONNECTION_STRING=localhost:1521/FREE

# MCP Integration
MCP_SERVER_URL=http://mcp-server:3001
MCP_AUTH_TOKEN=

# WebSocket Configuration
WS_PORT=3002
NEXT_PUBLIC_WS_URL=wss://crowecode.com/ws

# Google Cloud Services
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Stripe for Billing
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

### File Structure Patterns
- **API Routes**: `src/app/api/[feature]/route.ts` using Next.js 15 route handlers
- **Components**: `src/components/[category]/[component].tsx` with TypeScript
- **Services**: `src/lib/[service]/[module].ts` for business logic
- **Database**: `prisma/schema.prisma` for models, `migrations/` for SQL scripts
- **Docker**: Service-specific Dockerfiles (`Dockerfile.[service]`)

### Development Workflow

When implementing new features:
1. Check existing patterns in similar files first
2. Use the established AI provider abstraction - never call AI APIs directly
3. Add database changes via Prisma migrations, not direct SQL
4. Implement real-time features through the WebSocket service
5. Queue long-running tasks to the AI Worker service
6. Use the existing security middleware for protected routes

### Testing Requirements
- Unit tests go in `__tests__/` directories using Vitest
- E2E tests in `tests/` directory using Playwright
- Mock AI providers using the test utilities in `src/lib/test-utils/`
- Database tests should use transactions that rollback

### Deployment Notes
- Production runs on VPS at crowecode.com behind Nginx
- Uses Docker Compose for orchestration
- Prometheus + Grafana for monitoring
- Automated backups run daily
- SSL certificates via Let's Encrypt
- Database migrations run automatically on deploy