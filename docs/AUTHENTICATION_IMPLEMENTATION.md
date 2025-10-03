# Authentication Implementation for Submissions

## Overview

The submissions system has been updated to use proper authentication via Supabase JWT tokens. Users are now authenticated and their `user_id` is automatically obtained from the auth token instead of being provided in the request body.

## Changes Made

### 1. Database Migration (`migrations/005_update_user_id_to_uuid.sql`)

**Changed:**
- `user_id` column from `TEXT` to `UUID`
- Added foreign key constraint to `auth.users` table
- Existing submissions deleted (development phase)

**Before:**
```sql
user_id TEXT NOT NULL
```

**After:**
```sql
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

### 2. Controller Updates (`controllers/submissionController.js`)

**Changed:** `createSubmission` method

**Before:**
```javascript
const { userId, testId, initialModuleId } = req.body;
// userId came from request body - INSECURE!
```

**After:**
```javascript
const userId = req.user.id; // From auth middleware - SECURE!
const { testId, initialModuleId } = req.body;
```

### 3. Validation Middleware (`middleware/validation.js`)

**Changed:** Removed `userId` validation from request body

**Before:**
```javascript
if (!userId || typeof userId !== 'string') {
  errors.push('userId is required and must be a string');
}
```

**After:**
```javascript
// userId is now obtained from req.user.id (auth middleware), not from body
// No validation needed
```

### 4. Routes (`routes/v1/testing/submissionRoutes.js`)

**Added:** `verifyToken` middleware to all submission routes

```javascript
const { verifyToken } = require('../../../middleware/auth');

// All submission routes require authentication
router.use(verifyToken);
```

## API Changes

### Previous API (INSECURE)

```javascript
POST /api/v1/submissions
{
  "userId": "user-123",  // ❌ Anyone could impersonate anyone!
  "testId": "test-uuid",
  "initialModuleId": "module-uuid"
}
```

### New API (SECURE)

```javascript
POST /api/v1/submissions
Headers: {
  "Authorization": "Bearer <supabase-jwt-token>"  // ✅ Verified token
}
Body: {
  "testId": "test-uuid",
  "initialModuleId": "module-uuid"
}
// userId automatically extracted from verified token
```

## Authentication Flow

```
1. User logs in via Supabase (frontend)
   ↓
2. Receives JWT access token
   ↓
3. Sends request with token in Authorization header
   ↓
4. verifyToken middleware validates token
   ↓
5. Sets req.user = { id, email, ... }
   ↓
6. Controller uses req.user.id
   ↓
7. Database stores user_id with FK to auth.users
```

## Testing

### Option 1: Test with Real Authentication

```bash
# 1. Create a test user in Supabase Dashboard
# 2. Set environment variables:
export TEST_USER_EMAIL="test@example.com"
export TEST_USER_PASSWORD="yourpassword"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-anon-key"

# 3. Run authenticated tests
npm run test:endpoints:auth
```

### Option 2: Manual Testing with Postman/curl

```bash
# 1. Get access token from Supabase auth
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

## Migration Steps

### For Development

1. **Run migration:**
   ```bash
   npm run migrate
   ```
   This will delete existing submissions and update the schema.

2. **Recreate test:**
   ```bash
   npm run create:sample
   ```

3. **Test with auth:**
   ```bash
   npm run test:endpoints:auth
   ```

### For Production

1. **Backup existing data:**
   ```sql
   CREATE TABLE submissions_backup AS SELECT * FROM submissions;
   ```

2. **Map existing user_ids to UUIDs:**
   ```sql
   -- Example: If you have a mapping table
   UPDATE submissions 
   SET user_id_uuid = users.id 
   FROM users 
   WHERE submissions.user_id = users.old_text_id;
   ```

3. **Run migration** (comment out the DELETE statement first!)

4. **Verify data integrity:**
   ```sql
   SELECT COUNT(*) FROM submissions WHERE user_id IS NULL;
   -- Should return 0
   ```

## Security Benefits

✅ **No Impersonation**: Users cannot create submissions as other users

✅ **Token Verification**: JWT tokens are cryptographically verified

✅ **Expiration**: Tokens expire automatically

✅ **Revocation**: Tokens can be revoked by logging out

✅ **Data Integrity**: Foreign key ensures valid users only

## Frontend Changes Required

### Before (Old Code)
```javascript
const userId = getUserIdSomehow(); // Manually tracked

await fetch('/api/v1/submissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: userId,  // Manually provided
    testId, 
    initialModuleId
  })
});
```

### After (New Code)
```javascript
const { data: { session } } = await supabase.auth.getSession();

await fetch('/api/v1/submissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`  // From Supabase
  },
  body: JSON.stringify({
    testId,
    initialModuleId
    // userId removed - comes from token!
  })
});
```

## Error Handling

### 401 Unauthorized (No Token)
```json
{
  "success": false,
  "message": "No authorization token provided"
}
```

### 401 Unauthorized (Invalid Token)
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 401 Unauthorized (Expired Token)
```json
{
  "success": false,
  "message": "Token has expired"
}
```

### 404 Not Found (User doesn't exist)
```json
{
  "success": false,
  "message": "Foreign key constraint violation"
}
```

## Rollback Plan

If you need to rollback:

```sql
-- 1. Remove foreign key
ALTER TABLE submissions 
DROP CONSTRAINT submissions_user_id_fkey;

-- 2. Change back to TEXT
ALTER TABLE submissions 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3. Remove verifyToken from routes
-- (Code changes)
```

## Additional Security Considerations

### Implemented ✅
- JWT token verification
- User ID from verified token
- Foreign key constraints
- CASCADE delete on user removal

### Future Enhancements 🔮
- Rate limiting per user
- Submission quotas
- User role-based permissions
- Audit logging
- Token refresh logic
- Multi-factor authentication support

## References

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- JWT Verification: `middleware/auth.js`
- Migration: `migrations/005_update_user_id_to_uuid.sql`
- Test Script: `scripts/test_endpoints_with_auth.js`

