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

## create_sample_test.js

Creates a full-length adaptive SAT test with all modules and questions.

**Usage:**
```bash
npm run create:sample
```

**What it creates:**
- 1 test with code `SATFL1`
- 6 modules (3 Reading & Writing, 3 Math)
  - Module 1s: Medium difficulty (baseline for all students)
  - Module 2 Easy: Assigned if student scores < 60% on Module 1
  - Module 2 Hard: Assigned if student scores ≥ 60% on Module 1
- Reading & Writing modules: 27 questions each
- Math modules: 22 questions each
- Total: 147 questions (students complete 98 questions total)

---

# Student Test-Taking Flow & API Guide

This section describes the complete flow for a student taking an adaptive SAT test and the required API calls.

## Overview

The SAT test uses adaptive testing:
1. All students start with **Module 1** (medium difficulty)
2. Based on Module 1 performance, students are assigned **Module 2** (easy or hard)
3. Final score is calculated from both modules per section
4. Total SAT score ranges from 400-1600

## 🔒 Authentication

### Authenticated Endpoints (Require JWT Token)

All **submission endpoints** require authentication via Supabase JWT token:

| Endpoint | Method | Requires Auth |
|----------|--------|---------------|
| `/api/v1/submissions` | POST | ✅ Yes |
| `/api/v1/submissions/:submissionId` | GET | ✅ Yes |
| `/api/v1/submissions/user/:userId` | GET | ✅ Yes |
| `/api/v1/submissions/:submissionId/answers` | POST | ✅ Yes |
| `/api/v1/submissions/:submissionId/modules/:moduleId/complete` | POST | ✅ Yes |
| `/api/v1/submissions/:submissionId/finalize` | POST | ✅ Yes |
| `/api/v1/submissions/:submissionId/current-module` | GET | ✅ Yes |

### Public Endpoints (No Auth Required)

| Endpoint | Method | Requires Auth |
|----------|--------|---------------|
| `/api/v1/testing/tests` | GET | ❌ No |
| `/api/v1/testing/tests/:code` | GET | ❌ No |
| `/api/v1/testing/question` | GET | ❌ No |

### How Authentication Works

1. **User authenticates** with Supabase (frontend)
2. **Receives JWT access token** from Supabase
3. **Includes token in requests**:
   ```javascript
   headers: {
     'Authorization': 'Bearer <access-token>'
   }
   ```
4. **Backend verifies token** using Supabase's JWKS endpoint
5. **Extracts user ID** from verified token (`req.user.id`)
6. **User ID is stored** in submissions (cannot be spoofed)

### Getting an Access Token

**Frontend (JavaScript/React):**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign in
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

if (session) {
  const accessToken = session.access_token;
  // Use this token in API requests
}
```

**cURL (for testing):**
```bash
# 1. Get token from Supabase
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'

