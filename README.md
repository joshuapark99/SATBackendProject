# SAT Backend Project

A comprehensive Node.js/Express backend for managing adaptive SAT practice tests with user authentication, submissions tracking, and automatic grading. Built with Supabase/PostgreSQL for reliable data storage and JWT authentication.

## 🌟 Key Features

- 🎯 **Adaptive Testing** - Dynamically assigns Module 2 difficulty based on Module 1 performance
- 🔒 **JWT Authentication** - Secure user authentication via Supabase
- 📊 **Auto Grading** - Automatic answer grading and SAT score calculation (400-1600)
- 📝 **Submission Tracking** - Complete test-taking session management
- 🎨 **RESTful API** - Clean API endpoints for test management
- 🗄️ **Migration System** - Version-controlled database schema updates
- ⚡ **Real-time Progress** - Track student progress through test modules
- 🔐 **Secure** - Helmet, CORS, input validation, and foreign key constraints

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Core Concepts](#-core-concepts)
- [Setup Guide](#-complete-setup-guide)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <your-repository-url>
cd SATBackendProject
npm install

# 2. Configure environment (.env file)
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
NODE_ENV=development

# 3. Setup database
npm run migrate

# 4. Upload questions (optional)
npm run upload:questions

# 5. Create sample test
npm run create:sample

# 6. Start server
npm run dev

# 7. Test endpoints (requires test user in Supabase)
npm run test:endpoints:auth
```

## 🏗️ Project Structure

```
SATBackendProject/
├── config/
│   └── db.js                          # Database connection pooling
├── controllers/
│   ├── questionController.js          # Question management
│   ├── testController.js              # Test management
│   └── submissionController.js        # Submission & grading (NEW)
├── middleware/
│   ├── auth.js                        # JWT authentication
│   ├── validation.js                  # Request validation
│   └── index.js                       # Middleware exports
├── migrations/
│   ├── 001_create_initial_tables.sql  # Core schema
│   ├── 002_add_order_columns.sql      # Ordering support
│   ├── 003_create_submissions_tables.sql    # Submissions system
│   ├── 004_add_module_difficulty.sql  # Adaptive testing
│   └── 005_update_user_id_to_uuid.sql # Auth integration
├── models/
│   ├── Question.js                    # Question model
│   ├── Test.js                        # Test model
│   └── Submission.js                  # Submission model (NEW)
├── routes/
│   ├── index.js                       # Main router
│   └── v1/
│       ├── index.js                   # V1 router
│       └── testing/
│           ├── questionRoutes.js      # Question endpoints
│           ├── testRoutes.js          # Test endpoints
│           └── submissionRoutes.js    # Submission endpoints (NEW)
├── utils/
│   └── satScoring.js                  # SAT scoring algorithms (NEW)
├── docs/
│   └── AUTHENTICATION_IMPLEMENTATION.md    # Auth technical docs
├── scripts/
│   ├── migrate.js                     # Migration runner
│   ├── upload_questions.js            # Question uploader
│   ├── create_sample_test.js          # Sample test generator
│   ├── test_endpoints_with_auth.js    # API testing
│   └── README.md                      # Complete API documentation
├── server.js                          # Express server entry point
└── package.json                       # Dependencies & scripts
```

## 💡 Core Concepts

### Adaptive Testing

The system mimics the real digital SAT:

1. **Module 1 (Baseline)** - All students take the same medium-difficulty module
2. **Scoring** - System grades Module 1 and calculates percentage
3. **Adaptive Assignment** - Based on performance:
   - Score ≥60% → Module 2 (Harder)
   - Score <60% → Module 2 (Easier)
4. **Final Scoring** - Both modules combined for section score (200-800)

### Test Structure

- **Test** - Container with unique code (e.g., "SATFL1")
- **Modules** - 6 modules total per test:
  - Reading & Writing Module 1 (27 questions, medium)
  - Reading & Writing Module 2 Easy (27 questions)
  - Reading & Writing Module 2 Hard (27 questions)
  - Math Module 1 (22 questions, medium)
  - Math Module 2 Easy (22 questions)
  - Math Module 2 Hard (22 questions)
- **Student Completes** - Only 4 modules (98 questions total)

### Authentication Flow

1. User authenticates via Supabase (frontend)
2. Receives JWT access token
3. Includes token in `Authorization: Bearer <token>` header
4. Backend verifies token and extracts user ID
5. User ID stored with submissions (FK to auth.users)

## 🛠️ Complete Setup Guide

### Prerequisites

- **Node.js** v16+ - [Download](https://nodejs.org/)
- **Python 3.7+** - [Download](https://python.org/)
- **Supabase Account** - [Sign up](https://supabase.com/)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Install Dependencies

```bash
npm install
pip install pandas  # For question preparation scripts
```

### Step 2: Environment Configuration

Create `.env` file in project root:

```env
# Database Connection
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Supabase Auth (for JWT verification)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=3000
NODE_ENV=development

# Testing (optional)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

**How to get your credentials:**
- **SUPABASE_DB_URL**: Supabase Dashboard → Project Settings → Database → Connection String (Session Pooler)
- **SUPABASE_URL**: Project Settings → API → Project URL
- **SUPABASE_ANON_KEY**: Project Settings → API → anon/public key

### Step 3: Database Setup

```bash
# Run all migrations
npm run migrate
```

This creates:
- Core tables (tests, modules, questions)
- Submissions system tables
- Module difficulty column for adaptive testing
- User authentication integration

### Step 4: Create Test User (For Testing)

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Create user with:
   - Email: `test@example.com`
   - Password: `testpassword123`
   - Confirm Email: Yes

### Step 5: Upload Questions (Optional)

```bash
# Dry run first
node scripts/upload_questions.js --dry-run --limit 5

# Upload questions
npm run upload:questions
```

### Step 6: Create Sample Test

```bash
npm run create:sample
```

Creates test "SATFL1" with 6 modules and adaptive testing setup.

### Step 7: Start Server

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

### Step 8: Test Everything

```bash
# Test API endpoints with authentication
npm run test:endpoints:auth
```

## 📚 API Documentation

Full API documentation is available in **[scripts/README.md](scripts/README.md)** including:

- Complete API endpoint reference
- Authentication requirements
- Request/response examples
- Test-taking flow
- Error handling
- cURL examples

### Quick Reference

#### Public Endpoints (No Auth)

```bash
GET  /health                                    # Server health
GET  /api/v1/testing/tests                      # List tests
GET  /api/v1/testing/tests/:code                # Get test by code
GET  /api/v1/testing/question                   # List questions
```

#### Authenticated Endpoints (Require JWT)

```bash
POST /api/v1/submissions                        # Start test
GET  /api/v1/submissions/:id                    # Get submission
GET  /api/v1/submissions/user/:userId           # User's submissions
POST /api/v1/submissions/:id/answers            # Submit answers
POST /api/v1/submissions/:id/modules/:moduleId/complete    # Complete module
POST /api/v1/submissions/:id/finalize           # Finalize test
GET  /api/v1/submissions/:id/current-module     # Get current module
```

### Authentication Example

```javascript
// Get token from Supabase
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Use in requests
fetch('/api/v1/submissions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    testId: 'test-uuid',
    initialModuleId: 'module-uuid'
  })
});
```

## 🗄️ Database Schema

### Core Tables

- **tests** - Test containers with unique codes
- **modules** - Test modules with difficulty levels and time limits
- **questions** - SAT questions with answers and metadata
- **test_modules** - Links tests to modules with ordering
- **module_questions** - Links modules to questions with ordering

### Submission Tables

- **submissions** - Test submission records with user FK
- **submission_modules** - Tracks assigned modules per submission
- **submitted_answers** - Student answers with correctness tracking

### Key Relationships

```
tests (1) ←→ (M) test_modules ←→ (M) modules
modules (1) ←→ (M) module_questions ←→ (M) questions
tests (1) ←→ (M) submissions ←→ (1) auth.users
submissions (1) ←→ (M) submission_modules ←→ (1) modules
submission_modules (1) ←→ (M) submitted_answers ←→ (1) questions
```

## 📝 Available Scripts

### Development

| Script | Command | Description |
|--------|---------|-------------|
| Start Dev Server | `npm run dev` | Start with auto-restart (nodemon) |
| Start Production | `npm start` | Start production server |
| Run Migrations | `npm run migrate` | Apply database migrations |

### Data Management

| Script | Command | Description |
|--------|---------|-------------|
| Upload Questions | `npm run upload:questions` | Upload questions to database |
| Create Sample Test | `npm run create:sample` | Create full-length adaptive test |
| Prepare Questions | `npm run prep:math` | Prepare math questions for upload |

### Testing

| Script | Command | Description |
|--------|---------|-------------|
| Test Endpoints | `npm run test:endpoints:auth` | Test all API endpoints with auth |
| Test Database | `node scripts/test_db.js` | Verify database connection |

## 🧪 Testing

### Automated Testing

```bash
# Run full test suite (requires test user)
npm run test:endpoints:auth
```

Tests:
- ✅ Test retrieval
- ✅ Submission creation (authenticated)
- ✅ Answer submission with upsert
- ✅ Module completion with grading
- ✅ Adaptive module assignment
- ✅ Current module tracking
- ✅ User submission history

### Manual Testing

```bash
# 1. Get auth token
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'

# 2. Use token in API calls
curl -X POST 'http://localhost:3000/api/v1/submissions' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testId":"test-uuid","initialModuleId":"module-uuid"}'
```

## 🚨 Troubleshooting

### Database Connection Issues

```
Error: Connection terminated unexpectedly
```

**Solutions:**
1. Verify `SUPABASE_DB_URL` in `.env`
2. Check Supabase dashboard for database status
3. Ensure IP is whitelisted in Supabase settings
4. Test: `node scripts/test_db.js`

### Authentication Errors

```
Error: No authorization token provided
```

**Solutions:**
1. Ensure token in `Authorization: Bearer <token>` header
2. Create test user in Supabase Dashboard
3. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
4. Check token hasn't expired (default: 1 hour)

### Migration Failures

```
Error: relation already exists
```

**Solutions:**
1. Check `schema_migrations` table in database
2. Manually remove partially applied migrations if needed
3. Re-run: `npm run migrate`

### Test Script Fails

```
Error: Test with access code 'SATFL1' not found
```

**Solutions:**
1. Create sample test: `npm run create:sample`
2. Upload questions first: `npm run upload:questions`
3. Run migrations: `npm run migrate`

### Port Already in Use

```
Error: EADDRINUSE :::3000
```

**Solutions:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

## 📖 Additional Documentation

- **[API Documentation](scripts/README.md)** - Complete API reference with authentication
- **[Authentication Guide](docs/AUTHENTICATION_IMPLEMENTATION.md)** - Technical auth implementation details

## 🔐 Security

- ✅ **JWT Token Verification** - Cryptographic verification via Supabase JWKS
- ✅ **Foreign Key Constraints** - User IDs verified against auth.users
- ✅ **Input Validation** - Request validation middleware
- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Cross-origin configuration
- ✅ **SSL/TLS** - Encrypted database connections
- ✅ **No User Impersonation** - User ID from verified token only

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes following existing patterns
4. Test thoroughly: `npm run test:endpoints:auth`
5. Commit: `git commit -m "Add your feature"`
6. Push: `git push origin feature/your-feature`
7. Submit pull request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Run linter before committing
- Test with both Math and Reading/Writing questions

## 📄 License

ISC License - see package.json for details

---

**Need Help?** Check the [Troubleshooting](#-troubleshooting) section or the [API Documentation](scripts/README.md).
