# SAT Backend Project

A Node.js/Express backend application for managing SAT test questions, modules, and tests with Supabase database integration.

## 🏗️ Project Structure

```
SATBackendProject/
├── config/
│   └── db.js                 # Database connection configuration
├── middleware/
│   ├── auth.js              # Authentication middleware (placeholder)
│   ├── index.js             # Middleware exports
│   └── validation.js        # Request validation middleware (placeholder)
├── migrations/
│   ├── 001_create_initial_tables.sql    # Core database schema
│   └── 002_add_order_columns.sql        # Ordering support for tests/modules
├── public/
│   ├── math_questions.jsonl             # Raw SAT math questions
│   ├── math_questions_prepared.jsonl    # Processed questions for upload
│   └── rw_questions.jsonl               # Reading/Writing questions
├── scripts/
│   ├── migrate.js                       # Database migration runner
│   ├── prepare_math_questions.py        # Question data preparation
│   ├── upload_questions.js              # Question upload to database
│   ├── test_db.js                       # Database testing utility
│   └── README.md                        # Scripts documentation
├── dataViewer.py                        # Python utility for data inspection
├── server.js                            # Main Express server
├── package.json                         # Node.js dependencies and scripts
└── README.md                            # This file
```

## 🚀 Features

- **Express.js Server** with security middleware (Helmet, CORS, Morgan)
- **Supabase Database Integration** with PostgreSQL connection pooling
- **Database Migrations** system for schema management
- **Question Management** with support for SAT Math and Reading/Writing questions
- **Test & Module Organization** with flexible ordering and relationships
- **Data Processing Pipeline** for preparing and uploading question data
- **Health Check Endpoint** for monitoring server and database status

## 📊 Database Schema

The application uses a relational database schema with the following core entities:

- **Tests**: Container for test sessions with unique codes
- **Modules**: Subject-specific test sections with time limits
- **Questions**: Individual SAT questions with metadata and content
- **Junction Tables**: Many-to-many relationships between tests/modules and modules/questions

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python 3.7+ (for data processing scripts)
- Supabase account and database

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
SUPABASE_DB_URL=postgresql://username:password@host:port/database
PORT=3000
NODE_ENV=development
```

**Required Environment Variables:**
- `SUPABASE_DB_URL`: Your Supabase PostgreSQL connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SATBackendProject
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies** (for data processing)
   ```bash
   pip install pandas
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env  # If you have an example file
   # Edit .env with your actual values
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

### Development
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run pending database migrations

### Data Management
- `npm run prep:math` - Prepare math questions for upload
- `npm run upload:questions` - Upload prepared questions to database
- `npm run reset:db` - Reset database (if script exists)

### Manual Scripts
- `node scripts/test_db.js` - Test database connection and view questions
- `python scripts/prepare_math_questions.py` - Process raw question data
- `python dataViewer.py` - Inspect question data structure

## 🔧 API Endpoints

### Health Check
- `GET /health` - Server and database status

### Future Endpoints (Placeholder)
- Authentication routes (planned)
- Question management routes (planned)
- Test administration routes (planned)

## 📁 Data Processing Pipeline

1. **Raw Data**: Questions stored in JSONL format in `public/` directory
2. **Preparation**: Python script processes and normalizes question data
3. **Upload**: Node.js script uploads prepared questions to Supabase
4. **Verification**: Test script validates database contents

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

## 🗄️ Database Migrations

The project includes a custom migration system:

- **Migration Files**: SQL files in `migrations/` directory
- **Migration Runner**: `scripts/migrate.js` handles execution
- **Version Tracking**: `schema_migrations` table tracks applied migrations
- **Rollback Support**: Manual rollback capability (transaction-based)

## 🔒 Security Features

- **Helmet.js**: Security headers and protection
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation middleware (placeholder)
- **Authentication**: JWT-based auth system (planned)

## 🧪 Testing & Development

- **Health Check**: Monitor server and database connectivity
- **Database Testing**: Scripts to verify data integrity
- **Dry Run Mode**: Test data uploads without committing changes
- **Development Mode**: Enhanced error messages and logging

## 📈 Monitoring

The application includes basic monitoring capabilities:
- Server uptime tracking
- Database connection status
- Request logging with Morgan
- Error handling with detailed messages in development

## 🚧 Development Status

**Completed:**
- ✅ Express server setup with middleware
- ✅ Supabase database integration
- ✅ Database schema and migrations
- ✅ Question data processing pipeline
- ✅ Basic health monitoring

**In Progress:**
- 🔄 Authentication middleware implementation
- 🔄 API route development
- 🔄 Input validation system

**Planned:**
- 📋 User management system
- 📋 Test administration interface
- 📋 Question search and filtering
- 📋 Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and migrations
5. Submit a pull request

## 📄 License

ISC License - see package.json for details
