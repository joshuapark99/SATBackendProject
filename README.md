# SAT Backend Project

A comprehensive Node.js/Express backend application for managing SAT test questions, modules, and tests with Supabase database integration. This project provides a complete data processing pipeline for SAT question management and includes tools for database administration, data preparation, and testing.

## 🏗️ Project Structure

```
SATBackendProject/
├── config/
│   └── db.js                 # Database connection configuration
├── controllers/
│   ├── questionController.js # Question management logic
│   └── testController.js     # Test management logic
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── index.js             # Middleware exports
│   └── validation.js        # Request validation middleware
├── migrations/
│   ├── 001_create_initial_tables.sql    # Core database schema
│   └── 002_add_order_columns.sql        # Ordering support for tests/modules
├── models/
│   ├── Question.js          # Question data model
│   └── Test.js              # Test data model
├── public/
│   ├── math_questions.jsonl             # Raw SAT math questions
│   ├── math_questions_prepared.jsonl    # Processed questions for upload
│   ├── rw_questions.jsonl               # Raw Reading/Writing questions
│   └── rw_questions_prepared.jsonl      # Processed RW questions for upload
├── routes/
│   ├── index.js             # Main router
│   └── v1/
│       └── testing/         # API version 1 testing routes
├── scripts/
│   ├── migrate.js           # Database migration runner
│   ├── prepare_questions.py # Question data preparation
│   ├── upload_questions.js  # Question upload to database
│   ├── test_db.js          # Database testing utility
│   ├── create_sample_test.js # Sample test creation
│   └── README.md           # Scripts documentation
├── services/               # Business logic services
├── dataViewer.py          # Python utility for data inspection
├── server.js              # Main Express server
├── package.json           # Node.js dependencies and scripts
└── README.md              # This file
```

## 🚀 Features

- **Express.js Server** with security middleware (Helmet, CORS, Morgan)
- **Supabase Database Integration** with PostgreSQL connection pooling
- **Database Migrations** system for schema management
- **Question Management** with support for SAT Math and Reading/Writing questions
- **Test & Module Organization** with flexible ordering and relationships
- **Data Processing Pipeline** for preparing and uploading question data
- **Health Check Endpoint** for monitoring server and database status
- **RESTful API** with proper error handling and validation
- **Sample Data Creation** tools for testing and development

## 📊 Database Schema

The application uses a relational database schema with the following core entities:

- **Tests**: Container for test sessions with unique codes
- **Modules**: Subject-specific test sections with time limits
- **Questions**: Individual SAT questions with metadata and content
- **Junction Tables**: Many-to-many relationships between tests/modules and modules/questions

## 🛠️ Complete Setup Guide

### Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python 3.7+** - [Download here](https://python.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - [Sign up here](https://supabase.com/)

### Step 1: Clone and Navigate to Project

```bash
git clone <your-repository-url>
cd SATBackendProject
```

### Step 2: Install Dependencies

**Install Node.js dependencies:**
```bash
npm install
```

**Install Python dependencies:**
```bash
pip install pandas
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Create the .env file
touch .env  # On Windows: echo. > .env
```

Add the following content to your `.env` file:

```env
# Database Configuration
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres

# Server Configuration
PORT=3000
NODE_ENV=development
```

**How to get your Supabase connection string:**
1. Go to your Supabase dashboard
2. Navigate to Connect at the top of the page
3. Copy the URL under "Session Pooler"
4. Replace `[YOUR-PASSWORD]` with your database password

### Step 4: Run Database Migrations

Set up your database schema:

```bash
npm run migrate
```

This will:
- Create the `schema_migrations` table to track applied migrations
- Apply `001_create_initial_tables.sql` (creates core tables)
- Apply `002_add_order_columns.sql` (adds ordering support)
- Apply etc.

**Expected output:**
```
Connecting to database...
Applying migration: 001_create_initial_tables.sql
Applied 001_create_initial_tables.sql
Applying migration: 002_add_order_columns.sql
Applied 002_add_order_columns.sql
All migrations completed successfully!
```

### Step 5: Test Database Connection

Verify your database setup:

```bash
node scripts/test_db.js
```

**Expected output:**
```
Connecting to database...
Database connection successful!
Total questions in database: 0
Database test completed successfully.
```

### Step 6: Prepare Question Data (Optional)

If you have raw question data, prepare it for upload:

```bash
# For math questions
npm run prep:math

# Or manually with custom parameters
python scripts/prepare_questions.py --input public/math_questions.jsonl --output public/math_questions_prepared.jsonl --limit 100
```

### Step 7: Upload Questions to Database (Optional)

Upload prepared questions to your database:

```bash
# Dry run first to see what would be uploaded
node scripts/upload_questions.js --dry-run --limit 5

# Upload questions (start with a small batch)
node scripts/upload_questions.js --limit 10

# Upload all questions
npm run upload:questions
```

### Step 8: Create Sample Test Data (Optional)

Create sample test data for development:

