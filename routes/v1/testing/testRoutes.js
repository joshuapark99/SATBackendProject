const express = require('express');
const TestController = require('../../../controllers/testController');
const { validateTestCode, sanitizeInput } = require('../../../middleware/validation');

const router = express.Router();

// GET /api/v1/testing/tests - Get all tests (basic info)
router.get('/', TestController.getAllTests);

// GET /api/v1/testing/tests/:code - Get test by access code with modules and questions
router.get('/:code', validateTestCode, TestController.getTestByCode);

// POST /api/v1/testing/tests - Create a new test
// router.post('/', sanitizeInput, TestController.createTest);

module.exports = router;
