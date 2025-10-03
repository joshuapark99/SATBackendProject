# Sample Test Creation Script

## Overview

The `create_sample_test.js` script creates a full-length adaptive SAT practice test matching the actual digital SAT format.

## Test Specifications

- **Test Name**: "SAT Practice Test - Full Length"
- **Test Code**: "SATFL1"
- **Total Modules**: 6 modules (for adaptive testing)
- **Student Completes**: 4 modules (98 questions)

### Module Breakdown

| Module | Subject | Difficulty | Questions | Time Limit |
|--------|---------|------------|-----------|------------|
| RW Module 1 | Reading & Writing | Medium | 27 | 32 min |
| RW Module 2 (Easier) | Reading & Writing | Easy | 27 | 32 min |
| RW Module 2 (Harder) | Reading & Writing | Hard | 27 | 32 min |
| Math Module 1 | Math | Medium | 22 | 35 min |
| Math Module 2 (Easier) | Math | Easy | 22 | 35 min |
| Math Module 2 (Harder) | Math | Hard | 22 | 35 min |

**Total Questions in Bank**: 147 questions  
**Student Test Length**: 98 questions (54 RW + 44 Math)  
**Total Test Time**: ~134 minutes (2 hours 14 minutes)

## Prerequisites

1. **Migrations must be run**:
   ```bash
   npm run migrate
   ```
   Required migrations:
   - 001: Core tables
   - 002: Order columns
   - 003: Submissions tables
   - 004: Module difficulty (for adaptive testing)

2. **Questions must be uploaded**:
   ```bash
   npm run upload:questions
   ```
   Requires questions at each difficulty level (easy, medium, hard)

## Usage

```bash
npm run create:sample
```

Or directly:
```bash
node scripts/create_sample_test.js
```

## What the Script Does

### Step 1: Create Test
Creates test record:
- Name: "SAT Practice Test - Full Length"
- Code: "SATFL1"

### Step 2: Create 6 Modules
Creates modules with difficulty levels:
- 3 Reading & Writing modules (easy, medium, hard)
- 3 Math modules (easy, medium, hard)
- Medium = Module 1 (baseline for all students)
- Easy/Hard = Module 2 variants (adaptive)

### Step 3: Link Modules to Test
Associates all 6 modules with the test via `test_modules` junction table.

### Step 4: Select Questions by Difficulty
Queries questions matching each module's:
- Subject (Reading & Writing or Math)
- Difficulty level (easy, medium, hard)
- Required quantity (27 for RW, 22 for Math)

### Step 5: Link Questions to Modules
Creates `module_questions` records with proper ordering.

## Adaptive Testing Flow

```
Student takes test:
  ↓
1. RW Module 1 (27 questions, medium)
  ↓
  Score calculated: e.g., 23/27 = 85%
  ↓
2. RW Module 2 assigned:
   - If 85% ≥ 60% → Module 2 (Harder)
   - If 85% < 60% → Module 2 (Easier)
  ↓
3. Math Module 1 (22 questions, medium)
  ↓
  Score calculated: e.g., 14/22 = 64%
  ↓
4. Math Module 2 assigned:
   - If 64% ≥ 60% → Module 2 (Harder)
   - If 64% < 60% → Module 2 (Easier)
  ↓
Final SAT Score: 400-1600
```

## Output Example

