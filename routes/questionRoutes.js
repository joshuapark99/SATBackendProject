const express = require('express');
const QuestionController = require('../controllers/questionController');
const { validateQuestion, sanitizeInput, validateUUID, validateAltId } = require('../middleware/validation');

const router = express.Router();

// GET /api/v1/testing/question - Get all questions with optional filtering
router.get('/', QuestionController.getAllQuestions);

// GET /api/v1/testing/question/stats - Get question statistics
router.get('/stats', QuestionController.getQuestionStats);

// GET /api/v1/testing/question/filter-options - Get available filter options
router.get('/filter-options', QuestionController.getFilterOptions);

// GET /api/v1/testing/question/alt/:alt_id - Get a single question by alt_id
router.get('/alt/:alt_id', validateAltId, QuestionController.getQuestionByAltId);

// GET /api/v1/testing/question/:id - Get a single question by ID
router.get('/:id', validateUUID, QuestionController.getQuestionById);

// POST /api/v1/testing/question - Create a new question
router.post('/', sanitizeInput, validateQuestion, QuestionController.createQuestion);

// PUT /api/v1/testing/question/:id - Update a question
router.put('/:id', validateUUID, sanitizeInput, validateQuestion, QuestionController.updateQuestion);

// DELETE /api/v1/testing/question/:id - Delete a question
router.delete('/:id', validateUUID, QuestionController.deleteQuestion);

module.exports = router;
