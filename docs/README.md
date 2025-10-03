# Documentation Index

Welcome to the SAT Backend Project documentation. This index helps you find the information you need.

## 📚 Main Documentation

### [Project README](../README.md)
**Start here!** Main project documentation including:
- Quick start guide
- Complete setup instructions
- Project structure overview
- Available scripts reference
- Troubleshooting guide
- Core concepts

## 🔌 API Documentation

### [API Reference & Student Flow](../scripts/README.md)
**Complete API guide** covering:
- All API endpoints with examples
- Authentication requirements
- Student test-taking flow (7 steps)
- Request/response formats
- Error handling
- State management tips
- cURL examples for testing

### Quick Links to API Sections:
- [Authentication Overview](../scripts/README.md#-authentication)
- [API Flow Steps](../scripts/README.md#complete-api-flow)
- [Error Handling](../scripts/README.md#error-handling)
- [Testing Guide](../scripts/README.md#testing-the-api-flow)

## 🔐 Authentication

### [Authentication Implementation Guide](AUTHENTICATION_IMPLEMENTATION.md)
**Technical details** about authentication:
- How JWT authentication works
- Database schema changes (TEXT → UUID)
- Migration guide
- Security benefits
- Frontend integration examples
- Rollback procedures

**Key Topics:**
- User ID extraction from JWT tokens
- Foreign key constraints to `auth.users`
- Token verification process
- Security considerations

## 🧪 Testing

### [Sample Test Creation](../scripts/README_sample_test.md)
**Guide to creating test data:**
- Full-length adaptive SAT test structure
- Module specifications (6 modules, adaptive logic)
- Question distribution by difficulty
- Script usage and customization
- Output examples

**Test Details:**
- Test Code: SATFL1
- 147 questions total (students complete 98)
- Adaptive Module 2 assignment
- 27 questions per RW module (32 min)
- 22 questions per Math module (35 min)

### Automated Testing Script

**Script**: `scripts/test_endpoints_with_auth.js`

```bash
npm run test:endpoints:auth
```

Tests all API endpoints with real authentication:
- JWT token acquisition
- Submission creation
- Answer submission and upsert
- Module completion and grading
- Adaptive module assignment
- User submission history

## 🗄️ Database

### Schema Migrations

Located in `migrations/` directory:

| Migration | Description |
|-----------|-------------|
| **001** | Core tables (tests, modules, questions, junctions) |
| **002** | Order columns for proper sequencing |
| **003** | Submissions system (submissions, submission_modules, submitted_answers) |
| **004** | Module difficulty column (adaptive testing) |
| **005** | User ID UUID with FK to auth.users (authentication) |

**Run migrations:**
```bash
npm run migrate
```

### Database Schema Overview

**Core Entities:**
- `tests` - Test containers
- `modules` - Test modules with difficulty and time limits
- `questions` - SAT questions with metadata
- `test_modules` - Many-to-many (tests ↔ modules)
- `module_questions` - Many-to-many (modules ↔ questions)

**Submissions:**
- `submissions` - User test sessions (FK to auth.users)
- `submission_modules` - Assigned modules per submission
- `submitted_answers` - Student answers with grading

## 🛠️ Development Guides

### Adding New Features

1. **New API Endpoint:**
   - Add method to controller
   - Add route in appropriate routes file
   - Add validation middleware if needed
   - Update API documentation
   - Add tests

2. **Database Changes:**
   - Create new migration file (XXX_description.sql)
   - Run: `npm run migrate`
   - Update models if needed
   - Document in migration comments

3. **New Authentication Requirements:**
   - Add `verifyToken` middleware to route
   - Access user via `req.user.id`
   - Document auth requirement

### Code Organization

- **Controllers**: Business logic and response handling
- **Models**: Database queries and data transformation
- **Routes**: Endpoint definitions and middleware chains
- **Middleware**: Reusable request processing (auth, validation)
- **Utils**: Helper functions (scoring, calculations)
- **Migrations**: Database schema evolution

## 🔍 Quick Reference

### Common Tasks

**Start development:**
```bash
npm run dev
```

**Apply database changes:**
```bash
npm run migrate
```

**Create test data:**
```bash
npm run create:sample
```

**Test API:**
```bash
npm run test:endpoints:auth
```

**Upload questions:**
```bash
npm run upload:questions
```

### Important Files

- **Server Entry**: `server.js`
- **Database Config**: `config/db.js`
- **Auth Middleware**: `middleware/auth.js`
- **Validation**: `middleware/validation.js`
- **SAT Scoring**: `utils/satScoring.js`
- **Main Model**: `models/Submission.js`

### Environment Variables

Required in `.env`:
```env
SUPABASE_DB_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
PORT=3000
NODE_ENV=development
```

Optional (for testing):
```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

## 📊 Project Status

### ✅ Completed Features

- Express server with security middleware
- JWT authentication via Supabase
- Database schema with migrations
- Question management system
- Test and module organization
- **Submissions system with grading**
- **Adaptive module selection**
- **SAT scoring algorithms**
- Complete API with authentication
- Automated testing suite

### 🔄 In Progress

- Advanced analytics
- Performance optimization
- Enhanced error handling

### 📋 Planned

- User dashboard
- Admin interface
- Question analytics
- Practice recommendations
- Score history tracking

## 🆘 Getting Help

1. **Check documentation** - Start with this index
2. **Review troubleshooting** - See main [README](../README.md#-troubleshooting)
3. **Check logs** - Look at server console output
4. **Test components** - Use individual scripts to isolate issues
5. **Create an issue** - If you find a bug or need help

## 📚 External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [SAT Test Format](https://satsuite.collegeboard.org/digital/about-the-test)

---

**Last Updated**: October 2025  
**Maintained by**: SAT Backend Team

