# Endpoint Testing Script

This script tests all submission API endpoints to ensure they're working correctly.

## Prerequisites

1. **Server must be running:**
   ```bash
   npm run dev
   ```
   (Run this in a separate terminal window)

2. **Test data must exist:**
   ```bash
   npm run create:sample
   ```

3. **Install axios (if not already installed):**
   ```bash
   npm install axios
   ```

## How to Run

```bash
npm run test:endpoints
```

## What It Tests

The script runs through a complete test-taking flow:

1. ✓ **GET Test by Code** - Retrieves test data
2. ✓ **Create Submission** - Starts a new test submission
3. ✓ **Submit Answers** - Submits answers (including upsert test)
4. ✓ **Get Current Module** - Retrieves active module
5. ✓ **Complete Module** - Completes module and tests adaptive logic
6. ✓ **Get Submission Details** - Retrieves full submission data
7. ✓ **Get User Submissions** - Gets submission history
8. ✓ **Cleanup** - Removes test data

## Expected Output

```
██████████████████████████████████████████████████████████████████████
  SUBMISSION ENDPOINTS TEST SUITE
██████████████████████████████████████████████████████████████████████
ℹ Base URL: http://localhost:3000
ℹ Test Code: SATFL1
ℹ Test User: test-user-1234567890

======================================================================
[Test 1] GET /api/v1/testing/tests/:code
======================================================================
✓ Test retrieved successfully
ℹ Test: SAT Practice Test - Full Length
ℹ Modules: 6
✓ Found RW Module 1: 27 questions, 32 min
✓ Found Math Module 1: 22 questions, 35 min

... (more tests)

██████████████████████████████████████████████████████████████████████
  TEST SUMMARY
██████████████████████████████████████████████████████████████████████
✓ Get Test by Code
✓ Create Submission
✓ Submit Answers
✓ Get Current Module
✓ Complete Module (Adaptive)
✓ Get Submission Details
✓ Get User Submissions

----------------------------------------------------------------------
Total: 7 tests
Passed: 7
Failed: 0
----------------------------------------------------------------------

✓ All tests passed! 🎉
```

## What Gets Verified

### Test 1: GET Test
- Test exists with correct code
- Has all 6 modules
- Modules have correct questions and time limits

### Test 2: Create Submission
- Submission created successfully
- Returns submission ID
- Status is 'in_progress'

### Test 3: Submit Answers
- Answers can be submitted
- Multiple answers submitted at once
- Upsert works (updating existing answers)

### Test 4: Get Current Module
- Returns the active module
- Correct module status

### Test 5: Complete Module
- Module completion works
- Grading calculates scores correctly
- **Adaptive logic works:**
  - Score ≥60% → Assigns hard Module 2
  - Score <60% → Assigns easy Module 2
- Returns next module info

### Test 6: Get Submission
- Full submission data retrieved
- Modules and answers included
- Grading results (is_correct) populated

### Test 7: Get User Submissions
- User submission history retrieved
- Correct count returned

## Troubleshooting

### "Server is not running!"
**Solution:** Start the server first:
```bash
npm run dev
```

### "Test with access code 'SATFL1' not found"
**Solution:** Create the test:
```bash
npm run create:sample
```

### "Cannot find module 'axios'"
**Solution:** Install axios:
```bash
npm install axios
```

### Test fails at "Complete Module"
**Possible causes:**
1. Not enough answers submitted (need at least 1)
2. Module difficulty not set in database
3. No Module 2 variants exist

**Solution:** 
- Run migration: `npm run migrate`
- Recreate test: `npm run create:sample`

### "Adaptive logic unexpected"
This means the score-to-difficulty mapping isn't working as expected.
- Check `utils/satScoring.js::determineModule2Difficulty()`
- Check module difficulty values in database

## Cleanup

The script automatically cleans up test data after running. If you need to manually clean up:

```sql
DELETE FROM submissions WHERE user_id LIKE 'test-user-%';
```

## Configuration

You can customize the script by editing `scripts/test_endpoints.js`:

**Change base URL:**
```javascript
const BASE_URL = 'http://localhost:3001'; // Default: 3000
```

**Change test code:**
```javascript
const TEST_CODE = 'MYTEST'; // Default: SATFL1
```

**Change number of test answers:**
```javascript
const questions = testData.rwModule1.questions.slice(0, 10); // Default: 5
```

## Notes

- This is a **temporary** script for development/testing
- It creates real database records (but cleans up)
- Uses a unique test user ID each run
- Does NOT test authentication (assumes no auth middleware)
- Safe to run multiple times