# 2. Use token in requests
curl -X POST 'http://localhost:3000/api/v1/submissions' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testId":"test-uuid","initialModuleId":"module-uuid"}'
```

### Error Responses

**401 Unauthorized - No Token:**
```json
{
  "success": false,
  "message": "No authorization token provided"
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**401 Unauthorized - Expired Token:**
```json
{
  "success": false,
  "message": "Token has expired"
}
```

### Important Notes

- ⚠️ **User ID is NOT sent in request body** - it's extracted from the JWT token
- ✅ **Tokens expire automatically** - frontend must handle token refresh
- 🔒 **Foreign key constraint** - `user_id` must exist in `auth.users` table
- 🔐 **No impersonation possible** - users can only create submissions for themselves

## Complete API Flow

### Step 1: Get Test Details

**Endpoint:** `GET /api/v1/testing/tests/:code`

**Example:**
```bash
GET /api/v1/testing/tests/SATFL1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-test",
    "name": "SAT Practice Test - Full Length",
    "code": "SATFL1",
    "modules": [
      {
        "id": "uuid-rw-module-1",
        "name": "Reading and Writing - Module 1",
        "subject_name": "Reading and Writing",
        "time_limit": 32,
        "order": 0,
        "questions": [
          {
            "id": "uuid-question-1",
            "question_prompt": "...",
            "question_choices": "...",
            "is_multiple_choice": true,
            "order": 0
          }
          // ... 26 more questions
        ]
      }
      // ... 5 more modules
    ]
  }
}
```

**Frontend Action:** 
- Store test data
- Display test introduction
- Show first module: `modules[0]` (RW Module 1)

---

### Step 2: Start the Test (Create Submission)

**Endpoint:** `POST /api/v1/submissions`

**🔒 Requires Authentication**

**Headers:**
```json
{
  "Authorization": "Bearer <jwt-access-token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "testId": "uuid-of-test",
  "initialModuleId": "uuid-rw-module-1"
}
```

**Note:** `userId` is automatically extracted from the JWT token, not sent in the body.

**Response:**
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "uuid-submission",
      "user_id": "user-123",
      "test_id": "uuid-of-test",
      "status": "in_progress",
      "created_at": "2024-01-15T10:00:00Z"
    },
    "currentModule": {
      "id": "uuid-submission-module",
      "module_id": "uuid-rw-module-1",
      "order_in_test": 1,
      "status": "not_started"
    }
  }
}
```

**Frontend Action:**
- Store `submission.id` for all subsequent calls
- Start timer for module
- Display first question

---

### Step 3: Submit Answers (As Student Progresses)

**Endpoint:** `POST /api/v1/submissions/:submissionId/answers`

**🔒 Requires Authentication**

**When to call:** 
- After each question (auto-save)
- OR when student clicks "Next"
- OR periodically (every 30 seconds)

**Request Body:**
```json
{
  "moduleId": "uuid-rw-module-1",
  "answers": [
    {
      "questionId": "uuid-question-1",
      "submittedAnswer": "A",
      "timeSpentSeconds": 45
    },
    {
      "questionId": "uuid-question-2",
      "submittedAnswer": "C",
      "timeSpentSeconds": 62
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-answer-1",
      "question_id": "uuid-question-1",
      "submitted_answer": "A",
      "time_spent_seconds": 45
    }
  ],
  "message": "Answers submitted successfully"
}
```

**Frontend Action:**
- Show confirmation (saved indicator)
- Continue to next question
- Can submit multiple times (answers are upserted)

---

### Step 4: Complete Module (Finish Module)

**Endpoint:** `POST /api/v1/submissions/:submissionId/modules/:moduleId/complete`

**🔒 Requires Authentication**

**When to call:** When student clicks "Submit Module" after all questions answered

**Example:**
```bash
POST /api/v1/submissions/uuid-submission/modules/uuid-rw-module-1/complete
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentModuleScore": {
      "raw_score": 23,
      "total_questions": 27,
      "percentage": 85.19,
      "scaled_score": 750
    },
    "nextModule": {
      "id": "uuid-rw-module-2-hard",
      "name": "Reading and Writing - Module 2 (Harder)",
      "subject_name": "Reading and Writing",
      "time_limit": 32
    }
  },
  "message": "Module completed successfully"
}
```

**Frontend Action:**
- Show module completion screen (optional: show score)
- Display break timer (optional)
- Load next module questions from original test data
- Repeat Steps 3-4 for next module

**Adaptive Logic:**
- If `percentage < 60%` → nextModule is "Module 2 (Easier)"
- If `percentage ≥ 60%` → nextModule is "Module 2 (Harder)"

---

### Step 5: Repeat for All Modules

**Sequence:**
1. Complete RW Module 1 → Get RW Module 2 (Easy or Hard)
2. Complete RW Module 2 → Move to Math section
3. Complete Math Module 1 → Get Math Module 2 (Easy or Hard)
4. Complete Math Module 2 → Ready to finalize

**Between sections:** Show optional break screen

---

### Step 6: Finalize Test (Submit Final Test)

**Endpoint:** `POST /api/v1/submissions/:submissionId/finalize`

**🔒 Requires Authentication**

**When to call:** After all 4 modules are completed

**Example:**
```bash
POST /api/v1/submissions/uuid-submission/finalize
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-submission",
    "status": "submitted",
    "score": {
      "sections": {
        "readingWriting": {
          "scaled_score": 720,
          "module1_score": 23,
          "module2_score": 21
        },
        "math": {
          "scaled_score": 730,
          "module1_score": 18,
          "module2_score": 19
        }
      },
      "total": 1450,
      "percentile": 95
    },
    "submitted_at": "2024-01-15T12:30:00Z"
  },
  "message": "Test submitted successfully"
}
```

**Frontend Action:**
- Show final score screen
- Display section breakdowns
- Show percentile
- Provide option to review answers

---

### Step 7: Get Submission Details (View Results)

**Endpoint:** `GET /api/v1/submissions/:submissionId`

**🔒 Requires Authentication**

**Example:**
```bash
GET /api/v1/submissions/uuid-submission
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-submission",
    "user_id": "user-123",
    "test_id": "uuid-of-test",
    "status": "submitted",
    "score": { /* full score object */ },
    "modules": [
      {
        "id": "uuid-submission-module-1",
        "module_name": "Reading and Writing - Module 1",
        "status": "completed",
        "score": {
          "raw_score": 23,
          "total_questions": 27,
          "percentage": 85.19
        },
        "answers": [
          {
            "question_id": "uuid-question-1",
            "submitted_answer": "A",
            "is_correct": true,
            "time_spent_seconds": 45
          }
          // ... all answers
        ]
      }
      // ... other modules
    ]
  }
}
```

**Frontend Action:**
- Show detailed results
- Display question-by-question review
- Show correct answers (if enabled)
- Show time spent per question

---

### Optional: Get User's Test History

**Endpoint:** `GET /api/v1/submissions/user/:userId`

**🔒 Requires Authentication**

**Example:**
```bash
GET /api/v1/submissions/user/user-123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-submission-1",
      "test_name": "SAT Practice Test - Full Length",
      "test_code": "SATFL1",
      "status": "submitted",
      "score": { "total": 1450 },
      "submitted_at": "2024-01-15T12:30:00Z"
    }
    // ... other submissions
  ],
  "count": 1
}
```

**Frontend Action:**
- Show test history dashboard
- Allow user to view past results

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev mode only)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created (new submission)
- `400` - Bad request (validation error)
- `404` - Not found (test/submission not found)
- `500` - Server error

**Frontend should handle:**
- Network errors (retry logic)
- Validation errors (show user-friendly messages)
- Session timeouts (save progress, allow resume)
- Browser refresh (restore from submission ID)

---

## State Management Tips

**Frontend should track:**
- `submissionId` - For all API calls after starting test
- `currentModuleId` - Which module student is on
- `currentQuestionIndex` - Position in module
- `answers` - Local cache for auto-save
- `timeRemaining` - Per-module timer

**Save to localStorage:**
- Submission ID (to resume after refresh)
- Current progress (module/question)
- Unsaved answers

**Clear on:**
- Test finalization
- User logout
- Starting new test

---

## Testing the API Flow

You can test the complete flow using curl or Postman:

```bash
# 0. Get authentication token first (from Supabase)
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'
# Save the "access_token" from the response

