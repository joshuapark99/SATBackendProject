# Sample Test Creation Script

## Overview

The `create_sample_test.js` script creates a sample SAT test with the following specifications:

- **Test Name**: "sample test 1"
- **Test Code**: "1A2B3C"
- **Modules**: 4 modules total
  - 2 Reading and Writing modules (order 1, 2)
  - 2 Math modules (order 3, 4)
- **Questions**: 2 random questions per module (8 questions total)

## Usage

### Prerequisites

1. Ensure the database is set up and migrated:
   ```bash
   npm run migrate
   ```

2. Make sure questions are uploaded to the database:
   ```bash
   npm run upload:questions
   ```

### Running the Script

```bash
npm run create:sample
```

Or directly:
```bash
node scripts/create_sample_test.js
```

## What the Script Does

1. **Creates a test** with name "sample test 1" and code "1A2B3C"
2. **Creates 4 modules**:
   - Reading and Writing Module 1 (32 minutes)
   - Reading and Writing Module 2 (32 minutes)
   - Math Module 1 (32 minutes)
   - Math Module 2 (32 minutes)
3. **Links modules to test** with proper order numbers (0-based indexing)
4. **Selects random questions**:
   - 4 random Reading and Writing questions
   - 4 random Math questions
5. **Distributes questions** to modules:
   - RW Module 1: 2 RW questions
   - RW Module 2: 2 RW questions
   - Math Module 1: 2 Math questions
   - Math Module 2: 2 Math questions

## Output

The script provides detailed console output showing:
- Test creation confirmation
- Module creation with IDs
- Question selection details
- Linking confirmation
- Final summary with all IDs and question distribution

## Database Tables Used

- `tests` - Stores the test information
- `modules` - Stores module information
- `test_modules` - Junction table linking tests to modules with order
- `module_questions` - Junction table linking modules to questions with order
- `questions` - Source of random questions

## Error Handling

The script uses database transactions to ensure data consistency. If any step fails, all changes are rolled back.

## Notes

- The script uses `ORDER BY RANDOM()` for question selection, which provides truly random selection
- Order numbers in junction tables are 0-based (0, 1, 2, 3)
- Each module has a 32-minute time limit (standard SAT module timing)
- The script can be run multiple times to create additional sample tests