```bash
node scripts/create_sample_test.js
```

### Step 9: Start the Development Server

```bash
npm run dev
```

**Expected output:**
```
Server running on port 3000
Database connected successfully
```

### Step 10: Verify Installation

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 123.456
}
```

## 📝 Available Scripts

### Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start Production Server | `npm start` | Start the production server using `node server.js` |
| Start Development Server | `npm run dev` | Start development server with nodemon for auto-restart |
| Run Migrations | `npm run migrate` | Execute all pending database migrations |

### Data Management Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Prepare Math Questions | `npm run prep:math` | Process raw math questions for database upload |
| Upload Questions | `npm run upload:questions` | Upload prepared questions to the database |
| Create Sample Test | `npm run create:sample` | Generate sample test data for development |

### Manual Script Execution

| Script | Command | Description |
|--------|---------|-------------|
| Test Database | `node scripts/test_db.js` | Test database connection and display all questions |
| Prepare Questions | `python scripts/prepare_questions.py [options]` | Process raw question data with custom parameters |
| Upload Questions | `node scripts/upload_questions.js [options]` | Upload questions with advanced options |
| Run Migrations | `node scripts/migrate.js` | Manually run database migrations |
| Data Viewer | `python dataViewer.py` | Inspect and analyze question data structure |
| Create Sample Test | `node scripts/create_sample_test.js` | Generate sample test data manually |

## 🔧 Detailed Script Usage

### prepare_questions.py

Processes raw question data for database upload:

```bash
# Basic usage
python scripts/prepare_questions.py

# With custom input/output files
python scripts/prepare_questions.py --input public/math_questions.jsonl --output public/math_questions_prepared.jsonl

# Limit number of questions processed
python scripts/prepare_questions.py --limit 100

# Using npm script
npm run prep:math
```

**Options:**
- `--input`: Input JSONL file path (default: `public/math_questions.jsonl`)
- `--output`: Output JSONL file path (default: `public/math_questions_prepared.jsonl`)
- `--limit`: Maximum number of questions to process (default: all)

### upload_questions.js

Uploads prepared questions to the database:

```bash
# Dry run to preview what would be uploaded
node scripts/upload_questions.js --dry-run --limit 5

# Upload with custom test name
node scripts/upload_questions.js --test-name "My SAT Practice Test" --limit 10

# Upload all questions
node scripts/upload_questions.js

# Upload specific question type
node scripts/upload_questions.js --type math --limit 50

# Using npm script
npm run upload:questions
```

**Options:**
- `--type`: Question type - `math` or `rw` (default: `math`)
- `--input`: Input file path (default: auto-detected based on type)
- `--limit`: Maximum number of questions to upload (default: all)
- `--test-name`: Name for the test (default: "SAT Math Practice Test")
- `--dry-run`: Preview mode without actually uploading

### migrate.js

Manages database schema migrations:

```bash
# Run all pending migrations
node scripts/migrate.js

# Using npm script
npm run migrate
```

**What it does:**
- Creates `schema_migrations` table if it doesn't exist
- Applies all unapplied migration files in order
- Tracks applied migrations to prevent duplicates
- Uses transactions for safe rollback on errors

### test_db.js

Tests database connection and displays data:

```bash
# Test database connection and show all questions
node scripts/test_db.js
```

**Output includes:**
- Database connection status
- Total number of questions
- Sample question data (if any exist)
- Database schema verification

### create_sample_test.js

Creates sample test data for development:

```bash
# Create sample test with modules and questions
node scripts/create_sample_test.js