# Set token as variable
TOKEN="your-access-token-here"

# 1. Get test (no auth required)
curl -X GET http://localhost:3000/api/v1/testing/tests/SATFL1

# 2. Start test (requires auth)
curl -X POST http://localhost:3000/api/v1/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testId":"[test-id]","initialModuleId":"[module-id]"}'

# 3. Submit answers (requires auth)
curl -X POST http://localhost:3000/api/v1/submissions/[submission-id]/answers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moduleId":"[module-id]","answers":[{"questionId":"[q-id]","submittedAnswer":"A","timeSpentSeconds":30}]}'

# 4. Complete module (requires auth)
curl -X POST http://localhost:3000/api/v1/submissions/[submission-id]/modules/[module-id]/complete \
  -H "Authorization: Bearer $TOKEN"

# 5. Finalize test (requires auth)
curl -X POST http://localhost:3000/api/v1/submissions/[submission-id]/finalize \
  -H "Authorization: Bearer $TOKEN"

# 6. Get results (requires auth)
curl -X GET http://localhost:3000/api/v1/submissions/[submission-id] \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Testing

Run the automated test script with authentication:

```bash
# Setup (one-time)
# 1. Create test user in Supabase Dashboard
# 2. Add to .env file:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=yourpassword

# Run tests
npm run test:endpoints:auth
```