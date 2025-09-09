# Scripts

This directory contains utility scripts for the SAT Backend Project.

## prepare_math_questions.py

Prepares math questions from the raw JSONL format for database upload.

**Usage:**
```bash
python scripts/prepare_math_questions.py [--input INPUT_FILE] [--output OUTPUT_FILE] [--limit N]
```

**Example:**
```bash
python scripts/prepare_math_questions.py --limit 100
```

## upload_questions.js

Uploads prepared questions to the Supabase database.

**Prerequisites:**
1. Install Node.js dependencies: `npm install`
2. Set the `SUPABASE_DB_URL` environment variable
3. Ensure the database migrations have been run (including migration 0005 for decoupled schema)

**Usage:**
```bash
node scripts/upload_questions.js [--input INPUT_FILE] [--limit N] [--test-name NAME] [--dry-run]
```

**Examples:**
```bash
# Dry run to see what would be uploaded
node scripts/upload_questions.js --dry-run --limit 5

# Upload first 10 questions
node scripts/upload_questions.js --limit 10

# Upload all questions with custom test name
node scripts/upload_questions.js --test-name "My SAT Practice Test"

# Using npm script
npm run upload:questions -- --limit 10
```

**Environment Variables:**
- `SUPABASE_DB_URL`: PostgreSQL connection string for Supabase database

**Features:**
- Uploads questions independently (no test/module creation required)
- Skips existing questions (based on ID)
- Handles batch uploads with progress reporting
- Supports dry-run mode for testing
- Error handling and rollback on failures
- Uses existing Node.js database configuration
- Verifies database schema before upload