# Using npm script
npm run create:sample
```

**Creates:**
- Sample test with unique code
- Math and Reading/Writing modules
- Sample questions for each module
- Proper relationships between entities

## 🔧 API Endpoints

### Health Check
- `GET /health` - Server and database status

**Response:**
```json
{
  "status": "ok",
  "db": "connected", 
  "uptime": 123.456
}
```

### API Routes (v1)
- `GET /api/v1/testing/questions` - List questions
- `GET /api/v1/testing/questions/:id` - Get specific question
- `GET /api/v1/testing/tests` - List tests
- `GET /api/v1/testing/tests/:id` - Get specific test

## 📁 Data Processing Pipeline

### Complete Workflow

1. **Raw Data**: Questions stored in JSONL format in `public/` directory
2. **Preparation**: Python script processes and normalizes question data
3. **Upload**: Node.js script uploads prepared questions to Supabase
4. **Verification**: Test script validates database contents
5. **Sample Data**: Create test data for development and testing

### Question Data Format

Questions are processed with the following structure:
- `id`: 8-character alphanumeric identifier
- `attributes`: [test_type, subject, domain, skill]
- `difficulty`: easy/medium/hard
- `prompt`: Question content (HTML)
- `choices_raw`: Answer choices (HTML)
- `rationale`: Explanation text
- `correct_answer`: Correct answer value
- `is_multiple_choice`: Boolean flag

### Supported Question Types

- **Math Questions**: SAT Math section questions with multiple choice answers
- **Reading/Writing Questions**: SAT Evidence-Based Reading and Writing questions

## 🗄️ Database Migrations

The project includes a custom migration system:

- **Migration Files**: SQL files in `migrations/` directory
- **Migration Runner**: `scripts/migrate.js` handles execution
- **Version Tracking**: `schema_migrations` table tracks applied migrations
- **Rollback Support**: Manual rollback capability (transaction-based)

### Migration Files

| File | Description |
|------|-------------|
| `001_create_initial_tables.sql` | Creates core tables (tests, modules, questions, junction tables) |
| `002_add_order_columns.sql` | Adds ordering support to junction tables |

## 🔒 Security Features

- **Helmet.js**: Security headers and protection
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation middleware
- **Environment Variables**: Secure configuration management
- **SSL Connection**: Database connections use SSL encryption

## 🧪 Testing & Development

- **Health Check**: Monitor server and database connectivity
- **Database Testing**: Scripts to verify data integrity
- **Dry Run Mode**: Test data uploads without committing changes
- **Development Mode**: Enhanced error messages and logging
- **Sample Data**: Easy creation of test data for development

## 📈 Monitoring

The application includes basic monitoring capabilities:
- Server uptime tracking
- Database connection status
- Request logging with Morgan
- Error handling with detailed messages in development
- Health check endpoint for external monitoring

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

**Problem**: `Connection terminated unexpectedly`
```bash
Error: Connection terminated unexpectedly
```

**Solution**:
1. Verify your `SUPABASE_DB_URL` in `.env` file
2. Check if your Supabase database is running
3. Ensure your IP is whitelisted in Supabase settings
4. Test connection: `node scripts/test_db.js`

#### Migration Failures

**Problem**: Migration fails with "already exists" error
```bash
Error: relation "tests" already exists
```

**Solution**:
1. Check if migrations were partially applied
2. Connect to database and verify `schema_migrations` table
3. Manually clean up if needed, then re-run migrations

#### Python Script Issues

**Problem**: `ModuleNotFoundError: No module named 'pandas'`
```bash
ModuleNotFoundError: No module named 'pandas'
```

**Solution**:
```bash
pip install pandas
# Or if using virtual environment:
pip install -r requirements.txt
```

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
1. Find and kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID_NUMBER> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```
2. Or change the port in your `.env` file:
   ```env
   PORT=3001
   ```

#### Upload Script Issues

**Problem**: Questions not uploading or errors during upload

**Solution**:
1. Run dry-run first: `node scripts/upload_questions.js --dry-run --limit 5`
2. Check if prepared questions file exists
3. Verify database schema is up to date: `npm run migrate`
4. Check database connection: `node scripts/test_db.js`

### Getting Help

1. **Check the logs**: Look at console output for detailed error messages
2. **Verify setup**: Run through the setup steps again
3. **Test components**: Use individual scripts to isolate issues
4. **Database status**: Check Supabase dashboard for database issues

## 🚧 Development Status

**Completed:**
- ✅ Express server setup with middleware
- ✅ Supabase database integration
- ✅ Database schema and migrations
- ✅ Question data processing pipeline
- ✅ Basic health monitoring
- ✅ RESTful API endpoints
- ✅ Sample data creation tools

**In Progress:**
- 🔄 Authentication middleware implementation
- 🔄 Enhanced input validation system
- 🔄 Performance optimization

**Planned:**
- 📋 User management system
- 📋 Test administration interface
- 📋 Question search and filtering
- 📋 Advanced analytics and reporting

## 🚀 Quick Start Summary

For experienced developers who want to get up and running quickly:

```bash
# 1. Clone and setup
git clone <your-repository-url>
cd SATBackendProject

# 2. Install dependencies
npm install
pip install pandas

# 3. Configure environment
echo "SUPABASE_DB_URL=your_connection_string_here" > .env
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env

# 4. Setup database
npm run migrate

# 5. Test everything
node scripts/test_db.js
npm run dev

# 6. Verify
curl http://localhost:3000/health
```

## 📚 Additional Resources

### Project Documentation
- [Scripts Documentation](scripts/README.md) - Detailed script usage
- [Sample Test Documentation](scripts/README_sample_test.md) - Sample test creation guide

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

### Development Tools
- [Postman](https://www.postman.com/) - API testing
- [pgAdmin](https://www.pgadmin.org/) - Database management
- [VS Code](https://code.visualstudio.com/) - Recommended editor

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the existing code style
4. **Test your changes**:
   ```bash
   npm run migrate
   node scripts/test_db.js
   npm run dev
   ```
5. **Commit your changes**: `git commit -m "Add your feature"`
6. **Push to your branch**: `git push origin feature/your-feature-name`
7. **Submit a pull request**

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for new features
- Ensure all scripts work with the existing setup
- Test with both math and reading/writing questions

## 📄 License

ISC License - see package.json for details

---

**Need help?** Check the troubleshooting section above or create an issue in the repository.
