const express = require('express');
const SubmissionController = require('../../../controllers/submissionController');
const { verifyToken } = require('../../../middleware/auth');
const { 
  sanitizeInput, 
  validateSubmissionCreate, 
  validateAnswers,
  validateSubmissionId 
} = require('../../../middleware/validation');

const router = express.Router();

// All submission routes require authentication
router.use(verifyToken);

// POST /api/v1/submissions - Create a new submission (start a test)
router.post('/', validateSubmissionCreate, sanitizeInput, SubmissionController.createSubmission);

// GET /api/v1/submissions/:submissionId - Get submission by ID
router.get('/:submissionId', validateSubmissionId, SubmissionController.getSubmission);

// GET /api/v1/submissions/user/:userId - Get all submissions for a user
router.get('/user/:userId', SubmissionController.getUserSubmissions);

// POST /api/v1/submissions/:submissionId/answers - Submit answers for a module
router.post('/:submissionId/answers', validateSubmissionId, validateAnswers, sanitizeInput, SubmissionController.submitAnswers);

// POST /api/v1/submissions/:submissionId/modules/:moduleId/complete - Complete a module
router.post('/:submissionId/modules/:moduleId/complete', validateSubmissionId, SubmissionController.completeModule);

// POST /api/v1/submissions/:submissionId/finalize - Finalize/submit the entire test
router.post('/:submissionId/finalize', validateSubmissionId, SubmissionController.finalizeSubmission);

// GET /api/v1/submissions/:submissionId/current-module - Get current active module
router.get('/:submissionId/current-module', validateSubmissionId, SubmissionController.getCurrentModule);

module.exports = router;

