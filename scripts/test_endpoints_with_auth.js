/**
 * Test script for submission endpoints WITH authentication
 * 
 * This script tests the authenticated submission endpoints.
 * 
 * Setup Options:
 * 
 * Option 1: Use real Supabase authentication (RECOMMENDED)
 * --------------------------------------------------------
 * 1. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env
 * 2. Create a test user in Supabase
 * 3. Set TEST_USER_EMAIL and TEST_USER_PASSWORD below
 * 
 * Option 2: Bypass auth for testing (DEV ONLY)
 * -------------------------------------------
 * 1. Temporarily remove verifyToken middleware from routes
 * 2. Set USE_AUTH = false below
 * 
 * Prerequisites:
 * - Server must be running: npm run dev
 * - Test must exist: npm run create:sample
 * - Migration 005 must be run: npm run migrate
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_CODE = 'SATFL1';

// Authentication configuration
const USE_AUTH = true; // Set to false to bypass auth (requires removing middleware)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test user credentials (create this user in Supabase Dashboard)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

// ============================================================================

// Store data between test steps
let testData = {
  test: null,
  submission: null,
  rwModule1: null,
  rwModule2: null,
  mathModule1: null,
  mathModule2: null,
  accessToken: null,
  userId: null
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to make authenticated requests
function makeRequest(config) {
  if (USE_AUTH && testData.accessToken) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${testData.accessToken}`
    };
  }
  return axios(config);
}

// Authenticate and get access token
async function authenticate() {
  log('\n' + '='.repeat(70), 'blue');
  log('[Auth] Authenticating with Supabase', 'blue');
  log('='.repeat(70), 'blue');

  if (!USE_AUTH) {
    logWarning('Authentication bypassed (USE_AUTH = false)');
    testData.userId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    return true;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logError('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    return false;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (error) {
      logError(`Authentication failed: ${error.message}`);
      logInfo('Please create a test user in Supabase Dashboard or set credentials');
      return false;
    }

    if (!data.session) {
      logError('No session returned from Supabase');
      return false;
    }

    testData.accessToken = data.session.access_token;
    testData.userId = data.user.id;

    logSuccess('Authentication successful');
    logInfo(`User ID: ${testData.userId}`);
    logInfo(`Email: ${data.user.email}`);
    logInfo(`Token expires: ${new Date(data.session.expires_at * 1000).toISOString()}`);

    return true;
  } catch (error) {
    logError(`Authentication error: ${error.message}`);
    return false;
  }
}

// Test 1: Get Test by Code
async function testGetTest() {
  log('\n' + '='.repeat(70), 'blue');
  log('[Test 1] GET /api/v1/testing/tests/:code', 'blue');
  log('='.repeat(70), 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/testing/tests/${TEST_CODE}`);
    
    if (response.data.success && response.data.data) {
      testData.test = response.data.data;
      logSuccess('Test retrieved successfully');
      logInfo(`Test: ${testData.test.name}`);
      logInfo(`Modules: ${testData.test.modules.length}`);
      
      // Find specific modules
      testData.rwModule1 = testData.test.modules.find(
        m => m.subject_name === 'Reading and Writing' && m.difficulty === 'medium'
      );
      testData.mathModule1 = testData.test.modules.find(
        m => m.subject_name === 'Math' && m.difficulty === 'medium'
      );
      
      if (testData.rwModule1) {
        logSuccess(`Found RW Module 1: ${testData.rwModule1.questions.length} questions`);
      }
      
      if (testData.mathModule1) {
        logSuccess(`Found Math Module 1: ${testData.mathModule1.questions.length} questions`);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    logError(`Failed: ${error.message}`);
    return false;
  }
}

// Test 2: Create Submission (with auth)
async function testCreateSubmission() {
  log('\n' + '='.repeat(70), 'blue');
  log('[Test 2] POST /api/v1/submissions (Authenticated)', 'blue');
  log('='.repeat(70), 'blue');
  
  if (!testData.test || !testData.rwModule1) {
    logError('Test data not available. Skipping...');
    return false;
  }
  
  try {
    const response = await makeRequest({
      method: 'POST',
      url: `${BASE_URL}/api/v1/submissions`,
      data: {
        // userId is now obtained from auth token, not from body
        testId: testData.test.id,
        initialModuleId: testData.rwModule1.id
      }
    });
    
    if (response.data.success && response.data.data) {
      testData.submission = response.data.data.submission;
      logSuccess('Submission created successfully');
      logInfo(`Submission ID: ${testData.submission.id}`);
      logInfo(`User ID from auth: ${testData.submission.user_id}`);
      logInfo(`Status: ${testData.submission.status}`);
      
      // Verify user_id matches authenticated user
      if (testData.submission.user_id === testData.userId) {
        logSuccess('User ID correctly set from auth token');
      } else {
        logWarning(`User ID mismatch: ${testData.submission.user_id} vs ${testData.userId}`);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    logError(`Failed: ${error.message}`);
    if (error.response?.data) {
      console.error(error.response.data);
    }
    return false;
  }
}

// Test 3: Submit Answers
async function testSubmitAnswers() {
  log('\n' + '='.repeat(70), 'blue');
  log('[Test 3] POST /api/v1/submissions/:submissionId/answers', 'blue');
  log('='.repeat(70), 'blue');
  
  if (!testData.submission || !testData.rwModule1) {
    logError('Required data not available. Skipping...');
    return false;
  }
  
  try {
    const questions = testData.rwModule1.questions.slice(0, 5);
    const answers = questions.map((q, index) => ({
      questionId: q.id,
      submittedAnswer: ['A', 'B', 'C', 'D'][index % 4],
      timeSpentSeconds: 30 + index * 10
    }));
    
    const response = await makeRequest({
      method: 'POST',
      url: `${BASE_URL}/api/v1/submissions/${testData.submission.id}/answers`,
      data: {
        moduleId: testData.rwModule1.id,
        answers: answers
      }
    });
    
    if (response.data.success) {
      logSuccess(`Submitted ${response.data.data.length} answers`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Failed: ${error.message}`);
    return false;
  }
}

// Test 4: Complete Module
async function testCompleteModule() {
  log('\n' + '='.repeat(70), 'blue');
  log('[Test 4] POST /api/v1/submissions/:submissionId/modules/:moduleId/complete', 'blue');
  log('='.repeat(70), 'blue');
  
  if (!testData.submission || !testData.rwModule1) {
    logError('Required data not available. Skipping...');
    return false;
  }
  
  try {
    const response = await makeRequest({
      method: 'POST',
      url: `${BASE_URL}/api/v1/submissions/${testData.submission.id}/modules/${testData.rwModule1.id}/complete`
    });
    
    if (response.data.success && response.data.data) {
      const { currentModuleScore, nextModule } = response.data.data;
      
      logSuccess('Module completed successfully');
      logInfo(`Score: ${currentModuleScore.raw_score}/${currentModuleScore.total_questions}`);
      logInfo(`Percentage: ${currentModuleScore.percentage}%`);
      
      if (nextModule) {
        logSuccess(`Next module assigned: ${nextModule.name}`);
        logInfo(`Difficulty: ${nextModule.difficulty}`);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    logError(`Failed: ${error.message}`);
    return false;
  }
}

// Cleanup
async function cleanup() {
  log('\n' + '='.repeat(70), 'blue');
  log('[Cleanup] Deleting test submission', 'blue');
  log('='.repeat(70), 'blue');
  
  if (!testData.submission) {
    logInfo('No submission to clean up');
    return;
  }
  
  try {
    const pool = require('../config/db');
    await pool.query('DELETE FROM submissions WHERE id = $1', [testData.submission.id]);
    logSuccess('Test submission deleted');
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  log('\n' + '█'.repeat(70), 'cyan');
  log('  AUTHENTICATED SUBMISSION ENDPOINTS TEST', 'cyan');
  log('█'.repeat(70), 'cyan');
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Auth Mode: ${USE_AUTH ? 'ENABLED' : 'BYPASSED'}`);
  
  // Debug: Show environment variables status
  if (USE_AUTH) {
    logInfo(`SUPABASE_URL: ${SUPABASE_URL ? '✓ Set' : '✗ Not set'}`);
    logInfo(`SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set'}`);
    logInfo(`TEST_USER_EMAIL: ${TEST_USER_EMAIL}`);
  }
  
  // Authenticate first
  const authenticated = await authenticate();
  if (!authenticated && USE_AUTH) {
    logError('Authentication failed. Cannot proceed with tests.');
    logInfo('\nSetup Instructions:');
    logInfo('1. Create a test user in Supabase Dashboard');
    logInfo('2. Set TEST_USER_EMAIL and TEST_USER_PASSWORD in script or .env');
    logInfo('3. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
    process.exit(1);
  }
  
  const results = { passed: 0, failed: 0, tests: [] };
  
  const tests = [
    { name: 'Get Test by Code', fn: testGetTest },
    { name: 'Create Submission (Auth)', fn: testCreateSubmission },
    { name: 'Submit Answers', fn: testSubmitAnswers },
    { name: 'Complete Module', fn: testCompleteModule }
  ];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.tests.push({ name: test.name, passed });
      passed ? results.passed++ : results.failed++;
      await sleep(500);
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      results.tests.push({ name: test.name, passed: false });
      results.failed++;
    }
  }
  
  await cleanup();
  
  // Summary
  log('\n' + '█'.repeat(70), 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('█'.repeat(70), 'cyan');
  
  results.tests.forEach(test => {
    test.passed ? logSuccess(test.name) : logError(test.name);
  });
  
  log('\n' + '-'.repeat(70));
  log(`Total: ${results.passed + results.failed} tests`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('-'.repeat(70));
  
  if (results.failed === 0) {
    log('\n✓ All tests passed! 🎉', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed', 'red');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/v1/testing/tests`);
    return true;
  } catch (error) {
    return false;
  }
}

// Run
if (require.main === module) {
  checkServer().then(isRunning => {
    if (!isRunning) {
      logError('Server is not running!');
      logInfo('Please start the server first: npm run dev');
      process.exit(1);
    }
    
    runTests().catch(error => {
      logError(`Test suite failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
  });
}

module.exports = { runTests };