```
Creating full-length adaptive SAT test...

Created test with ID: 509bb367-775c-44d9-be53-0000e4e7fc54

Creating modules...
  Reading and Writing - Module 1 (medium)
  Reading and Writing - Module 2 (Easier) (easy)
  Reading and Writing - Module 2 (Harder) (hard)
  Math - Module 1 (medium)
  Math - Module 2 (Easier) (easy)
  Math - Module 2 (Harder) (hard)

Linking modules to test...
  Linked Reading and Writing - Module 1 (order: 0)
  Linked Reading and Writing - Module 2 (Easier) (order: 1)
  Linked Reading and Writing - Module 2 (Harder) (order: 2)
  Linked Math - Module 1 (order: 3)
  Linked Math - Module 2 (Easier) (order: 4)
  Linked Math - Module 2 (Harder) (order: 5)

Selecting questions by difficulty...
  Reading and Writing - Module 1: 27 medium questions
  Reading and Writing - Module 2 (Easier): 27 easy questions
  Reading and Writing - Module 2 (Harder): 27 hard questions
  Math - Module 1: 22 medium questions
  Math - Module 2 (Easier): 22 easy questions
  Math - Module 2 (Harder): 22 hard questions

Linking questions to modules...
  Reading and Writing - Module 1: 27 questions linked
  Reading and Writing - Module 2 (Easier): 27 questions linked
  Reading and Writing - Module 2 (Harder): 27 hard questions linked
  Math - Module 1: 22 questions linked
  Math - Module 2 (Easier): 22 questions linked
  Math - Module 2 (Harder): 22 questions linked

======================================================================
Full-length adaptive SAT test created successfully!
======================================================================

Reading & Writing Modules:
  0. Reading and Writing - Module 1
     - Difficulty: medium
     - Questions: 27

  1. Reading and Writing - Module 2 (Easier)
     - Difficulty: easy
     - Questions: 27

  2. Reading and Writing - Module 2 (Harder)
     - Difficulty: hard
     - Questions: 27

Math Modules:
  3. Math - Module 1
     - Difficulty: medium
     - Questions: 22

  4. Math - Module 2 (Easier)
     - Difficulty: easy
     - Questions: 22

  5. Math - Module 2 (Harder)
     - Difficulty: hard
     - Questions: 22

----------------------------------------------------------------------
ADAPTIVE TESTING FLOW:
----------------------------------------------------------------------
1. Students begin with RW Module 1 (medium difficulty)
2. Based on Module 1 performance:
   - Score < 60% → Module 2 (Easier)
   - Score ≥ 60% → Module 2 (Harder)
3. Same adaptive pattern for Math modules
4. Final SAT score (400-1600) calculated from both sections

----------------------------------------------------------------------
Total Modules Available: 6
Total Questions in Bank: 147
Student will complete: 4 modules (98 questions)
  - Reading & Writing: 2 modules × 27 = 54 questions
  - Math: 2 modules × 22 = 44 questions
----------------------------------------------------------------------
```

## Database Tables Used

- `tests` - Test information
- `modules` - Module information with difficulty
- `test_modules` - Links tests to modules with order
- `module_questions` - Links modules to questions with order
- `questions` - Source of questions

## Error Handling

The script uses database transactions for data consistency:

- ✅ All operations in single transaction
- ✅ Automatic rollback on any error
- ✅ No partial data left in database
- ✅ Safe to re-run after fixing errors

### Common Errors

**Not enough questions available**:
```
Warning: Only 15 questions available (requested 27)
```

**Solution**: Upload more questions at the required difficulty level.

**Module already exists**:
```
Error: duplicate key value violates unique constraint
```

**Solution**: Delete existing test first:
```sql
DELETE FROM tests WHERE code = 'SATFL1';
-- This cascades to test_modules, but modules remain
DELETE FROM modules WHERE id NOT IN (SELECT DISTINCT module_id FROM test_modules);
```

## Notes

- Questions selected randomly via `ORDER BY RANDOM()`
- Module order is 0-based in database (0, 1, 2, 3, 4, 5)
- All 6 modules linked to test (adaptive logic determines which 4 student takes)
- Difficulty matching ensures appropriate challenge level
- Can run script multiple times with different test codes

## Next Steps After Creation

1. **Start server**: `npm run dev`
2. **Test API**: `npm run test:endpoints:auth`
3. **Use test code**: "SATFL1" to retrieve test via API
4. **Begin submissions**: Students can now take the test

## Customization

Edit `scripts/create_sample_test.js` to customize:

```javascript
// Change test name/code
const testName = 'My Custom Test';
const testCode = 'CUSTOM';

// Change question counts
const rwQuestionsPerModule = 10;  // Default: 27
const mathQuestionsPerModule = 8; // Default: 22

// Change time limits
const rwTimeLimit = 25; // Default: 32
const mathTimeLimit = 30; // Default: 35

// Change adaptive threshold (in utils/satScoring.js)
if (module1Percentage >= 70) { // Default: 60
  return 'hard';
}
```
